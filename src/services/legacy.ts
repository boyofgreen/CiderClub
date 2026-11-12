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
import { changeMemberPlanInSquare, removeMemberFromSquareGroup } from '@/services/square/customers'
import {
  getAdminNotifyEmail,
  getLegacyDiscountPercent,
  getLegacyExpiryQuarters,
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

/** Emails that count as "we offered them this quarter" */
const OFFER_EMAIL_TYPES = ['LEGACY_ORDER_INVITE', 'LEGACY_EXPIRY_WARNING']

export const LEGACY_EXPIRED_REASON = 'Legacy membership expired'

export interface LegacyStanding {
  /** Most recent order that wasn't cancelled, since joining the legacy club */
  lastOrderAt: Date | null
  /** Quarterly offers sent since their last order (or since they went legacy) */
  offersSinceLastOrder: number
  /** A final notice has gone out since their last order */
  warned: boolean
}

/**
 * Where each legacy member stands against the expiry rule: how many quarterly
 * offers they've passed on since they last ordered. Failed sends don't count —
 * we only hold an offer against someone if it actually went out.
 */
export async function getLegacyStanding(
  members: { id: string; legacyAt: Date | null }[],
  opts: { excludeQuarterId?: string } = {}
): Promise<Map<string, LegacyStanding>> {
  const ids = members.map((m) => m.id)
  const [lastOrders, offers] = await Promise.all([
    prisma.order.groupBy({
      by: ['memberId'],
      where: { memberId: { in: ids }, status: { not: 'CANCELLED' } },
      _max: { createdAt: true },
    }),
    prisma.emailLog.findMany({
      where: { memberId: { in: ids }, type: { in: OFFER_EMAIL_TYPES }, status: { not: 'FAILED' } },
      select: { memberId: true, type: true, createdAt: true, metadata: true },
    }),
  ])
  const lastOrderByMember = new Map(lastOrders.map((o) => [o.memberId, o._max.createdAt]))

  const standing = new Map<string, LegacyStanding>()
  for (const member of members) {
    const since = member.legacyAt ?? new Date(0)
    const lastOrder = lastOrderByMember.get(member.id) ?? null
    const lastOrderAt = lastOrder && lastOrder >= since ? lastOrder : null
    const anchor = lastOrderAt ?? since

    const quarters = new Set<string>()
    let warned = false
    for (const log of offers) {
      if (log.memberId !== member.id || log.createdAt <= anchor) continue
      const quarterId = offerQuarterId(log.metadata)
      if (opts.excludeQuarterId && quarterId === opts.excludeQuarterId) continue
      quarters.add(quarterId ?? log.createdAt.toISOString())
      if (log.type === 'LEGACY_EXPIRY_WARNING') warned = true
    }
    standing.set(member.id, { lastOrderAt, offersSinceLastOrder: quarters.size, warned })
  }
  return standing
}

function offerQuarterId(metadata: string | null): string | null {
  if (!metadata) return null
  try {
    const id = (JSON.parse(metadata) as { quarterId?: unknown }).quarterId
    return typeof id === 'string' ? id : null
  } catch {
    return null
  }
}

/**
 * Email every legacy member the opt-in offer for a quarter. Safe to re-run:
 * members who already have an order or were already invited are skipped.
 *
 * This is also where the expiry rule runs, since generating a quarter's orders
 * is the one thing that reliably happens every quarter:
 *  - passed on `expiryQuarters` offers in a row → this quarter's invitation is
 *    a final notice instead;
 *  - got a final notice and still didn't order → membership is cancelled.
 */
export async function inviteLegacyMembers(
  quarter: QuarterInfo
): Promise<{ invited: number; warned: number; expired: number }> {
  const waiting = await legacyMembersWithoutOrder(quarter.id)
  if (waiting.length === 0) return { invited: 0, warned: 0, expired: 0 }

  const alreadyInvited = await prisma.emailLog.findMany({
    where: {
      type: { in: OFFER_EMAIL_TYPES },
      status: { not: 'FAILED' }, // a failed send should be retried
      memberId: { in: waiting.map((m) => m.id) },
      metadata: { contains: quarter.id },
    },
    select: { memberId: true },
  })
  const invitedIds = new Set(alreadyInvited.map((l) => l.memberId))
  const members = waiting.filter((m) => !invitedIds.has(m.id))

  const expiryQuarters = await getLegacyExpiryQuarters()
  const standing = await getLegacyStanding(members, { excludeQuarterId: quarter.id })

  const toInvite: typeof members = []
  const toWarn: typeof members = []
  let expired = 0
  for (const member of members) {
    const s = standing.get(member.id)!
    if (expiryQuarters > 0 && s.warned) {
      await expireLegacyMember(member, s.offersSinceLastOrder)
      expired++
    } else if (expiryQuarters > 0 && s.offersSinceLastOrder >= expiryQuarters) {
      toWarn.push(member)
    } else {
      toInvite.push(member)
    }
  }

  const invited = await sendLegacyOffer('LEGACY_ORDER_INVITE', quarter, toInvite)
  const warned = await sendLegacyOffer('LEGACY_EXPIRY_WARNING', quarter, toWarn)
  return { invited, warned, expired }
}

/** End a legacy membership that went unanswered through its final notice. */
async function expireLegacyMember(
  member: { id: string; squareCustomerId: string | null },
  offersIgnored: number
): Promise<void> {
  await prisma.member.update({
    where: { id: member.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: `${LEGACY_EXPIRED_REASON} (no order in ${offersIgnored} quarters)`,
    },
  })
  if (member.squareCustomerId) {
    await removeMemberFromSquareGroup(member.squareCustomerId, LEGACY_GROUP_NAME, 'Legacy membership expired').catch(
      (err) => console.error('[legacy] Square group removal failed:', err)
    )
  }
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
  templateKey: 'LEGACY_ORDER_INVITE' | 'LEGACY_ORDER_REMINDER' | 'LEGACY_EXPIRY_WARNING',
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
