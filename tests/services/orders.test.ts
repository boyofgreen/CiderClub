import { describe, it, expect, beforeEach } from 'vitest'
import { prisma, resetDb } from '../helpers/prismaTestClient'
import { resetSquareState } from '../helpers/squareMock'
import { createPlan, createProduct, createMember, createQuarter, setSalesTax } from '../helpers/fixtures'
import { generateQuarterOrders, lockQuarterOrders } from '@/services/orders'

beforeEach(async () => {
  await resetDb()
  resetSquareState()
  await setSalesTax('0')
})

describe('generateQuarterOrders', () => {
  it('creates a pending order with default products for each active member', async () => {
    const plan = await createPlan({ packsPerOrder: 2 })
    const product = await createProduct({ priceInCents: 2000 })
    const quarter = await createQuarter([product.id])
    const member = await createMember(plan.id)

    const result = await generateQuarterOrders(quarter.id)

    expect(result).toMatchObject({ created: 1, skipped: 0, emailsSent: 1 })

    const order = await prisma.order.findUniqueOrThrow({
      where: { memberId_quarterId: { memberId: member.id, quarterId: quarter.id } },
      include: { items: true },
    })
    expect(order.status).toBe('PENDING_CUSTOMIZATION')
    // 1 default product, packsPerOrder 2 → single line item with quantity 2
    expect(order.items).toHaveLength(1)
    expect(order.items[0]).toMatchObject({ productId: product.id, quantity: 2 })
    expect(order.totalInCents).toBe(4000)

    // Member got an ORDER_READY email and an order-access token
    const emailLog = await prisma.emailLog.findFirst({ where: { memberId: member.id, type: 'ORDER_READY' } })
    expect(emailLog).not.toBeNull()
    const token = await prisma.memberToken.findFirst({
      where: { memberId: member.id, type: 'ORDER_ACCESS', resourceId: order.id },
    })
    expect(token).not.toBeNull()

    // Quarter moved UPCOMING → OPEN
    const updatedQuarter = await prisma.quarter.findUniqueOrThrow({ where: { id: quarter.id } })
    expect(updatedQuarter.status).toBe('OPEN')
  })

  it('is idempotent — second run skips members that already have an order', async () => {
    const plan = await createPlan()
    const product = await createProduct()
    const quarter = await createQuarter([product.id])
    await createMember(plan.id)

    const first = await generateQuarterOrders(quarter.id)
    const second = await generateQuarterOrders(quarter.id)

    expect(first.created).toBe(1)
    expect(second).toMatchObject({ created: 0, skipped: 1 })
    expect(await prisma.order.count()).toBe(1)
  })

  it('excludes paused, cancelled, and paused-until-this-quarter members', async () => {
    const plan = await createPlan()
    const product = await createProduct()
    const quarter = await createQuarter([product.id], { label: '2099-Q2', year: 2099, quarter: 2 })

    await createMember(plan.id, { status: 'PAUSED' })
    await createMember(plan.id, { status: 'CANCELLED' })
    // Active but paused through this quarter → excluded
    await createMember(plan.id, { pausedUntilQuarter: '2099-Q2' })
    // Active, pause expired last quarter → included
    const active = await createMember(plan.id, { pausedUntilQuarter: '2099-Q1' })

    const result = await generateQuarterOrders(quarter.id)

    expect(result.created).toBe(1)
    const orders = await prisma.order.findMany()
    expect(orders).toHaveLength(1)
    expect(orders[0].memberId).toBe(active.id)
  })

  it('prefers per-plan default selections over global defaults', async () => {
    const plan = await createPlan({ packsPerOrder: 2 })
    const globalDefault = await createProduct({ priceInCents: 2000 })
    const planSpecific = await createProduct({ priceInCents: 1500 })
    const quarter = await createQuarter([globalDefault.id])
    await prisma.quarterPlanDefault.create({
      data: { quarterId: quarter.id, planId: plan.id, productId: planSpecific.id, quantity: 3 },
    })
    const member = await createMember(plan.id)

    await generateQuarterOrders(quarter.id)

    const order = await prisma.order.findFirstOrThrow({
      where: { memberId: member.id },
      include: { items: true },
    })
    expect(order.items).toHaveLength(1)
    expect(order.items[0]).toMatchObject({ productId: planSpecific.id, quantity: 3 })
    expect(order.totalInCents).toBe(4500)
  })

  it('applies the plan discount and sales tax to the order total', async () => {
    await setSalesTax('10')
    const plan = await createPlan({ packsPerOrder: 2, discountPercent: 10 })
    const product = await createProduct({ priceInCents: 2000 })
    const quarter = await createQuarter([product.id])
    await createMember(plan.id)

    await generateQuarterOrders(quarter.id)

    const order = await prisma.order.findFirstOrThrow({})
    // 4000 subtotal → 3600 after 10% discount → 3960 after 10% tax
    expect(order.totalInCents).toBe(3960)
  })
})

describe('lockQuarterOrders', () => {
  it('locks open orders and the quarter, leaving billed orders alone', async () => {
    const plan = await createPlan()
    const product = await createProduct()
    const quarter = await createQuarter([product.id])
    const m1 = await createMember(plan.id)
    const m2 = await createMember(plan.id)
    const m3 = await createMember(plan.id)

    await prisma.order.createMany({
      data: [
        { memberId: m1.id, quarterId: quarter.id, status: 'PENDING_CUSTOMIZATION' },
        { memberId: m2.id, quarterId: quarter.id, status: 'CUSTOMIZED' },
        { memberId: m3.id, quarterId: quarter.id, status: 'BILLED' },
      ],
    })

    const result = await lockQuarterOrders(quarter.id)

    expect(result.locked).toBe(2)
    const statuses = (await prisma.order.findMany()).map((o) => o.status).sort()
    expect(statuses).toEqual(['BILLED', 'LOCKED', 'LOCKED'])
    const updatedQuarter = await prisma.quarter.findUniqueOrThrow({ where: { id: quarter.id } })
    expect(updatedQuarter.status).toBe('LOCKED')
  })
})
