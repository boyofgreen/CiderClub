import { NextResponse } from 'next/server'
import { sendEmail } from '@/services/email/sender'
import { baseTemplate } from '@/lib/emailTemplates'
import { getAdminNotifyEmail } from '@/lib/settings'
import { SITE } from '@/lib/siteInfo'

// POST /api/contact — public contact form. Emails the message to the cider
// house inbox and logs it like any other outbound email.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))

  // Honeypot: real visitors never fill this hidden field
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ ok: true })
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : ''
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 40) : ''
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 4000) : ''

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: 'Please provide your name, a valid email, and a message.' },
      { status: 400 }
    )
  }

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const to = (await getAdminNotifyEmail()) || SITE.email

  try {
    await sendEmail({
      to,
      subject: `Website inquiry from ${name}`,
      html: baseTemplate(`
        <h2>New website inquiry</h2>
        <p><strong>From:</strong> ${esc(name)}<br/>
        <strong>Email:</strong> <a href="mailto:${esc(email)}">${esc(email)}</a>
        ${phone ? `<br/><strong>Phone:</strong> ${esc(phone)}` : ''}</p>
        <hr class="rule" />
        <p>${esc(message).replace(/\n/g, '<br/>')}</p>
      `),
      type: 'CONTACT_FORM',
      metadata: { fromEmail: email },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact] Failed to send:', err)
    return NextResponse.json({ error: 'Something went wrong — please email us directly.' }, { status: 500 })
  }
}
