import { describe, it, expect, beforeEach } from 'vitest'
import { prisma, resetDb } from '../helpers/prismaTestClient'
import { createPlan, createProduct, createMember, createQuarter, createOrder } from '../helpers/fixtures'
import { processSquareEvent } from '@/services/square/webhookEvents'
import { runWithOrg } from '../../src/lib/tenancy'

beforeEach(async () => {
  await resetDb()
})

function paymentEvent(params: {
  merchantId?: string
  orderId: string
  paymentId?: string
  status: 'COMPLETED' | 'FAILED'
}): Record<string, unknown> {
  return {
    type: 'payment.updated',
    ...(params.merchantId ? { merchant_id: params.merchantId } : {}),
    data: {
      object: {
        payment: {
          id: params.paymentId ?? 'sq-pay-webhook',
          referenceId: params.orderId,
          status: params.status,
        },
      },
    },
  }
}

async function seedOrgWithOrder(merchantId: string) {
  const org = await prisma.organization.create({
    data: { name: `Org ${merchantId}`, slug: `org-${merchantId.toLowerCase()}`, squareMerchantId: merchantId },
  })
  return runWithOrg(org.id, async () => {
    const plan = await createPlan()
    const product = await createProduct()
    const quarter = await createQuarter([product.id])
    const member = await createMember(plan.id)
    const order = await createOrder({
      memberId: member.id,
      quarterId: quarter.id,
      status: 'LOCKED',
      totalInCents: 2000,
    })
    return { org, order }
  })
}

describe('processSquareEvent', () => {
  it('routes a completed payment to the org that owns the merchant', async () => {
    const { org, order } = await seedOrgWithOrder('MERCHANT_B')

    await processSquareEvent(
      paymentEvent({ merchantId: 'MERCHANT_B', orderId: order.id, status: 'COMPLETED' })
    )

    const updated = await runWithOrg(org.id, () =>
      prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    )
    expect(updated.status).toBe('BILLED')
    expect(updated.squarePaymentId).toBe('sq-pay-webhook')
    expect(updated.billedAt).not.toBeNull()
  })

  it("without merchant routing the same event would no-op — proves the fix", async () => {
    const { org, order } = await seedOrgWithOrder('MERCHANT_C')

    // Event WITHOUT merchant_id: handler runs in default (tenant zero) context,
    // where the org-scoped updateMany cannot see this order.
    await processSquareEvent(paymentEvent({ orderId: order.id, status: 'COMPLETED' }))

    const untouched = await runWithOrg(org.id, () =>
      prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    )
    expect(untouched.status).toBe('LOCKED')
  })

  it('marks failed payments PAYMENT_FAILED in the right org', async () => {
    const { org, order } = await seedOrgWithOrder('MERCHANT_D')

    await processSquareEvent(
      paymentEvent({ merchantId: 'MERCHANT_D', orderId: order.id, status: 'FAILED' })
    )

    const updated = await runWithOrg(org.id, () =>
      prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    )
    expect(updated.status).toBe('PAYMENT_FAILED')
  })

  it('never re-bills an already billed order', async () => {
    const { org, order } = await seedOrgWithOrder('MERCHANT_E')
    await runWithOrg(org.id, () =>
      prisma.order.update({
        where: { id: order.id },
        data: { status: 'BILLED', squarePaymentId: 'original-payment' },
      })
    )

    await processSquareEvent(
      paymentEvent({
        merchantId: 'MERCHANT_E',
        orderId: order.id,
        paymentId: 'duplicate-payment',
        status: 'COMPLETED',
      })
    )

    const updated = await runWithOrg(org.id, () =>
      prisma.order.findUniqueOrThrow({ where: { id: order.id } })
    )
    expect(updated.squarePaymentId).toBe('original-payment')
  })

  it('ignores unknown merchants and unrelated event types without throwing', async () => {
    await expect(
      processSquareEvent(paymentEvent({ merchantId: 'NOBODY', orderId: 'no-such-order', status: 'COMPLETED' }))
    ).resolves.toBeUndefined()
    await expect(processSquareEvent({ type: 'catalog.version.updated' })).resolves.toBeUndefined()
  })
})
