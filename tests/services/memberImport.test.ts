import { describe, it, expect, beforeEach } from 'vitest'
import { prisma, resetDb } from '../helpers/prismaTestClient'
import { createPlan, createMember } from '../helpers/fixtures'
import { importMembersFromCsv } from '@/services/memberImport'
import { runWithOrg } from '../../src/lib/tenancy'

beforeEach(async () => {
  await resetDb()
})

describe('importMembersFromCsv', () => {
  it('imports members with flexible headers and full-name splitting', async () => {
    const plan = await createPlan({ name: 'Pickers', slug: 'pickers' })

    const csv = [
      'Email Address,Name,Phone,Plan,Status,Member Since,Notes',
      'jane@test.local,"Smith, Jane phrased weird",512-555-0100,Pickers,Active,2024-03-15,Loves dry cider',
      'bob@test.local,Bob Jones,,pickers,,,',
    ].join('\n')

    const result = await importMembersFromCsv({ csv })

    expect(result.errors).toEqual([])
    expect(result.created).toBe(2)

    const jane = await prisma.member.findFirstOrThrow({ where: { email: 'jane@test.local' } })
    expect(jane.planId).toBe(plan.id)
    expect(jane.status).toBe('ACTIVE')
    expect(jane.joinedAt.getFullYear()).toBe(2024)
    expect(jane.notes).toBe('[Imported] Loves dry cider')
    expect(jane.phone).toBe('512-555-0100')

    const bob = await prisma.member.findFirstOrThrow({ where: { email: 'bob@test.local' } })
    expect(bob.firstName).toBe('Bob')
    expect(bob.lastName).toBe('Jones')
  })

  it('uses the default plan when rows have no plan column', async () => {
    const plan = await createPlan()
    const csv = 'email,first name,last name\nnew@test.local,New,Member'

    const result = await importMembersFromCsv({ csv, defaultPlanId: plan.id })

    expect(result.errors).toEqual([])
    expect(result.created).toBe(1)
    const member = await prisma.member.findFirstOrThrow({ where: { email: 'new@test.local' } })
    expect(member.planId).toBe(plan.id)
  })

  it('skips existing members and in-file duplicates without erroring', async () => {
    const plan = await createPlan()
    await createMember(plan.id, { email: 'existing@test.local' })

    const csv = [
      'email,first name',
      'existing@test.local,Already',
      'fresh@test.local,Fresh',
      'fresh@test.local,FreshDupe',
    ].join('\n')

    const result = await importMembersFromCsv({ csv, defaultPlanId: plan.id })

    expect(result.created).toBe(1)
    expect(result.skipped).toBe(2)
    expect(result.errors).toEqual([])
  })

  it('reports row-level problems with line numbers instead of failing the batch', async () => {
    const plan = await createPlan()
    const csv = [
      'email,first name,plan,status,member since',
      'good@test.local,Good,,,',
      'not-an-email,Bad,,,',
      'noplan@test.local,NoPlan,Ghost Plan,,',
      'badstatus@test.local,Bad,,FROZEN,',
      'baddate@test.local,Bad,,,not-a-date',
    ].join('\n')

    const result = await importMembersFromCsv({ csv, defaultPlanId: plan.id })

    expect(result.created).toBe(1)
    expect(result.errors).toHaveLength(4)
    expect(result.errors.map((e) => e.line)).toEqual([3, 4, 5, 6])
    expect(result.errors[1].message).toMatch(/Unknown plan/)
    expect(result.errors[2].message).toMatch(/Unknown status/)
  })

  it('dry run validates everything but writes nothing', async () => {
    const plan = await createPlan()
    const csv = 'email,first name\npreview@test.local,Preview'

    const result = await importMembersFromCsv({ csv, defaultPlanId: plan.id, dryRun: true })

    expect(result.dryRun).toBe(true)
    expect(result.created).toBe(1)
    expect(await prisma.member.count()).toBe(0)
  })

  it('imports into the active org only — plans and members stay tenant-scoped', async () => {
    const org = await prisma.organization.create({ data: { name: 'Bluebird', slug: 'bluebird' } })
    const defaultOrgPlan = await createPlan({ name: 'Shared Name', slug: 'shared-name' })

    // Org B has no plan named "Shared Name" — the row must fail there,
    // proving plan lookup doesn't leak across tenants.
    const csv = 'email,first name,plan\ncross@test.local,Cross,Shared Name'
    const inOrgB = await runWithOrg(org.id, () => importMembersFromCsv({ csv }))
    expect(inOrgB.created).toBe(0)
    expect(inOrgB.errors[0].message).toMatch(/Unknown plan/)

    // Same file in the default org works, and the member lands there
    const inDefault = await importMembersFromCsv({ csv })
    expect(inDefault.created).toBe(1)
    const member = await prisma.member.findFirstOrThrow({ where: { email: 'cross@test.local' } })
    expect(member.planId).toBe(defaultOrgPlan.id)
    expect(await runWithOrg(org.id, () => prisma.member.count())).toBe(0)
  })
})
