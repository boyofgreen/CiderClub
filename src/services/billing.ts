import { prisma } from '@/lib/prisma'
import { chargeCardOnFile, createPaymentLink } from '@/services/square/payments'
import { adjustInventoryForOrder } from '@/services/square/inventory'
import { sendEmail, buildReceiptEmail, buildPaymentFailedEmail } from '@/services/email/sender'
import { appUrl } from '@/lib/resend'
import { getMemberPortalToken } from '@/services/orders'

type BillingMethod = 'CARD_ON_FILE' | 'PAYMENT_LINK' | 'IN_PERSON'

interface BillingResult {
  orderId: string
  success: boolean
  method: BillingMethod
  paymentId?: string
  paymentLinkUrl?: string
  error?: string
}

/** Bill a single order */
export async function billOrder(
  orderId: string,
  method: BillingMethod
): Promise<BillingResult> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      member: { include: { plan: true } },
      quarter: true,
      items: { include: { product: true } },
    },
  })

  if (order.status === 'BILLED') {
    return { orderId, success: true, method, paymentId: order.squarePaymentId ?? undefined }
  }

  const member = order.member

  if (method === 'IN_PERSON') {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'BILLED', billedAt: new Date(), billingMethod: 'IN_PERSON' },
    })
    // Adjust Square inventory now that the sale is complete
    await adjustInventoryForOrder(orderId, order.items.map((i) => ({
      squareVariationId: i.product.squareVariationId,
      quantity: i.quantity,
    }))).catch((err) => console.error(`[inventory] Failed for order ${orderId}:`, err))
    return { orderId, success: true, method }
  }

  if (method === 'CARD_ON_FILE') {
    if (!member.squareCustomerId || !member.squareCardId) {
      return { orderId, success: false, method, error: 'No card on file' }
    }
    try {
      const result = await chargeCardOnFile({
        orderId,
        squareCustomerId: member.squareCustomerId,
        squareCardId: member.squareCardId,
        amountInCents: order.totalInCents,
        note: `${order.quarter.label} cider order for ${member.firstName} ${member.lastName}`,
      })

      // Adjust Square inventory now that payment succeeded
      await adjustInventoryForOrder(orderId, order.items.map((i) => ({
        squareVariationId: i.product.squareVariationId,
        quantity: i.quantity,
      }))).catch((err) => console.error(`[inventory] Failed for order ${orderId}:`, err))

      // Send receipt email
      const token = await getMemberPortalToken(member.id)
      await sendEmail({
        to: member.email,
        subject: `Receipt — ${order.quarter.label} Cider Club Order`,
        html: buildReceiptEmail({
          firstName: member.firstName,
          quarterLabel: order.quarter.label,
          items: order.items.map((i) => ({ name: i.product.name, quantity: i.quantity })),
          totalInCents: order.totalInCents,
          receiptUrl: result.receiptUrl ?? undefined,
        }),
        type: 'RECEIPT',
        memberId: member.id,
      })

      return { orderId, success: true, method, paymentId: result.paymentId }
    } catch (err) {
      // Mark as failed and notify member
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAYMENT_FAILED' },
      })

      const token = await getMemberPortalToken(member.id)
      await sendEmail({
        to: member.email,
        subject: 'Payment Issue — Action Required',
        html: buildPaymentFailedEmail({
          firstName: member.firstName,
          quarterLabel: order.quarter.label,
          portalUrl: `${appUrl}/magic?t=${token}`,
        }),
        type: 'PAYMENT_FAILED',
        memberId: member.id,
      })

      return { orderId, success: false, method, error: String(err) }
    }
  }

  if (method === 'PAYMENT_LINK') {
    try {
      const clubName = process.env.NEXT_PUBLIC_CLUB_NAME ?? 'Cider Club'
      const result = await createPaymentLink({
        orderId,
        amountInCents: order.totalInCents,
        memberEmail: member.email,
        description: `${clubName} — ${order.quarter.label} order`,
        redirectUrl: `${appUrl}/member/orders/${orderId}`,
      })

      return { orderId, success: true, method, paymentLinkUrl: result.url }
    } catch (err) {
      return { orderId, success: false, method, error: String(err) }
    }
  }

  return { orderId, success: false, method, error: 'Unknown billing method' }
}

/** Bill all locked orders for an entire quarter */
export async function billQuarter(
  quarterId: string,
  method: BillingMethod
): Promise<{ success: number; failed: number; skipped: number; results: BillingResult[] }> {
  const orders = await prisma.order.findMany({
    where: { quarterId, status: { in: ['LOCKED', 'AWAITING_PICKUP'] } },
  })

  const results: BillingResult[] = []
  let success = 0
  let failed = 0
  let skipped = 0

  for (const order of orders) {
    if (order.status === 'BILLED') { skipped++; continue }
    const result = await billOrder(order.id, method)
    results.push(result)
    if (result.success) success++
    else failed++
  }

  // Update quarter status
  await prisma.quarter.update({ where: { id: quarterId }, data: { status: 'BILLING' } })

  return { success, failed, skipped, results }
}
