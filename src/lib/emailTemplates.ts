import { prisma } from '@/lib/prisma'
import { clubName } from '@/lib/resend'

// ─── Branded email shell ──────────────────────────────────────────────────────
// Wraps editable body content in the club's letterhead. The body is the inner
// HTML that admins edit; this chrome is fixed.

export function baseTemplate(content: string): string {
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

// ─── Template registry ────────────────────────────────────────────────────────

export interface TemplateVar {
  name: string
  description: string
}

export interface EmailTemplateDef {
  key: string
  label: string
  description: string
  defaultSubject: string
  defaultBody: string
  vars: TemplateVar[]
  /** Sample values used for the live preview in the admin editor */
  sample: Record<string, string>
}

const CTA = (url: string, label: string) =>
  `<p style="text-align:center"><a class="btn" href="${url}">${label}</a></p>`

export const EMAIL_TEMPLATE_DEFS: EmailTemplateDef[] = [
  {
    key: 'WELCOME',
    label: 'Welcome (sign-up confirmation)',
    description: 'Sent immediately when someone joins the club. Confirms their plan and links to the member portal.',
    defaultSubject: 'Welcome to {{planName}}!',
    defaultBody: `
    <h2>Welcome to ${clubName}, {{firstName}}!</h2>
    <p>You're officially a member of the <strong>{{planName}}</strong> plan. We're so excited to share our craft ciders with you each quarter.</p>
    <p>Here's what happens next:</p>
    <ol>
      <li>Each quarter we'll notify you when your order is ready to customize</li>
      <li>Choose which ciders you'd like in your order</li>
      <li>Pick up your order during the month, at the pickup party, or we'll set it aside for your next visit</li>
      <li>We'll charge your card on file when you pick up (or at the end of the pickup period)</li>
    </ol>
    ${CTA('{{portalUrl}}', 'Access Your Member Portal')}
    <p>Bookmark that link — it's your personal access to customize orders, view pickup schedules, and update your account anytime.</p>
    <p>Cheers!</p>`,
    vars: [
      { name: 'firstName', description: "Member's first name" },
      { name: 'planName', description: 'The plan they joined (e.g. Pressers)' },
      { name: 'portalUrl', description: 'Personal link to their member portal' },
    ],
    sample: { firstName: 'Sam', planName: 'Pressers', portalUrl: 'https://club.hillcountryciderhouse.com/magic?t=demo' },
  },
  {
    key: 'WELCOME_FOLLOWUP',
    label: 'Personal welcome (24 hours later)',
    description: 'A warmer, personal note sent ~24 hours after sign-up. Sent from your personal address (set in Settings).',
    defaultSubject: 'A personal welcome to the club',
    defaultBody: `
    <h2>Glad to have you, {{firstName}}</h2>
    <p>Hi {{firstName}},</p>
    <p>It's JB from ${clubName}. I just wanted to reach out personally and say how glad we are to have you in the club. Every bottle we make is a labor of love, and getting to share it with people like you is the best part of what we do.</p>
    <p>If you ever have a question — about your order, a pickup, a particular cider, or anything at all — just reply to this email. It comes straight to me and I'm always happy to help.</p>
    <p>Welcome aboard, and cheers to the ciders ahead.</p>
    <p>— JB<br/>${clubName}</p>`,
    vars: [{ name: 'firstName', description: "Member's first name" }],
    sample: { firstName: 'Sam' },
  },
  {
    key: 'ORDER_READY',
    label: 'Quarterly order ready to customize',
    description: 'Sent when you generate orders for a quarter. Invites the member to customize before the deadline.',
    defaultSubject: 'Your {{quarterLabel}} Cider Order is Ready to Customize',
    defaultBody: `
    <h2>Your {{quarterLabel}} Order is Ready to Customize!</h2>
    <p>Hi {{firstName}},</p>
    <p>Great news — your quarterly cider order has been generated. We've added some of our picks, but you have until <strong>{{deadline}}</strong> to swap them out for your favorites.</p>
    ${CTA('{{customizeUrl}}', 'Customize My Order')}
    <p>If you love what we picked for you, no action needed — your order will be locked in automatically.</p>`,
    vars: [
      { name: 'firstName', description: "Member's first name" },
      { name: 'quarterLabel', description: 'The quarter (e.g. 2026-Q3)' },
      { name: 'deadline', description: 'Customization deadline date' },
      { name: 'customizeUrl', description: 'Link to customize their order' },
    ],
    sample: { firstName: 'Sam', quarterLabel: '2026-Q3', deadline: 'July 15, 2026', customizeUrl: 'https://club.hillcountryciderhouse.com/magic?t=demo' },
  },
  {
    key: 'ORDER_REMINDER',
    label: 'Customization reminder',
    description: 'A nudge for members who haven’t customized yet. Sent when you click "Send reminders" on a quarter.',
    defaultSubject: 'Last Chance — Customize Your {{quarterLabel}} Order',
    defaultBody: `
    <h2>Last Chance to Customize Your {{quarterLabel}} Order!</h2>
    <p>Hi {{firstName}},</p>
    <p>Just a friendly reminder — the deadline to customize your cider order is <strong>{{deadline}}</strong>. After that, your order locks in with our picks.</p>
    ${CTA('{{customizeUrl}}', 'Customize Now')}
    <p>Happy with our selections? You don't need to do a thing.</p>`,
    vars: [
      { name: 'firstName', description: "Member's first name" },
      { name: 'quarterLabel', description: 'The quarter (e.g. 2026-Q3)' },
      { name: 'deadline', description: 'Customization deadline date' },
      { name: 'customizeUrl', description: 'Link to customize their order' },
    ],
    sample: { firstName: 'Sam', quarterLabel: '2026-Q3', deadline: 'July 15, 2026', customizeUrl: 'https://club.hillcountryciderhouse.com/magic?t=demo' },
  },
  {
    key: 'RECEIPT_PICKEDUP',
    label: 'Receipt — already picked up',
    description: 'Sent after billing an order the member has already picked up (in-person checkout or marked picked up).',
    defaultSubject: 'Receipt — {{quarterLabel}} Cider Club Order',
    defaultBody: `
    <h2>Thanks — Payment Received!</h2>
    <p>Hi {{firstName}},</p>
    <p>Thanks for picking up your <strong>{{quarterLabel}}</strong> cider order. Here's your receipt:</p>
    {{itemsTable}}
    {{receiptLink}}
    <p>We hope you love every bottle. Cheers — and see you next quarter!</p>`,
    vars: [
      { name: 'firstName', description: "Member's first name" },
      { name: 'quarterLabel', description: 'The quarter (e.g. 2026-Q3)' },
      { name: 'itemsTable', description: 'Auto-generated order line items + total' },
      { name: 'receiptLink', description: 'Auto-generated Square receipt link (hidden if none)' },
    ],
    sample: {
      firstName: 'Sam',
      quarterLabel: '2026-Q3',
      itemsTable: SAMPLE_ITEMS_TABLE(),
      receiptLink: '<p><a href="#">View Square Receipt</a></p>',
    },
  },
  {
    key: 'RECEIPT_PICKUP_NEEDED',
    label: 'Receipt — ready for pickup',
    description: 'Sent when an order is billed with the quarter and still needs to be picked up.',
    defaultSubject: 'Payment Received — Your {{quarterLabel}} Order is Ready for Pickup',
    defaultBody: `
    <h2>Payment Received — Come Grab Your Cider!</h2>
    <p>Hi {{firstName}},</p>
    <p>We've charged the card on file for your <strong>{{quarterLabel}}</strong> cider order. Your bottles are boxed up and waiting for you — stop by anytime during our pickup window to collect them.</p>
    {{itemsTable}}
    {{receiptLink}}
    ${CTA('{{portalUrl}}', 'View Pickup Details')}
    <p>Can't make it in soon? Just reply and we'll set it aside. Cheers!</p>`,
    vars: [
      { name: 'firstName', description: "Member's first name" },
      { name: 'quarterLabel', description: 'The quarter (e.g. 2026-Q3)' },
      { name: 'itemsTable', description: 'Auto-generated order line items + total' },
      { name: 'receiptLink', description: 'Auto-generated Square receipt link (hidden if none)' },
      { name: 'portalUrl', description: 'Link to their order / pickup details' },
    ],
    sample: {
      firstName: 'Sam',
      quarterLabel: '2026-Q3',
      itemsTable: SAMPLE_ITEMS_TABLE(),
      receiptLink: '<p><a href="#">View Square Receipt</a></p>',
      portalUrl: 'https://club.hillcountryciderhouse.com/magic?t=demo',
    },
  },
  {
    key: 'PAYMENT_FAILED',
    label: 'Payment issue',
    description: 'Sent when a card declines or no card is on file at billing time.',
    defaultSubject: 'Payment Issue — Action Required',
    defaultBody: `
    <h2>Payment Issue — Action Required</h2>
    <p>Hi {{firstName}},</p>
    <p>We had trouble charging the card on file for your <strong>{{quarterLabel}}</strong> cider order. Please update your payment method as soon as possible so we can get your order to you.</p>
    ${CTA('{{portalUrl}}', 'Update Payment Method')}
    <p>If you need help, just reply to this email and we'll sort it out.</p>`,
    vars: [
      { name: 'firstName', description: "Member's first name" },
      { name: 'quarterLabel', description: 'The quarter (e.g. 2026-Q3)' },
      { name: 'portalUrl', description: 'Link to update their payment method' },
    ],
    sample: { firstName: 'Sam', quarterLabel: '2026-Q3', portalUrl: 'https://club.hillcountryciderhouse.com/magic?t=demo' },
  },
  {
    key: 'PICKUP_REMINDER',
    label: 'Pickup reminder',
    description: 'Reminds members their order is ready for pickup. Sent when you click "Send reminder" on a pickup event.',
    defaultSubject: 'Pickup Reminder — {{quarterLabel}}',
    defaultBody: `
    <h2>Your Cider is Ready for Pickup!</h2>
    <p>Hi {{firstName}},</p>
    <p>A quick reminder that your <strong>{{quarterLabel}}</strong> order is ready. Here are the details:</p>
    <ul>
      <li><strong>When:</strong> {{pickupDate}}</li>
      <li><strong>Where:</strong> {{pickupLocation}}</li>
    </ul>
    ${CTA('{{portalUrl}}', 'View My Order')}
    <p>See you soon — cheers!</p>`,
    vars: [
      { name: 'firstName', description: "Member's first name" },
      { name: 'quarterLabel', description: 'The quarter (e.g. 2026-Q3)' },
      { name: 'pickupDate', description: 'Pickup date & time' },
      { name: 'pickupLocation', description: 'Pickup location' },
      { name: 'portalUrl', description: 'Link to their order' },
    ],
    sample: { firstName: 'Sam', quarterLabel: '2026-Q3', pickupDate: 'Saturday, July 20 · 12–4pm', pickupLocation: 'The Cider House', portalUrl: 'https://club.hillcountryciderhouse.com/magic?t=demo' },
  },
  {
    key: 'EVENT_ALERT',
    label: 'Event alert',
    description: 'Sent to members who opted into event alerts when you announce a club event.',
    defaultSubject: "You're Invited — {{eventTitle}}",
    defaultBody: `
    <h2>{{eventTitle}}</h2>
    <p>Hi {{firstName}},</p>
    <p>We've got something coming up at ${clubName} and we'd love to see you there:</p>
    <ul>
      <li><strong>What:</strong> {{eventTitle}}</li>
      <li><strong>When:</strong> {{eventDate}}</li>
      <li><strong>Where:</strong> {{eventLocation}}</li>
    </ul>
    <p>{{eventDetails}}</p>
    ${CTA('{{portalUrl}}', 'View Event Details')}
    <p>Hope to see you there. Cheers!</p>
    <hr class="rule" />
    <p style="font-size:12px;color:#8a826f">You're getting this because you opted into event alerts. You can turn these off anytime in your member profile.</p>`,
    vars: [
      { name: 'firstName', description: "Member's first name" },
      { name: 'eventTitle', description: 'Event name' },
      { name: 'eventDate', description: 'Event date & time' },
      { name: 'eventLocation', description: 'Event location' },
      { name: 'eventDetails', description: 'Free-text details / notes' },
      { name: 'portalUrl', description: 'Link to the club portal' },
    ],
    sample: { firstName: 'Sam', eventTitle: 'Summer Release Party', eventDate: 'Saturday, August 9 · 5–9pm', eventLocation: 'The Cider House Patio', eventDetails: 'Live music, food trucks, and the first pours of our summer seasonal. Bring a friend!', portalUrl: 'https://club.hillcountryciderhouse.com' },
  },
]

function SAMPLE_ITEMS_TABLE(): string {
  return buildReceiptItemsTable(
    [
      { name: 'Hill Country Dry', quantity: 3 },
      { name: 'Peach Bellini Cider', quantity: 2 },
      { name: 'Hopped Scrumpy', quantity: 1 },
    ],
    9540
  )
}

// ─── Rendering ────────────────────────────────────────────────────────────────

export function interpolate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '')
}

