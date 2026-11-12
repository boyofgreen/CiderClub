/**
 * Legacy club: members who've stepped back from a full membership but still
 * want to hear from us. They get no automatic quarterly order and none of the
 * tier benefits. Each quarter they're invited to build their own order at the
 * legacy discount; nothing is created or billed unless they do.
 */
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/services/email/sender'
import { renderEmail, baseTemplate } from '@/lib/emailTemplates'
import { appUrl } from '@/lib/resend'
import { getMemberPortalToken } from '@/services/orders'
import { changeMemberPlanInSquare } from '@/services/square/customers'
import {
  getAdminNotifyEmail,
  getLegacyDiscountPercent,
  getLegacyMinBottles,
  getSalesTaxPercent,
} from '@/lib/settings'
import { orderTotalInCents } from '@/lib/pricing'
import { format } from 'date-fns'

/** Square customer group legacy members are moved into, so staff can see it at the register. */
export const LEGACY_GROUP_NAME = 'Legacy Club'

/** Orders that haven't been paid for or handed over yet. */
const OPEN_ORDER_STATUSES = ['PENDING_CUSTOMIZATION', 'CUSTOMIZED', 'LOCKED', 'AWAITING_PICKUP', 'PAYMENT_FAILED']

export class LegacyError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

export async function getLegacyTerms(): Promise<{ discountPercent: number; minBottles: number }> {
  const [discountPercent, minBottles] = await Promise.all([getLegacyDiscountPercent(), getLegacyMinBottles()])
  return { discountPercent, minBottles }
}

const legacyOrderUrl = (token: string) => `${appUrl}/magic?t=${token}&next=/member/orders/legacy`

const deadlineText = (endsAt: Date | null) =>
  endsAt ? format(new Date(endsAt), 'MMMM d, yyyy') : 'the end of the quarter'

// ─── Switching ────────────────────────────────────────────────────────────────

/**
 * Move a member to the legacy club and email them how it works.
 * With cancelOpenOrders, any order that hasn't been billed or picked up is
 * cancelled so they aren't charged for a box they no longer expect.
 */
export async function moveToLegacy(
  memberId: string,
  opts: { cancelOpenOrders?: boolean } = {}
): Promise<{ cancelledOrders: number }> {
  const member = await prisma.member.findUniqueOrThrow({ where: { id: memberId }, include: { plan: true } })
  if (member.status === 'LEGACY') throw new LegacyError('This member is already in the legacy club.', 409)

  await prisma.member.update({
    where: { id: memberId },
    data: {
      status: 'LEGACY',
      legacyAt: new Date(),
      pausedAt: null,
      pausedUntilQuarter: null,
      cancelledAt: null,
      cancellationReason: null,
    },
  })

  let cancelledOrders = 0
  if (opts.cancelOpenOrders) {
    const result = await prisma.order.updateMany({
      where: { memberId, status: { in: OPEN_ORDER_STATUSES }, pickedUpAt: null },
      data: { status: 'CANCELLED' },
    })
    cancelledOrders = result.count
  }

  // Out of the tier's Square group (which carries the tasting room perks), into the legacy one.
  if (member.squareCustomerId) {
    await changeMemberPlanInSquare(
      member.squareCustomerId,
      member.plan.name,
      LEGACY_GROUP_NAME,
      `Moved to legacy club (was ${member.plan.name})`
    ).catch((err) => console.error('[legacy] Square group move failed:', err))
  }

  try {
    const terms = await getLegacyTerms()
    const token = await getMemberPortalToken(memberId)
    const email = await renderEmail('LEGACY_WELCOME', {
      firstName: member.firstName,
      discountPercent: String(terms.discountPercent),
      minBottles: String(terms.minBottles),
      planName: member.plan.name,
      portalUrl: `${appUrl}/magic?t=${token}`,
    })
    await sendEmail({
      to: member.email,
      subject: email.subject,
      html: email.html,
      type: 'LEGACY_WELCOME',
      memberId,
    })
  } catch (err) {
    console.error('[legacy] welcome email failed:', err)
  }

  return { cancelledOrders }
}

/**
 * Bring a legacy member back to a full membership on the tier they left.
 * selfServe = the member did it from their portal: enforce tier capacity and
 * let the owner know.
 */
