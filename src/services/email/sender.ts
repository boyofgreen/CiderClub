import { resend, fromEmail, appUrl, clubName } from '@/lib/resend'
import { prisma } from '@/lib/prisma'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  type: string
  memberId?: string
  metadata?: Record<string, unknown>
}

/** Send a single email via Resend and log it */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  let resendId: string | undefined
  let status = 'SENT'

  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY is not set — skipping send to', params.to)
    status = 'FAILED'
  } else {
    try {
      const result = await resend.emails.send({
        from: fromEmail,
        to: params.to,
        subject: params.subject,
        html: params.html,
      })

      if (result.error) {
        status = 'FAILED'
        console.error('[Email] Resend rejected send:', params.type, 'to', params.to)
        console.error('[Email] Error:', JSON.stringify(result.error, null, 2))
        console.error('[Email] From:', fromEmail)
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

// ─── Email Template Builders ──────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fef9f0; margin: 0; padding: 0; color: #1c1917; }
  .container { max-width: 600px; margin: 40px auto; }
  .header { background: #d97706; border-radius: 12px 12px 0 0; padding: 32px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 24px; }
  .header p { color: #fde68a; margin: 8px 0 0; font-size: 14px; }
  .body { background: white; padding: 32px; border-left: 1px solid #e7e5e4; border-right: 1px solid #e7e5e4; }
  .body h2 { font-size: 20px; color: #1c1917; margin-top: 0; }
  .body p { line-height: 1.6; color: #44403c; }
  .btn { display: inline-block; background: #d97706; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 0; }
  .footer { background: #f5f5f4; border-radius: 0 0 12px 12px; padding: 20px 32px; text-align: center; border: 1px solid #e7e5e4; border-top: none; }
  .footer p { font-size: 12px; color: #78716c; margin: 4px 0; }
  table.order { width: 100%; border-collapse: collapse; margin: 16px 0; }
  table.order th { text-align: left; padding: 8px 12px; background: #fef9f0; font-size: 12px; text-transform: uppercase; color: #78716c; }
  table.order td { padding: 10px 12px; border-top: 1px solid #f5f5f4; font-size: 14px; }
  .total-row td { font-weight: 700; background: #fef9f0; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🍺 ${clubName}</h1>
    <p>Your quarterly craft cider club</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>You're receiving this because you're a ${clubName} member.</p>
    <p>&copy; ${new Date().getFullYear()} ${clubName}. All rights reserved.</p>
  </div>
</div>
</body>
</html>`
}

export function buildWelcomeEmail(params: {
  firstName: string
  planName: string
  portalUrl: string
}): string {
  return baseTemplate(`
    <h2>Welcome to ${clubName}, ${params.firstName}! 🎉</h2>
    <p>You're officially a member of the <strong>${params.planName}</strong> plan. We're so excited to share our craft ciders with you each quarter.</p>
    <p>Here's what happens next:</p>
    <ol>
      <li>Each quarter we'll notify you when your order is ready to customize</li>
      <li>Choose which ciders you'd like in your order</li>
      <li>Pick up your order at our quarterly pickup event</li>
      <li>We'll charge your card on file when you pick up (or at the end of the pickup period)</li>
    </ol>
    <p style="text-align:center">
      <a class="btn" href="${params.portalUrl}">Access Your Member Portal</a>
    </p>
    <p>Bookmark that link — it's your personal access to customize orders, view pickup schedules, and update your account anytime.</p>
    <p>Cheers! 🍻</p>
  `)
}

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

export function buildOrderReadyEmail(params: {
  firstName: string
  quarterLabel: string
  customizeUrl: string
  deadline: string
}): string {
  return baseTemplate(`
    <h2>Your ${params.quarterLabel} Order is Ready to Customize!</h2>
    <p>Hi ${params.firstName},</p>
    <p>Great news — your quarterly cider order has been generated. We've added some of our picks, but you have until <strong>${params.deadline}</strong> to swap them out for your favorites.</p>
    <p style="text-align:center">
      <a class="btn" href="${params.customizeUrl}">Customize My Order</a>
    </p>
    <p>If you love what we picked for you, no action needed — your order will be locked in automatically.</p>
  `)
}

export function buildOrderReminderEmail(params: {
  firstName: string
  quarterLabel: string
  customizeUrl: string
  deadline: string
  hoursLeft: number
}): string {
  return baseTemplate(`
    <h2>Last Chance to Customize Your ${params.quarterLabel} Order!</h2>
    <p>Hi ${params.firstName},</p>
    <p>Just a reminder — you have <strong>${params.hoursLeft} hours left</strong> (until ${params.deadline}) to customize your cider order.</p>
    <p style="text-align:center">
      <a class="btn" href="${params.customizeUrl}">Customize Now</a>
    </p>
    <p>After the deadline, your order will be locked with our picks.</p>
  `)
}

export function buildPickupReminderEmail(params: {
  firstName: string
  quarterLabel: string
  pickupDate: string
  pickupLocation: string
  portalUrl: string
}): string {
  return baseTemplate(`
    <h2>Pickup Reminder — ${params.quarterLabel}</h2>
    <p>Hi ${params.firstName},</p>
    <p>Your cider is ready for pickup! Here are the details:</p>
    <ul>
      <li><strong>Date:</strong> ${params.pickupDate}</li>
      <li><strong>Location:</strong> ${params.pickupLocation}</li>
    </ul>
    <p style="text-align:center">
      <a class="btn" href="${params.portalUrl}">View My Order</a>
    </p>
    <p>We'll charge your card on file at pickup. See you soon!</p>
  `)
}

export function buildReceiptEmail(params: {
  firstName: string
  quarterLabel: string
  items: Array<{ name: string; quantity: number }>
  totalInCents: number
  receiptUrl?: string
}): string {
  const itemRows = params.items
    .map((i) => `<tr><td>${i.name}</td><td>${i.quantity}</td></tr>`)
    .join('')

  const total = (params.totalInCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })

  return baseTemplate(`
    <h2>Payment Received — Thank You!</h2>
    <p>Hi ${params.firstName},</p>
    <p>We've received your payment for your <strong>${params.quarterLabel}</strong> cider order.</p>
    <table class="order">
      <thead><tr><th>Item</th><th>Qty</th></tr></thead>
      <tbody>${itemRows}</tbody>
      <tr class="total-row"><td>Total Charged</td><td>${total}</td></tr>
    </table>
    ${params.receiptUrl ? `<p><a href="${params.receiptUrl}">View Square Receipt</a></p>` : ''}
    <p>Enjoy your ciders! 🍻</p>
  `)
}

export function buildPaymentFailedEmail(params: {
  firstName: string
  quarterLabel: string
  portalUrl: string
}): string {
  return baseTemplate(`
    <h2>Payment Issue — Action Required</h2>
    <p>Hi ${params.firstName},</p>
    <p>We had trouble charging the card on file for your <strong>${params.quarterLabel}</strong> cider order. Please update your payment method as soon as possible.</p>
    <p style="text-align:center">
      <a class="btn" href="${params.portalUrl}">Update Payment Method</a>
    </p>
    <p>If you need help, just reply to this email and we'll sort it out.</p>
  `)
}
