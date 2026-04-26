import { prisma } from '@/lib/prisma'
import { sendEmail, buildOrderReadyEmail } from '@/services/email/sender'
import { appUrl } from '@/lib/resend'
import { generateOpaqueToken } from '@/lib/tokens'
import { addDays, format } from 'date-fns'

/**
 * Generate a quarterly order for every active, non-paused member.
 * Idempotent — skips members that already have an order for this quarter.
 * Returns counts of created and skipped orders.
 */
export async function generateQuarterOrders(
  quarterId: string
): Promise<{ created: number; skipped: number; emailsSent: number }> {
  const quarter = await prisma.quarter.findUniqueOrThrow({
    where: { id: quarterId },
    include: {
      products: {
        where: { isDefault: true },
        include: { product: true },
        orderBy: { sortOrder: 'asc' },
      },
      planDefaults: {
        include: { product: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  // Group plan-specific defaults by planId for quick lookup
  const planDefaultsByPlan = new Map<string, typeof quarter.planDefaults>()
  for (const d of quarter.planDefaults) {
    const existing = planDefaultsByPlan.get(d.planId) ?? []
    existing.push(d)
    planDefaultsByPlan.set(d.planId, existing)
  }

  // Get all active members (not paused for this quarter or later)
  const members = await prisma.member.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { pausedUntilQuarter: null },
        { pausedUntilQuarter: { lt: quarter.label } },
      ],
    },
    include: { plan: true },
  })

  let created = 0
  let skipped = 0
  let emailsSent = 0

  for (const member of members) {
    // Check if order already exists
    const existing = await prisma.order.findUnique({
      where: { memberId_quarterId: { memberId: member.id, quarterId } },
    })

    if (existing) {
      skipped++
      continue
    }

    const packsNeeded = member.plan.packsPerOrder
    const items: { productId: string; quantity: number; unitPriceInCents: number }[] = []

    // Prefer plan-specific defaults; fall back to global isDefault products
    const planDefaults = planDefaultsByPlan.get(member.planId)
    if (planDefaults && planDefaults.length > 0) {
      for (const d of planDefaults) {
        items.push({ productId: d.productId, quantity: d.quantity, unitPriceInCents: 0 })
      }
    } else {
      let allocated = 0
      for (const qp of quarter.products) {
        if (allocated >= packsNeeded) break
        const qty = Math.min(1, packsNeeded - allocated)
        items.push({ productId: qp.productId, quantity: qty, unitPriceInCents: 0 })
        allocated += qty
      }
      // If not enough fallback products, repeat the first one
      if (allocated < packsNeeded && quarter.products.length > 0) {
        const firstProductId = quarter.products[0].productId
        const matched = items.find((i) => i.productId === firstProductId)
        if (matched) {
          matched.quantity += packsNeeded - allocated
        } else {
          items.push({ productId: firstProductId, quantity: packsNeeded - allocated, unitPriceInCents: 0 })
        }
      }
    }

    // Apply the plan's discountPercent to the order total
    const discount = Math.max(0, Math.min(100, member.plan.discountPercent ?? 0))
    const totalInCents = Math.round(member.plan.priceInCents * (1 - discount / 100))

    const order = await prisma.order.create({
      data: {
        memberId: member.id,
        quarterId,
        status: 'PENDING_CUSTOMIZATION',
        totalInCents,
        items: { create: items },
      },
    })

    created++

    // Send "order ready" email with a customize link
    const token = await ensureMemberToken(member.id, 'ORDER_ACCESS', order.id)
    const customizeUrl = `${appUrl}/magic?t=${token}&next=/member/orders/${order.id}`
    const deadline = quarter.endsAt
      ? format(new Date(quarter.endsAt), 'MMMM d, yyyy')
      : 'end of quarter'

    await sendEmail({
      to: member.email,
      subject: `Your ${quarter.label} Cider Order is Ready to Customize`,
      html: buildOrderReadyEmail({
        firstName: member.firstName,
        quarterLabel: quarter.label,
        customizeUrl,
        deadline,
      }),
      type: 'ORDER_READY',
      memberId: member.id,
      metadata: { quarterId, orderId: order.id },
    })
    emailsSent++
  }

  // Move quarter to OPEN if still UPCOMING
  if (quarter.status === 'UPCOMING') {
    await prisma.quarter.update({ where: { id: quarterId }, data: { status: 'OPEN' } })
  }

  return { created, skipped, emailsSent }
}

/** Lock all open orders for a quarter (close customization window) */
export async function lockQuarterOrders(quarterId: string): Promise<{ locked: number }> {
  const result = await prisma.order.updateMany({
    where: {
      quarterId,
      status: { in: ['PENDING_CUSTOMIZATION', 'CUSTOMIZED'] },
    },
    data: { status: 'LOCKED' },
  })

  await prisma.quarter.update({ where: { id: quarterId }, data: { status: 'LOCKED' } })

  return { locked: result.count }
}

/** Ensure a valid member token exists; creates one if needed */
async function ensureMemberToken(
  memberId: string,
  type: string,
  resourceId?: string
): Promise<string> {
  const existing = await prisma.memberToken.findFirst({
    where: {
      memberId,
      type,
      resourceId: resourceId ?? null,
      expiresAt: { gt: new Date() },
    },
  })

  if (existing) return existing.token

  const token = generateOpaqueToken()
  await prisma.memberToken.create({
    data: {
      memberId,
      token,
      type,
      resourceId,
      expiresAt: addDays(new Date(), 90),
    },
  })

  return token
}

/** Get or create a general access token for a member (for portal links) */
export async function getMemberPortalToken(memberId: string): Promise<string> {
  return ensureMemberToken(memberId, 'GENERAL')
}
