import { squarePayments, squareCheckout, serializeSquare } from '@/lib/square'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

interface ChargeParams {
  orderId: string
  squareCustomerId: string
  squareCardId: string
  amountInCents: number
  note?: string
}

interface ChargeResult {
  paymentId: string
  receiptUrl: string | null
  status: string
}

/** Charge a saved card on file for an order */
export async function chargeCardOnFile(params: ChargeParams): Promise<ChargeResult> {
  const { result } = await squarePayments.createPayment({
    idempotencyKey: `order-bill-${params.orderId}`,
    sourceId: params.squareCardId,
    customerId: params.squareCustomerId,
    amountMoney: {
      amount: BigInt(params.amountInCents),
      currency: 'USD',
    },
    note: params.note ?? 'Cider Club quarterly order',
    referenceId: params.orderId,
  })

  const payment = result.payment
  if (!payment?.id) throw new Error('Square payment failed — no payment ID returned')

  const paymentId = payment.id
  const receiptUrl = payment.receiptUrl ?? null
  const status = payment.status ?? 'UNKNOWN'

  // Update order record
  await prisma.order.update({
    where: { id: params.orderId },
    data: {
      status: 'BILLED',
      squarePaymentId: paymentId,
      squareReceiptUrl: receiptUrl,
      billedAt: new Date(),
      billingMethod: 'CARD_ON_FILE',
    },
  })

  return { paymentId, receiptUrl, status }
}

interface PaymentLinkParams {
  orderId: string
  amountInCents: number
  memberEmail: string
  description: string
  redirectUrl?: string
}

/** Generate a Square payment link for online payment */
export async function createPaymentLink(params: PaymentLinkParams): Promise<{ url: string; linkId: string }> {
  const { result } = await squareCheckout.createPaymentLink({
    idempotencyKey: `order-link-${params.orderId}`,
    description: params.description,
    quickPay: {
      name: params.description,
      priceMoney: {
        amount: BigInt(params.amountInCents),
        currency: 'USD',
      },
      locationId: process.env.SQUARE_LOCATION_ID!,
    },
    checkoutOptions: {
      redirectUrl: params.redirectUrl,
    },
    prePopulatedData: {
      buyerEmail: params.memberEmail,
    },
  })

  const link = result.paymentLink
  if (!link?.id || !link.url) throw new Error('Failed to create payment link')

  // Store link on order
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
