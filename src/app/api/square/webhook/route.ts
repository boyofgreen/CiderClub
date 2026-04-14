import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const SQUARE_WEBHOOK_SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? ''

function isValidSquareSignature(body: string, signature: string, url: string): boolean {
  const combined = url + body
  const expected = crypto
    .createHmac('sha256', SQUARE_WEBHOOK_SIGNATURE_KEY)
    .update(combined)
    .digest('base64')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-square-hmacsha256-signature') ?? ''
  const url = req.url

  if (SQUARE_WEBHOOK_SIGNATURE_KEY && !isValidSquareSignature(rawBody, signature, url)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const type = event.type as string

  // Handle payment completion events
  if (type === 'payment.completed') {
    const data = event.data as Record<string, unknown>
    const obj = data?.object as Record<string, unknown>
    const payment = obj?.payment as Record<string, unknown>
    const paymentId = payment?.id as string | undefined
    const referenceId = payment?.referenceId as string | undefined // we set this to orderId

    if (paymentId && referenceId) {
      await prisma.order.updateMany({
        where: { id: referenceId, status: 'LOCKED' },
        data: {
          status: 'BILLED',
          squarePaymentId: paymentId,
          billedAt: new Date(),
        },
      })
    }
  }

  // Handle payment failure events
  if (type === 'payment.failed') {
    const data = event.data as Record<string, unknown>
    const obj = data?.object as Record<string, unknown>
    const payment = obj?.payment as Record<string, unknown>
    const referenceId = payment?.referenceId as string | undefined

    if (referenceId) {
      await prisma.order.updateMany({
        where: { id: referenceId },
        data: { status: 'PAYMENT_FAILED' },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