export async function rejoinFromLegacy(memberId: string, opts: { selfServe?: boolean } = {}): Promise<void> {
  const member = await prisma.member.findUniqueOrThrow({ where: { id: memberId }, include: { plan: true } })
  if (member.status !== 'LEGACY') throw new LegacyError('This membership is not in the legacy club.', 409)

  if (opts.selfServe) {
    if (!member.plan.isActive) {
      throw new LegacyError(`${member.plan.name} is no longer offered. Contact us and we'll get you set up on a current tier.`, 409)
    }
    if (member.plan.maxCapacity != null) {
      const activeCount = await prisma.member.count({ where: { planId: member.planId, status: 'ACTIVE' } })
      if (activeCount >= member.plan.maxCapacity) {
        throw new LegacyError(`${member.plan.name} is currently full. Contact us to join the waitlist.`, 409)
      }
    }
  }

  await prisma.member.update({
    where: { id: memberId },
    data: { status: 'ACTIVE', legacyAt: null, pausedAt: null, pausedUntilQuarter: null },
  })

  if (member.squareCustomerId) {
    await changeMemberPlanInSquare(
      member.squareCustomerId,
      LEGACY_GROUP_NAME,
      member.plan.name,
      `Rejoined the club from legacy (${member.plan.name})`
    ).catch((err) => console.error('[legacy] Square group move failed:', err))
  }

  try {
    const token = await getMemberPortalToken(memberId)
    const email = await renderEmail('LEGACY_REJOINED', {
      firstName: member.firstName,
      planName: member.plan.name,
      portalUrl: `${appUrl}/magic?t=${token}`,
    })
    await sendEmail({
      to: member.email,
      subject: email.subject,
      html: email.html,
      type: 'LEGACY_REJOINED',
      memberId,
    })
  } catch (err) {
    console.error('[legacy] rejoin email failed:', err)
  }

  if (opts.selfServe) {
    try {
      const notifyTo = await getAdminNotifyEmail()
      if (notifyTo) {
        const openQuarter = await prisma.quarter.findFirst({ where: { status: 'OPEN' }, orderBy: { startsAt: 'desc' } })
        await sendEmail({
          to: notifyTo,
          subject: `Back in the club: ${member.firstName} ${member.lastName} (${member.plan.name})`,
          html: baseTemplate(`
            <h2>A legacy member rejoined</h2>
            <p><strong>${member.firstName} ${member.lastName}</strong> (${member.email}) switched from the
            legacy club back to a full <strong>${member.plan.name}</strong> membership.</p>
            <p>${
              openQuarter
                ? `${openQuarter.label} is open. Run <strong>Generate Orders</strong> on that quarter again if you'd like them to get a box this time — it only creates orders for members who don't have one.`
                : 'They will get an order the next time you generate orders for a quarter.'
            }</p>
            <p style="text-align:center"><a class="btn" href="${appUrl}/admin/members/${member.id}">View Member</a></p>
          `),
          type: 'ADMIN_LEGACY_REJOINED',
          memberId,
        })
      }
    } catch (err) {
      console.error('[legacy] admin rejoin notification failed:', err)
    }
  }
}

// ─── Quarterly invitation ─────────────────────────────────────────────────────

type QuarterInfo = { id: string; label: string; endsAt: Date | null }

/**
 * Email every legacy member the opt-in offer for a quarter. Safe to re-run:
 * members who already have an order or were already invited are skipped.
 */
export async function inviteLegacyMembers(quarter: QuarterInfo): Promise<{ invited: number }> {
  const members = await legacyMembersWithoutOrder(quarter.id)
  if (members.length === 0) return { invited: 0 }

  const alreadyInvited = await prisma.emailLog.findMany({
    where: {
      type: 'LEGACY_ORDER_INVITE',
      status: { not: 'FAILED' }, // a failed send should be retried
      memberId: { in: members.map((m) => m.id) },
      metadata: { contains: quarter.id },
    },
    select: { memberId: true },
  })
  const invitedIds = new Set(alreadyInvited.map((l) => l.memberId))

  const sent = await sendLegacyOffer('LEGACY_ORDER_INVITE', quarter, members.filter((m) => !invitedIds.has(m.id)))
  return { invited: sent }
}

/** "Last call" for legacy members who haven't built an order for the quarter. */
export async function remindLegacyMembers(quarter: QuarterInfo): Promise<{ sent: number }> {
  const members = await legacyMembersWithoutOrder(quarter.id)
  return { sent: await sendLegacyOffer('LEGACY_ORDER_REMINDER', quarter, members) }
}

async function legacyMembersWithoutOrder(quarterId: string) {
  return prisma.member.findMany({
    where: {
      status: 'LEGACY',
      // A cancelled order doesn't count — they can still opt back in.
      orders: { none: { quarterId, status: { not: 'CANCELLED' } } },
    },
  })
}

async function sendLegacyOffer(
  templateKey: 'LEGACY_ORDER_INVITE' | 'LEGACY_ORDER_REMINDER',
  quarter: QuarterInfo,
  members: { id: string; email: string; firstName: string }[]
): Promise<number> {
  if (members.length === 0) return 0
  const terms = await getLegacyTerms()
  let sent = 0
  for (const member of members) {
    const token = await getMemberPortalToken(member.id)
    const email = await renderEmail(templateKey, {
      firstName: member.firstName,
      quarterLabel: quarter.label,
      deadline: deadlineText(quarter.endsAt),
      discountPercent: String(terms.discountPercent),
      minBottles: String(terms.minBottles),
      orderUrl: legacyOrderUrl(token),
    })
    await sendEmail({
      to: member.email,
      subject: email.subject,
      html: email.html,
      type: templateKey,
      memberId: member.id,
      metadata: { quarterId: quarter.id },
    })
    sent++
  }
  return sent
}

