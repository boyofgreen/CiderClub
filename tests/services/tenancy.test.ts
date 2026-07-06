import { describe, it, expect, beforeEach } from 'vitest'
import { prisma, resetDb } from '../helpers/prismaTestClient'
import { resetSquareState } from '../helpers/squareMock'
import { createPlan, createProduct, createMember, createQuarter, setSalesTax } from '../helpers/fixtures'
import { runWithOrg, registerRequestOrgResolver, DEFAULT_ORG_ID } from '../../src/lib/tenancy'
import { generateQuarterOrders } from '@/services/orders'
import { getSalesTaxPercent, setSetting } from '@/lib/settings'

beforeEach(async () => {
  await resetDb()
  resetSquareState()
})

async function createSecondOrg() {
  return prisma.organization.create({
    data: { name: 'Bluebird Cidery', slug: 'bluebird-cidery' },
  })
}

describe('tenant scoping', () => {
  it('stamps creates with the default org when no context is set', async () => {
    const plan = await createPlan()
    const member = await createMember(plan.id)
    expect(member.organizationId).toBe(DEFAULT_ORG_ID)
  })

  it('stamps creates with the context org inside runWithOrg', async () => {
    const org = await createSecondOrg()
    const plan = await runWithOrg(org.id, () => createPlan())
    expect(plan.organizationId).toBe(org.id)
  })

  it('reads are isolated between orgs', async () => {
    const org = await createSecondOrg()
    const defaultPlan = await createPlan()
    await createMember(defaultPlan.id)

    const otherOrgMembers = await runWithOrg(org.id, () => prisma.member.findMany())
    expect(otherOrgMembers).toHaveLength(0)

    const defaultMembers = await prisma.member.findMany()
    expect(defaultMembers).toHaveLength(1)
  })

  it('allows the same member email in two different orgs', async () => {
    const org = await createSecondOrg()
    const email = 'same-person@test.local'

    const planA = await createPlan()
    await createMember(planA.id, { email })

    const memberB = await runWithOrg(org.id, async () => {
      const planB = await createPlan()
      return createMember(planB.id, { email })
    })

    expect(memberB.email).toBe(email)
    expect(memberB.organizationId).toBe(org.id)
    expect(await prisma.member.count()).toBe(1) // default-org view
  })

  it('rejects duplicate emails within the same org', async () => {
    const plan = await createPlan()
    await createMember(plan.id, { email: 'dupe@test.local' })
    await expect(createMember(plan.id, { email: 'dupe@test.local' })).rejects.toThrow()
  })

  it('settings are isolated between orgs', async () => {
    const org = await createSecondOrg()
    await setSalesTax('5')
    await runWithOrg(org.id, () => setSetting('salesTaxPercent', '9'))

    expect(await getSalesTaxPercent()).toBe(5)
    expect(await runWithOrg(org.id, () => getSalesTaxPercent())).toBe(9)
  })

  it('request-scope resolver scopes queries, and runWithOrg overrides it', async () => {
    const org = await createSecondOrg()
    const plan = await createPlan() // default org
    await createMember(plan.id)

    // Simulate middleware-driven request scope: resolver says "org B"
    registerRequestOrgResolver(async () => org.id)
    try {
      expect(await prisma.member.findMany()).toHaveLength(0) // org B sees nothing

      const created = await prisma.plan.create({ data: { name: 'B Plan', slug: 'b-plan', packsPerOrder: 1, priceInCents: 1000 } })
      expect(created.organizationId).toBe(org.id) // creates stamped with org B

      // Explicit runWithOrg beats the request scope
      const defaultMembers = await runWithOrg(DEFAULT_ORG_ID, () => prisma.member.findMany())
      expect(defaultMembers).toHaveLength(1)
    } finally {
      registerRequestOrgResolver(null)
    }
  })

  it('order generation never crosses tenant boundaries', async () => {
    await setSalesTax('0')

    // Default org: one active member + a quarter
    const plan = await createPlan()
    const product = await createProduct()
    const quarter = await createQuarter([product.id])
    const defaultMember = await createMember(plan.id)

    // Second org: an active member who must NOT receive an order
    const org = await createSecondOrg()
    await runWithOrg(org.id, async () => {
      const otherPlan = await createPlan()
      await createMember(otherPlan.id)
    })

    const result = await generateQuarterOrders(quarter.id)

    expect(result.created).toBe(1)
    const allOrders = await runWithOrg(org.id, () => prisma.order.findMany())
    expect(allOrders).toHaveLength(0)

    const defaultOrders = await prisma.order.findMany()
    expect(defaultOrders).toHaveLength(1)
    expect(defaultOrders[0].memberId).toBe(defaultMember.id)
    expect(defaultOrders[0].organizationId).toBe(DEFAULT_ORG_ID)
  })
})
