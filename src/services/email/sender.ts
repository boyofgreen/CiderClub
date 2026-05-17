import { getResend, fromEmail, appUrl, clubName } from '@/lib/resend'
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
      const result = await getResend().emails.send({
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
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&display=swap');
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #efe6cf; margin: 0; padding: 0; color: #1d1a14; }
  .wrapper { padding: 40px 16px; background: #efe6cf; }
  .container { max-width: 600px; margin: 0 auto; }
  .header { background: #1a2540; padding: 32px; text-align: center; border-bottom: 2px solid #c9a14a; }
  .header-wordmark { font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-style: italic; font-weight: 400; font-size: 26px; color: #c9a14a; margin: 0; letter-spacing: 0.02em; }
  .header-sub { font-size: 11px; color: rgba(247,241,227,0.5); margin: 8px 0 0; letter-spacing: 0.14em; text-transform: uppercase; }
  .body { background: #fbf6e9; padding: 40px 36px; border-left: 1px solid rgba(201,161,74,0.35); border-right: 1px solid rgba(201,161,74,0.35); }
  .body h2 { font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; font-style: italic; font-weight: 400; font-size: 22px; color: #1d1a14; margin: 0 0 16px; }
  .body p { line-height: 1.7; color: #4a4334; font-size: 15px; margin: 0 0 14px; }
  .body ul, .body ol { color: #4a4334; font-size: 15px; line-height: 1.7; padding-left: 20px; margin: 0 0 14px; }
  .body li { margin-bottom: 6px; }
  .body strong { color: #1d1a14; font-weight: 600; }
  .body a { color: #b65a3c; text-decoration: underline; }
  .btn { display: inline-block; background: #b65a3c; color: #f7f1e3 !important; text-decoration: none !important; padding: 13px 32px; font-weight: 600; font-size: 12px; margin: 8px 0 16px; letter-spacing: 0.12em; text-transform: uppercase; }
  .rule { border: none; border-top: 1px solid rgba(201,161,74,0.4); margin: 24px 0; }
  table.order { width: 100%; border-collapse: collapse; margin: 16px 0; }
  table.order th { text-align: left; padding: 8px 12px; background: #efe6cf; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #4a4334; }
  table.order td { padding: 10px 12px; border-top: 1px solid rgba(201,161,74,0.25); font-size: 14px; color: #4a4334; }
  .total-row td { font-weight: 700; color: #1d1a14; background: #efe6cf; }
  .footer { background: #1a2540; padding: 24px 36px; text-align: center; border-top: 1px solid rgba(201,161,74,0.35); }
  .footer p { font-size: 11px; color: rgba(247,241,227,0.45); margin: 4px 0; letter-spacing: 0.04em; }
</style>
</head>
<body>
<div class="wrapper">
<div class="container">
  <div class="header">
    <p class="header-wordmark">${clubName}</p>
    <p class="header-sub">Your quarterly craft cider club</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>You're receiving this because you're a ${clubName} member.</p>
    <p>&copy; ${new Date().getFullYear()} ${clubName}. All rights reserved.</p>
  </div>
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
    <h2>Welcome to ${clubName}, ${params.firstName}!</h2>
    <p>You're officially a member of the <strong>${params.planName}</strong> plan. We're so excited to share our craft ciders with you each quarter.</p>
    <p>Here's what happens next:</p>
    <ol>
      <li>Each quarter we'll notify you when your order is ready to customize</li>
      <li>Choose which ciders you'd like in your order</li>
      <li>Pick up your order during the month, at the pickup party, or we'll be happy to set it aside for you for your next visit</li>
      <li>We'll charge your card on file when you pick up (or at the end of the pickup period)</li>
    </ol>
    <p style="text-align:center">
      <a class="btn" href="${params.portalUrl}">Access Your Member Portal</a>
    </p>
    <p>Bookmark that link — it's your personal access to customize orders, view pickup schedules, and update your account anytime.</p>
    <p>Cheers!</p>
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
    <p>Enjoy your ciders — cheers!</p>
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
