import { prisma } from '@/lib/prisma'
import { runWithOrg } from '@/lib/tenancy'

/**
 * Process a verified Square webhook event, routed to the right tenant.
 *
 * The platform has ONE webhook subscription (per Square app); every event
 * carries merchant_id. We map that to the org connected to that merchant and
 * run the handler in its tenant context — without this, order updates would
 * be scoped to tenant zero and silently no-op for every other tenant.
 * Events from merchants we don't know (e.g. tenant zero before it OAuths,
 * still on env credentials) fall back to the default context.
 */
export async function processSquareEvent(event: Record<string, unknown>): Promise<void> {
  const merchantId = typeof event.merchant_id === 'string' ? event.merchant_id : null

  const org = merchantId
    ? await prisma.organization.findUnique({
        where: { squareMerchantId: merchantId },
        select: { id: true },
      })
    : null

  if (org) {
    await runWithOrg(org.id, () => handleEvent(event))
  } else {
    await handleEvent(event)
  }
}

async function handleEvent(event: Record<string, unknown>): Promise<void> {
  const type = event.type as string

  // Square uses payment.updated for all payment state changes.
  // We inspect payment.status to distinguish completed vs failed.
  if (type === 'payment.updated' || type === 'payment.created') {
    const data = event.data as Record<string, unknown>
    const obj = data?.object as Record<string, unknown>
    const payment = obj?.payment as Record<string, unknown>
    const paymentId = payment?.id as string | undefined
    const referenceId = payment?.referenceId as string | undefined // we set this to orderId
    const status = payment?.status as string | undefined

    if (referenceId) {
      if (status === 'COMPLETED' && paymentId) {
        await prisma.order.updateMany({
          where: { id: referenceId, status: { notIn: ['BILLED', 'CANCELLED'] } },
          data: {
            status: 'BILLED',
            squarePaymentId: paymentId,
            billedAt: new Date(),
          },
        })
      } else if (status === 'FAILED') {
        await prisma.order.updateMany({
          where: { id: referenceId },
          data: { status: 'PAYMENT_FAILED' },
        })
      }
    }
  }
}