/** Build the receipt line-item table (injected as the {{itemsTable}} variable) */
export function buildReceiptItemsTable(
  items: Array<{ name: string; quantity: number }>,
  totalInCents: number
): string {
  const rows = items
    .map((i) => `<tr><td>${i.name}</td><td>${i.quantity}</td></tr>`)
    .join('')
  const total = (totalInCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  return `<table class="order"><thead><tr><th>Item</th><th>Qty</th></tr></thead><tbody>${rows}</tbody><tr class="total-row"><td>Total Charged</td><td>${total}</td></tr></table>`
}

export function getTemplateDef(key: string): EmailTemplateDef | undefined {
  return EMAIL_TEMPLATE_DEFS.find((d) => d.key === key)
}

/**
 * Resolve a template (DB override or code default), interpolate variables, and
 * wrap in the branded shell. Used by all transactional send sites.
 */
export async function renderEmail(
  key: string,
  vars: Record<string, string>
): Promise<{ subject: string; html: string }> {
  const def = getTemplateDef(key)
  if (!def) throw new Error(`Unknown email template: ${key}`)

  const override = await prisma.emailTemplate.findFirst({ where: { key } }).catch(() => null)
  const subjectTpl = override?.subject ?? def.defaultSubject
  const bodyTpl = override?.bodyHtml ?? def.defaultBody

  return {
    subject: interpolate(subjectTpl, vars),
    html: baseTemplate(interpolate(bodyTpl, vars)),
  }
}

/** Render raw subject/body (e.g. an unsaved admin edit) for preview */
export function renderPreview(
  subject: string,
  bodyHtml: string,
  vars: Record<string, string>
): { subject: string; html: string } {
  return {
    subject: interpolate(subject, vars),
    html: baseTemplate(interpolate(bodyHtml, vars)),
  }
}
