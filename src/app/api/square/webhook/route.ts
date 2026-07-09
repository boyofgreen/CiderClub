import { NextResponse } from 'next/server'
import { config } from '@/lib/config'
import { processSquareEvent } from '@/services/square/webhookEvents'
import crypto from 'crypto'

// The signature key is per Square APPLICATION (one webhook subscription for
// the whole platform), not per seller — env-level is correct here.
function isValidSquareSignature(body: string, signature: string, url: string): boolean {
  const combined = url + body
  const expected = crypto
    .createHmac('sha256', config.square.webhookSignatureKey)
    .update(combined)
    .digest('base64')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
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

  await processSquareEvent(event)

  return NextResponse.json({ ok: true })
}
