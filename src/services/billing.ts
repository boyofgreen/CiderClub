import { prisma } from '@/lib/prisma'
import { chargeCardOnFile, createPaymentLink } from '@/services/square/payments'
import { adjustInventoryForOrder } from '@/services/square/inventory'
import { sendEmail } from '@/services/email/sender'
import { renderEmail, buildReceiptItemsTable } from '@/lib/emailTemplates'
import { appUrl } from '@/lib/resend'
import { getMemberPortalToken } from '@/services/orders'
import { getSalesTaxPercent } from '@/lib/settings'

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

    // In-person checkout means they're walking out with their cider — send the
    // "already picked up" receipt.
    const itemsTable = buildReceiptItemsTable(
      order.items.map((i) => ({ name: i.product.name, quantity: i.quantity })),
      order.totalInCents
    )
    const receipt = await renderEmail('RECEIPT_PICKEDUP', {
      firstName: member.firstName,
      quarterLabel: order.quarter.label,
      itemsTable,
      receiptLink: '',
    })
    await sendEmail({
      to: member.email,
      subject: receipt.subject,
      html: receipt.html,
      type: 'RECEIPT',
      memberId: member.id,
      metadata: { pickedUp: true, method: 'IN_PERSON' },
    }).catch((err) => console.error(`[billing] receipt email failed for ${orderId}:`, err))

    return { orderId, success: true, method }
  }

  if (method === 'CARD_ON_FILE') {
    if (!member.squareCustomerId || !member.squareCardId) {
      // Flag the order and email the member a magic link to set up a card,
      // mirroring the card-decline path so bulk billing surfaces this clearly.
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAYMENT_FAILED' },
      })
      const token = await getMemberPortalToken(member.id)
      const failed = await renderEmail('PAYMENT_FAILED', {
        firstName: member.firstName,
        quarterLabel: order.quarter.label,
        portalUrl: `${appUrl}/magic?t=${token}&next=/member/profile?card=1`,
      })
      await sendEmail({
        to: member.email,
        subject: failed.subject,
        html: failed.html,
        type: 'PAYMENT_FAILED',
        memberId: member.id,
      })
      return { orderId, success: false, method, error: 'No card on file' }
    }
    try {
      const taxRatePercent = await getSalesTaxPercent()
      const result = await chargeCardOnFile({
        orderId,
        squareCustomerId: member.squareCustomerId,
        squareCardId: member.squareCardId,
        memberName: `${member.firstName} ${member.lastName}`,
        memberEmail: member.email,
        quarterLabel: order.quarter.label,
        discountPercent: member.plan.discountPercent ?? 0,
        taxRatePercent,
        items: order.items.map((i) => ({
          productName: i.product.name,
          squareVariationId: i.product.squareVariationId,
          quantity: i.quantity,
          unitPriceInCents: i.unitPriceInCents || i.product.priceInCents || 2100,
        })),
      })

      // Adjust Square inventory now that payment succeeded
      await adjustInventoryForOrder(orderId, order.items.map((i) => ({
        squareVariationId: i.product.squareVariationId,
        quantity: i.quantity,
      }))).catch((err) => console.error(`[inventory] Failed for order ${orderId}:`, err))

      // Send the appropriate receipt. If the order was already picked up, thank
      // them. If we billed with the quarter and they haven't collected yet, prompt
      // a pickup. (This branch is always CARD_ON_FILE.)
      const alreadyPickedUp = !!order.pickedUpAt
      const token = await getMemberPortalToken(member.id)
      const itemsTable = buildReceiptItemsTable(
        order.items.map((i) => ({ name: i.product.name, quantity: i.quantity })),
        order.totalInCents
      )
      const receiptLink = result.receiptUrl
        ? `<p style="text-align:center"><a href="${result.receiptUrl}">View Square Receipt</a></p>`
        : ''
      const receipt = await renderEmail(
        alreadyPickedUp ? 'RECEIPT_PICKEDUP' : 'RECEIPT_PICKUP_NEEDED',
        {
          firstName: member.firstName,
          quarterLabel: order.quarter.label,
          itemsTable,
          receiptLink,
          portalUrl: `${appUrl}/magic?t=${token}&next=/member/orders/${orderId}`,
        }
      )
      await sendEmail({
        to: member.email,
        subject: receipt.subject,
        html: receipt.html,
        type: 'RECEIPT',
        memberId: member.id,
        metadata: { pickedUp: alreadyPickedUp },
      })

      return { orderId, success: true, method, paymentId: result.paymentId }
    } catch (err) {
      console.error(`[billing] chargeCardOnFile failed for order ${orderId}:`, err)
      // Mark as failed and notify member
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAYMENT_FAILED' },
      })

      const token = await getMemberPortalToken(member.id)
      const failed = await renderEmail('PAYMENT_FAILED', {
        firstName: member.firstName,
        quarterLabel: order.quarter.label,
        portalUrl: `${appUrl}/magic?t=${token}`,
      })
      await sendEmail({
        to: member.email,
        subject: failed.subject,
        html: failed.html,
        type: 'PAYMENT_FAILED',
        memberId: member.id,
      })

      return { orderId, success: false, method, error: String(err) }
    }
  }

  if (method === 'PAYMENT_LINK') {
    try {
      const taxRatePercent = await getSalesTaxPercent()
      const result = await createPaymentLink({
        orderId,
        memberEmail: member.email,
        memberName: `${member.firstName} ${member.lastName}`,
        quarterLabel: order.quarter.label,
        discountPercent: member.plan.discountPercent ?? 0,
        taxRatePercent,
        items: order.items.map((i) => ({
          productName: i.product.name,
          squareVariationId: i.product.squareVariationId,
          quantity: i.quantity,
          unitPriceInCents: i.unitPriceInCents || i.product.priceInCents || 2100,
        })),
        redirectUrl: `${appUrl}/member/orders/${orderId}`,
      })

      return { orderId, success: true, method, paymentLinkUrl: result.url }
    } catch (err) {
      return { orderId, success: false, method, error: String(err) }
    }
  }

  return { orderId, success: false, method, error: 'Unknown billing method' }
}

/** Bill all eligible orders for an entire quarter */
export async function billQuarter(
  quarterId: string,
  method: BillingMethod
): Promise<{ total: number; success: number; failed: number; skipped: number; results: BillingResult[] }> {
  // Include any order that's not already billed or cancelled. billOrder() short-circuits
  // BILLED orders, so this is safe; expanding the set means admins don't need to run
  // "Lock Quarter" first for billing to find anything.
  const orders = await prisma.order.findMany({
    where: {
      quarterId,
      status: { in: ['PENDING_CUSTOMIZATION', 'CUSTOMIZED', 'LOCKED', 'AWAITING_PICKUP', 'PAYMENT_FAILED'] },
    },
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

  return { total: orders.length, success, failed, skipped, results }
}
