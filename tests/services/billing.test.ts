import { describe, it, expect, beforeEach } from 'vitest'
import { prisma, resetDb } from '../helpers/prismaTestClient'
import { squareState, resetSquareState } from '../helpers/squareMock'
import { createPlan, createProduct, createMember, createQuarter, createOrder, setSalesTax } from '../helpers/fixtures'
import { billOrder, billQuarter } from '@/services/billing'

beforeEach(async () => {
  await resetDb()
  resetSquareState()
  await setSalesTax('0')
})

async function seedBillableOrder(opts: {
  withCard?: boolean
  discountPercent?: number
  status?: string
  orderOverrides?: Record<string, unknown>
} = {}) {
  const plan = await createPlan({ discountPercent: opts.discountPercent ?? 0 })
  const product = await createProduct({ priceInCents: 2000, squareVariationId: 'VAR-1' })
  const quarter = await createQuarter([product.id])
  const member = await createMember(plan.id, {
    ...(opts.withCard !== false
      ? { squareCustomerId: 'sq-cust-test', squareCardId: 'sq-card-test' }
      : {}),
  })
  const order = await createOrder({
    memberId: member.id,
    quarterId: quarter.id,
    status: opts.status ?? 'LOCKED',
    totalInCents: 4000,
    items: [{ productId: product.id, quantity: 2, unitPriceInCents: 2000 }],
    ...(opts.orderOverrides ?? {}),
  })
  return { plan, product, quarter, member, order }
}

describe('billOrder', () => {
  it('IN_PERSON marks the order billed, adjusts inventory, and sends a receipt', async () => {
    const { order, member } = await seedBillableOrder()

    const result = await billOrder(order.id, 'IN_PERSON')

    expect(result.success).toBe(true)
    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(updated.status).toBe('BILLED')
    expect(updated.billingMethod).toBe('IN_PERSON')
    expect(updated.billedAt).not.toBeNull()
    expect(squareState.inventoryCalls).toHaveLength(1)
    const receipt = await prisma.emailLog.findFirst({ where: { memberId: member.id, type: 'RECEIPT' } })
    expect(receipt).not.toBeNull()
  })

  it('CARD_ON_FILE charges Square, reconciles the total, and marks billed', async () => {
    const { order, member } = await seedBillableOrder()

    const result = await billOrder(order.id, 'CARD_ON_FILE')

    expect(result.success).toBe(true)
    expect(result.paymentId).toMatch(/^sq-pay-/)
    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(updated.status).toBe('BILLED')
    expect(updated.billingMethod).toBe('CARD_ON_FILE')
    expect(updated.squarePaymentId).toBe(result.paymentId)
    expect(updated.totalInCents).toBe(4000) // 2 × 2000, no discount, no tax
    expect(squareState.payments).toHaveLength(1)
    expect(squareState.inventoryCalls).toHaveLength(1)
    const receipt = await prisma.emailLog.findFirst({ where: { memberId: member.id, type: 'RECEIPT' } })
    expect(receipt).not.toBeNull()
  })

  it('CARD_ON_FILE reconciles discount + tax totals from the Square order', async () => {
    await setSalesTax('10')
    const { order } = await seedBillableOrder({ discountPercent: 10 })

    const result = await billOrder(order.id, 'CARD_ON_FILE')

    expect(result.success).toBe(true)
    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    // 4000 → 3600 after 10% discount → 3960 after 10% tax
    expect(updated.totalInCents).toBe(3960)
  })

  it('CARD_ON_FILE with no card on file flags PAYMENT_FAILED and emails the member', async () => {
    const { order, member } = await seedBillableOrder({ withCard: false })

    const result = await billOrder(order.id, 'CARD_ON_FILE')

    expect(result.success).toBe(false)
    expect(result.error).toBe('No card on file')
    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(updated.status).toBe('PAYMENT_FAILED')
    expect(squareState.payments).toHaveLength(0)
    const email = await prisma.emailLog.findFirst({ where: { memberId: member.id, type: 'PAYMENT_FAILED' } })
    expect(email).not.toBeNull()
  })

  it('CARD_ON_FILE decline flags PAYMENT_FAILED and emails the member', async () => {
    const { order, member } = await seedBillableOrder()
    squareState.failCharge = true

    const result = await billOrder(order.id, 'CARD_ON_FILE')

    expect(result.success).toBe(false)
    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(updated.status).toBe('PAYMENT_FAILED')
    const email = await prisma.emailLog.findFirst({ where: { memberId: member.id, type: 'PAYMENT_FAILED' } })
    expect(email).not.toBeNull()
  })

  it('short-circuits an already-billed order without charging again', async () => {
    const { order } = await seedBillableOrder({
      status: 'BILLED',
      orderOverrides: { squarePaymentId: 'sq-pay-existing' },
    })

    const result = await billOrder(order.id, 'CARD_ON_FILE')

    expect(result.success).toBe(true)
    expect(result.paymentId).toBe('sq-pay-existing')
    expect(squareState.payments).toHaveLength(0)
  })

  it('PAYMENT_LINK stores the link without marking the order billed', async () => {
    const { order } = await seedBillableOrder()

    const result = await billOrder(order.id, 'PAYMENT_LINK')

    expect(result.success).toBe(true)
    expect(result.paymentLinkUrl).toBe('https://square.link/test')
    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    expect(updated.status).toBe('LOCKED') // payment link doesn't bill — webhook does
    expect(updated.billingMethod).toBe('PAYMENT_LINK')
    expect(updated.squarePaymentLinkId).toMatch(/^sq-link-/)
    expect(updated.squarePaymentLinkUrl).toBe('https://square.link/test')
  })
})

describe('billQuarter', () => {
  it('bills every eligible order, counting successes and failures, and marks the quarter BILLING', async () => {
    const plan = await createPlan()
    const product = await createProduct({ priceInCents: 2000 })
    const quarter = await createQuarter([product.id])

    const withCard = await createMember(plan.id, {
      squareCustomerId: 'sq-cust-a',
      squareCardId: 'sq-card-a',
    })
    const withoutCard = await createMember(plan.id)
    const cancelled = await createMember(plan.id)

    await createOrder({
      memberId: withCard.id, quarterId: quarter.id, status: 'LOCKED', totalInCents: 2000,
      items: [{ productId: product.id, quantity: 1, unitPriceInCents: 2000 }],
    })
    await createOrder({
      memberId: withoutCard.id, quarterId: quarter.id, status: 'AWAITING_PICKUP', totalInCents: 2000,
      items: [{ productId: product.id, quantity: 1, unitPriceInCents: 2000 }],
    })
    // CANCELLED orders are not eligible
    await createOrder({ memberId: cancelled.id, quarterId: quarter.id, status: 'CANCELLED' })

    const result = await billQuarter(quarter.id, 'CARD_ON_FILE')

    expect(result.total).toBe(2)
    expect(result.success).toBe(1)
    expect(result.failed).toBe(1)

    const updatedQuarter = await prisma.quarter.findUniqueOrThrow({ where: { id: quarter.id } })
    expect(updatedQuarter.status).toBe('BILLING')
  })
})
