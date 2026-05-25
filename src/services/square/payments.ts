import { squareClient } from '@/lib/square'
import { prisma } from '@/lib/prisma'
import { clubName } from '@/lib/resend'
import type { Square } from 'square'

export interface LineItemParam {
  productName: string
  squareVariationId: string | null
  quantity: number
  unitPriceInCents: number
}

interface ChargeParams {
  orderId: string
  squareCustomerId: string
  squareCardId: string
  memberName: string
  memberEmail: string
  quarterLabel: string
  discountPercent: number
  taxRatePercent: number
  items: LineItemParam[]
}

interface ChargeResult {
  paymentId: string
  receiptUrl: string | null
  status: string
}

interface PaymentLinkParams {
  orderId: string
  memberEmail: string
  memberName: string
  quarterLabel: string
  discountPercent: number
  taxRatePercent: number
  items: LineItemParam[]
  redirectUrl?: string
}

/** Build the Square Order body shared by both card-on-file and payment-link flows */
function buildOrderBody(params: {
  locationId: string
  squareCustomerId?: string
  internalOrderId: string
  memberName: string
  memberEmail: string
  quarterLabel: string
  discountPercent: number
  taxRatePercent: number
  items: LineItemParam[]
}): Square.Order {
  const lineItems = params.items.map((item) => ({
    // Link to catalog variation so Square shows the real product name on the receipt.
    // basePriceMoney always overrides the catalog price so the charge matches our records.
    ...(item.squareVariationId ? { catalogObjectId: item.squareVariationId } : {}),
    name: item.productName,
    quantity: String(item.quantity),
    basePriceMoney: {
      amount: BigInt(item.unitPriceInCents),
      currency: 'USD' as const,
    },
  }))

  const discounts =
    params.discountPercent > 0
      ? [
          {
            name: `${params.discountPercent}% member discount`,
            type: 'FIXED_PERCENTAGE' as const,
            percentage: String(params.discountPercent),
            scope: 'ORDER' as const,
          },
        ]
      : []

  // Order-level sales tax. Using Square's `taxes` field (not a line item) so it
  // shows up correctly in Square's tax reports for year-end reconciliation.
  const taxes =
    params.taxRatePercent > 0
      ? [
          {
            name: 'Sales Tax',
            type: 'ADDITIVE' as const,
            percentage: String(params.taxRatePercent),
            scope: 'ORDER' as const,
          },
        ]
      : []

  return {
    locationId: params.locationId,
    ...(params.squareCustomerId ? { customerId: params.squareCustomerId } : {}),
    referenceId: params.internalOrderId,
    lineItems,
    discounts,
    taxes,
    fulfillments: [
      {
        type: 'PICKUP' as const,
        state: 'PROPOSED' as const,
        pickupDetails: {
          scheduleType: 'ASAP' as const,
          note: `${params.quarterLabel} — ${clubName} quarterly pickup`,
          recipient: {
            displayName: params.memberName,
            emailAddress: params.memberEmail,
          },
        },
      },
    ],
  }
}

/** Charge a saved card on file, creating a proper itemized Square Order first */
export async function chargeCardOnFile(params: ChargeParams): Promise<ChargeResult> {
  const locationId = process.env.SQUARE_LOCATION_ID
  if (!locationId) throw new Error('SQUARE_LOCATION_ID is not configured')

  // 1. Create a Square Order with line items and pickup fulfillment
  const orderResponse = await squareClient.orders.create({
    idempotencyKey: `order-create-${params.orderId}`,
    order: buildOrderBody({
      locationId,
      squareCustomerId: params.squareCustomerId,
      internalOrderId: params.orderId,
      memberName: params.memberName,
      memberEmail: params.memberEmail,
      quarterLabel: params.quarterLabel,
      discountPercent: params.discountPercent,
      taxRatePercent: params.taxRatePercent,
      items: params.items,
    }),
  })

  const squareOrder = orderResponse.order
  if (!squareOrder?.id) throw new Error('Square order creation failed — no order ID returned')

  const squareOrderTotal = Number(squareOrder.totalMoney?.amount ?? 0)

  // 2. Pay the Square Order
  const paymentResponse = await squareClient.payments.create({
    idempotencyKey: `order-bill-${params.orderId}`,
    sourceId: params.squareCardId,
    customerId: params.squareCustomerId,
    orderId: squareOrder.id,
    locationId,
    amountMoney: {
      amount: BigInt(squareOrderTotal),
      currency: 'USD',
    },
    statementDescriptionIdentifier: 'CIDER CLUB',
  })

  const payment = paymentResponse.payment
  if (!payment?.id) throw new Error('Square payment failed — no payment ID returned')

  await prisma.order.update({
    where: { id: params.orderId },
    data: {
      status: 'BILLED',
      totalInCents: squareOrderTotal, // reconcile with Square's calculated total
      squarePaymentId: payment.id,
      squareReceiptUrl: payment.receiptUrl ?? null,
      billedAt: new Date(),
      billingMethod: 'CARD_ON_FILE',
    },
  })

  return { paymentId: payment.id, receiptUrl: payment.receiptUrl ?? null, status: payment.status ?? 'UNKNOWN' }
}

/** Generate a Square payment link backed by a proper itemized order */
export async function createPaymentLink(
  params: PaymentLinkParams
): Promise<{ url: string; linkId: string }> {
  const locationId = process.env.SQUARE_LOCATION_ID
  if (!locationId) throw new Error('SQUARE_LOCATION_ID is not configured')

  const response = await squareClient.checkout.paymentLinks.create({
    idempotencyKey: `order-link-${params.orderId}`,
    description: `${clubName} — ${params.quarterLabel} order`,
    order: buildOrderBody({
      locationId,
      internalOrderId: params.orderId,
      memberName: params.memberName,
      memberEmail: params.memberEmail,
      quarterLabel: params.quarterLabel,
      discountPercent: params.discountPercent,
      taxRatePercent: params.taxRatePercent,
      items: params.items,
    }),
    checkoutOptions: {
      redirectUrl: params.redirectUrl,
    },
    prePopulatedData: {
      buyerEmail: params.memberEmail,
    },
  })

  const link = response.paymentLink
  if (!link?.id || !link.url) throw new Error('Failed to create payment link')

  await prisma.order.update({
    where: { id: params.orderId },
    data: {
      squarePaymentLinkId: link.id,
      squarePaymentLinkUrl: link.url,
      billingMethod: 'PAYMENT_LINK',
    },
  })

  return { url: link.url, linkId: link.id }
}
