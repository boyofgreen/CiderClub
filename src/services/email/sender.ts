import { getResend, fromEmail, appUrl, clubName } from '@/lib/resend'
import { prisma } from '@/lib/prisma'
import { config } from '@/lib/config'
import { baseTemplate } from '@/lib/emailTemplates'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  type: string
  memberId?: string
  metadata?: Record<string, unknown>
  /** Override the default From address (e.g. a personal welcome from JB) */
  from?: string
  /** Schedule the send for later — ISO 8601 string or natural language ("in 24 hours") */
  scheduledAt?: string
}

/** Send a single email via Resend and log it */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  let resendId: string | undefined
  let status = 'SENT'

  if (!config.resend.apiKey) {
    console.warn('[Email] RESEND_API_KEY is not set — skipping send to', params.to)
    status = 'FAILED'
  } else {
    try {
      const result = await getResend().emails.send({
        from: params.from ?? fromEmail,
        to: params.to,
        subject: params.subject,
        html: params.html,
        ...(params.scheduledAt ? { scheduledAt: params.scheduledAt } : {}),
      })

      if (result.error) {
        status = 'FAILED'
        console.error('[Email] Resend rejected send:', params.type, 'to', params.to)
        console.error('[Email] Error:', JSON.stringify(result.error, null, 2))
        console.error('[Email] From:', params.from ?? fromEmail)
      } else {
        resendId = (result.data as { id?: string })?.id
        console.log('[Email] Sent', params.type, 'to', params.to, '— id:', resendId)
      }
    } catch (err) {
      status = 'FAILED'
      console.error('[Email] Exception sending:', params.type, 'to', params.to, err)
    }
  }

  // Log every attempt
  await prisma.emailLog.create({
    data: {
      toEmail: params.to,
      subject: params.subject,
      type: params.type,
      memberId: params.memberId,
      resendId,
      status,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
    },
  }).catch(() => {}) // never throw on log failure
}

// ─── Non-editable system emails ───────────────────────────────────────────────
// These are operational (portal access, card setup) and not part of the
// admin-editable set. Editable transactional templates live in
// src/lib/emailTemplates.ts and are rendered via renderEmail().

export function buildMagicLinkEmail(params: {
  firstName: string
  portalUrl: string
  reason?: string
}): string {
  return baseTemplate(`
    <h2>Your ${clubName} Access Link</h2>
    <p>Hi ${params.firstName},</p>
    <p>${params.reason ?? 'Here is your personalized link to access your member portal:'}</p>
    <p style="text-align:center">
      <a class="btn" href="${params.portalUrl}">Open My Member Portal</a>
    </p>
    <p>This link will expire in 30 days. You can always request a new one at <a href="${appUrl}/magic/request">${appUrl}/magic/request</a>.</p>
  `)
}

export function buildSaveCardEmail(params: {
  firstName: string
  portalUrl: string
}): string {
  return baseTemplate(`
    <h2>Add a Card to Your ${clubName} Account</h2>
    <p>Hi ${params.firstName},</p>
    <p>To make quarterly billing seamless, we'd love to have a card on file for your membership. Click below to securely save your payment method — it only takes a moment.</p>
    <p style="text-align:center">
      <a class="btn" href="${params.portalUrl}">Save My Card</a>
    </p>
    <p>Your card info is handled by Square and never touches our servers. You can remove it any time from your member profile.</p>
  `)
}