// ─── Opting in ────────────────────────────────────────────────────────────────

/**
 * What a legacy member can order right now: the open quarter, its lineup and
 * the legacy terms. `orderId` is set once they've already built an order.
 */
export async function getLegacyOffer(memberId: string) {
  const member = await prisma.member.findUniqueOrThrow({ where: { id: memberId } })
  if (member.status !== 'LEGACY') return { eligible: false as const, reason: 'NOT_LEGACY' as const }

  const quarter = await prisma.quarter.findFirst({
    where: { status: 'OPEN' },
    orderBy: { startsAt: 'desc' },
    include: {
      products: { include: { product: true }, orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!quarter) return { eligible: false as const, reason: 'NO_OPEN_QUARTER' as const }

  const existing = await prisma.order.findUnique({
    where: { memberId_quarterId: { memberId, quarterId: quarter.id } },
    select: { id: true, status: true },
  })

  const [terms, taxRatePercent] = await Promise.all([getLegacyTerms(), getSalesTaxPercent()])
  return {
    eligible: true as const,
    quarter,
    orderId: existing && existing.status !== 'CANCELLED' ? existing.id : null,
    hasCard: !!member.squareCardId,
    taxRatePercent,
    ...terms,
  }
}

/** Create the legacy member's order for the open quarter from the bottles they picked. */
export async function createLegacyOrder(
  memberId: string,
  items: { productId: string; quantity: number }[]
): Promise<{ orderId: string }> {
  const offer = await getLegacyOffer(memberId)
  if (!offer.eligible) {
    throw new LegacyError(
      offer.reason === 'NOT_LEGACY'
        ? 'This offer is for legacy members.'
        : "There isn't an open order window right now. We'll email you when the next release is ready.",
      409
    )
  }
  if (offer.orderId) throw new LegacyError('You already have an order for this quarter.', 409)

  const picked = items
    .map((i) => ({ productId: String(i.productId), quantity: Math.floor(Number(i.quantity)) }))
    .filter((i) => Number.isFinite(i.quantity) && i.quantity > 0)

  const priceById = new Map(offer.quarter.products.map((qp) => [qp.productId, qp.product.priceInCents ?? 2100]))
  for (const item of picked) {
    if (!priceById.has(item.productId)) throw new LegacyError('One of those ciders is not available this quarter.')
  }

  const bottles = picked.reduce((sum, i) => sum + i.quantity, 0)
  if (bottles < offer.minBottles) {
    throw new LegacyError(`Order must include at least ${offer.minBottles} bottle${offer.minBottles === 1 ? '' : 's'}.`)
  }

  const orderItems = picked.map((i) => ({ ...i, unitPriceInCents: priceById.get(i.productId)! }))
  const subtotal = orderItems.reduce((sum, i) => sum + i.quantity * i.unitPriceInCents, 0)
  const data = {
    status: 'CUSTOMIZED',
    totalInCents: orderTotalInCents(subtotal, offer.discountPercent, offer.taxRatePercent),
    discountPercent: offer.discountPercent,
    minBottles: offer.minBottles,
    lastCustomizedAt: new Date(),
  }

  // A cancelled order for this quarter (theirs from before the switch, or an
  // opt-in they backed out of) holds the one-per-quarter slot, so reuse it.
  const cancelled = await prisma.order.findUnique({
    where: { memberId_quarterId: { memberId, quarterId: offer.quarter.id } },
    select: { id: true },
  })

  if (cancelled) {
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId: cancelled.id } }),
      prisma.order.update({ where: { id: cancelled.id }, data: { ...data, items: { create: orderItems } } }),
    ])
    return { orderId: cancelled.id }
  }

  const order = await prisma.order.create({
    data: { memberId, quarterId: offer.quarter.id, ...data, items: { create: orderItems } },
  })
  return { orderId: order.id }
}

/** Let a member back out of an opt-in order while the order window is still open. */
export async function cancelLegacyOrder(memberId: string, orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { quarter: true } })
  if (!order || order.memberId !== memberId) throw new LegacyError('Order not found.', 404)
  if (order.minBottles == null) throw new LegacyError('Only legacy orders can be cancelled here. Contact us for help.', 409)
  if (!['PENDING_CUSTOMIZATION', 'CUSTOMIZED'].includes(order.status) || order.quarter?.status !== 'OPEN') {
    throw new LegacyError('This order is locked in. Contact us if you need to make a change.', 409)
  }
  await prisma.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } })
}
