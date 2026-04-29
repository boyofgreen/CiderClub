import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'

// Map Resend event types to our EmailLog status values
const EVENT_STATUS: Record<string, string> = {
  'email.delivered': 'DELIVERED',
  'email.bounced': 'BOUNCED',
  'email.complained': 'COMPLAINED',
  'email.delivery_delayed': 'DELAYED',
}

export async function POST(req: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error('[webhook/resend] RESEND_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const payload = await req.text()
  const headers = {
    'svix-id': req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  }

  let event: { type: string; data: { email_id: string } }
  try {
    const wh = new Webhook(secret)
    event = wh.verify(payload, headers) as typeof event
  } catch {
    console.error('[webhook/resend] Signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const newStatus = EVENT_STATUS[event.type]
  if (!newStatus) {
    // Untracked event type (e.g. email.sent, email.opened) — acknowledge and ignore
    return NextResponse.json({ ok: true })
  }

  const resendId = event.data?.email_id
  if (!resendId) {
    return NextResponse.json({ ok: true })
  }

  const updated = await prisma.emailLog.updateMany({
    where: { resendId },
    data: { status: newStatus },
  }).catch((err) => {
    console.error('[webhook/resend] DB update failed:', err)
    return null
  })

  console.log(`[webhook/resend] ${event.type} → ${newStatus} (resendId=${resendId}, rows=${updated?.count ?? 0})`)
  return NextResponse.json({ ok: true })
}
