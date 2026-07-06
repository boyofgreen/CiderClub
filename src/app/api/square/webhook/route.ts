import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { config } from '@/lib/config'
import crypto from 'crypto'

function isValidSquareSignature(body: string, signature: string, url: string): boolean {
  const combined = url + body
  const expected = crypto
    .createHmac('sha256', config.square.webhookSignatureKey)
    .update(combined)
    .digest('base64')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-square-hmacsha256-signature') ?? ''
  const url = req.url

  if (config.square.webhookSignatureKey && !isValidSquareSignature(rawBody, signature, url)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

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

  return NextResponse.json({ ok: true })
}
