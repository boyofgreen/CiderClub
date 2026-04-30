import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAppSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { formatCents, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Beer, Package, Calendar, ChevronRight, Edit3, Gift } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Dashboard' }

export default async function MemberDashboardPage() {
  const session = await getAppSession()
  if (!session?.memberId) redirect('/login')

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    include: {
      plan: true,
      orders: {
        include: {
          quarter: true,
          items: { include: { product: true } },
          pickupEvent: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  })

  if (!member) redirect('/login')

  const currentOrder = member.orders.find((o) =>
    ['PENDING_CUSTOMIZATION', 'CUSTOMIZED', 'LOCKED', 'AWAITING_PICKUP'].includes(o.status)
  )

  const upcomingPickup = await prisma.pickupEvent.findFirst({
    where: {
      startsAt: { gte: new Date() },
      isPublic: true,
    },
    include: { quarter: true },
    orderBy: { startsAt: 'asc' },
  })

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,3vw,30px)', color: 'var(--ink)', lineHeight: 1.2 }}>
          Welcome back, {member.firstName}.
        </h1>
        <p className="mt-1 text-stone-500">
          <span className="font-medium text-stone-700">{member.plan.name}</span> member since{' '}
          {formatDate(member.joinedAt)}
        </p>
      </div>

      {/* Status banner */}
      {member.status === 'PAUSED' && (
        <div className="border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          <strong>Your membership is paused.</strong>{' '}
          {member.pausedUntilQuarter
            ? `It will resume after ${member.pausedUntilQuarter}.`
            : 'Contact us to resume.'}{' '}
          <Link href="/member/profile" className="underline font-medium">Manage membership →</Link>
        </div>
      )}

      {/* Current order */}
      {currentOrder ? (
        <Card>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="smallcaps" style={{ color: 'var(--ink-soft)' }}>Current Order</p>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 20, color: 'var(--ink)', marginTop: 4 }}>
                {currentOrder.quarter.label} — {currentOrder.quarter.name ?? 'Quarterly Order'}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={currentOrder.status} />
                <span className="text-sm text-stone-500">{formatCents(currentOrder.totalInCents)}</span>
              </div>
            </div>
            {['PENDING_CUSTOMIZATION', 'CUSTOMIZED'].includes(currentOrder.status) &&
              currentOrder.quarter.status === 'OPEN' && (
                <Link
                  href={`/member/orders/${currentOrder.id}`}
                  className="btn-saloon flex items-center gap-1.5"
                  style={{ fontSize: 10, padding: '10px 18px' }}
                >
                  <Edit3 className="h-4 w-4" />
                  Customize
                </Link>
              )}
          </div>

          <div className="space-y-2">
            {currentOrder.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-3 py-2"
                style={{ backgroundColor: 'var(--cream-deep)' }}
              >
                <div className="flex items-center gap-2">
                  <Beer className="h-4 w-4 text-gold-deep" />
                  <span className="text-sm font-medium text-stone-800">{item.product.name}</span>
                  {item.product.style && (
                    <span className="text-xs text-stone-400">{item.product.style}</span>
                  )}
                </div>
                <span className="text-sm font-semibold text-stone-700">×{item.quantity}</span>
              </div>
            ))}
          </div>

          {currentOrder.pickupEvent && (
            <div
              className="mt-4 flex items-center gap-3 p-3"
              style={{ backgroundColor: 'var(--cream)', border: '1px solid var(--rule)' }}
            >
              <Calendar className="h-5 w-5 shrink-0 text-terracotta" />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>
                  Pickup: {formatDate(currentOrder.pickupEvent.startsAt)}
                </p>
                <p className="text-xs text-terracotta">{currentOrder.pickupEvent.location}</p>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center" style={{ backgroundColor: 'var(--cream-deep)' }}>
              <Package className="h-6 w-6 text-terracotta" />
            </div>
            <div>
              <p className="font-semibold text-stone-800">No active order yet</p>
              <p className="text-sm text-stone-500">
                We'll email you when your next quarterly order is ready.
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Upcoming pickup */}
        {upcomingPickup && (
          <Card>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center shrink-0" style={{ backgroundColor: 'var(--cream-deep)' }}>
                <Calendar className="h-5 w-5 text-terracotta" />
              </div>
              <div className="flex-1">
                <p className="smallcaps" style={{ color: 'var(--ink-soft)' }}>Next Pickup</p>
                <p className="font-semibold text-stone-800 mt-0.5">{upcomingPickup.title}</p>
                <p className="text-sm text-stone-500">{formatDate(upcomingPickup.startsAt)}</p>
                {upcomingPickup.location && (
                  <p className="text-xs text-stone-400 mt-0.5">{upcomingPickup.location}</p>
                )}
              </div>
            </div>
            <Link href="/member/pickups" className="mt-3 flex items-center justify-end text-xs font-medium text-terracotta hover:text-terracotta-deep">
              View all pickups <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        )}

        {/* Referral */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center shrink-0" style={{ backgroundColor: 'var(--cream-deep)' }}>
              <Gift className="h-5 w-5 text-gold-deep" />
            </div>
            <div className="flex-1">
              <p className="smallcaps" style={{ color: 'var(--ink-soft)' }}>Refer a Friend</p>
              <p className="text-sm text-stone-600 mt-0.5">Share the love and grow the club!</p>
            </div>
          </div>
          <Link href="/member/referrals" className="mt-3 flex items-center justify-end text-xs font-medium text-terracotta hover:text-terracotta-deep">
            Get my referral link <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </div>

      {/* Recent orders */}
      {member.orders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 18, color: 'var(--ink)' }}>
              Recent Orders
            </h2>
            <Link href="/member/orders" className="text-xs font-medium text-terracotta hover:text-terracotta-deep">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {member.orders.slice(0, 3).map((order) => (
              <Link
                key={order.id}
                href={`/member/orders/${order.id}`}
                className="flex items-center justify-between bg-cream-paper px-4 py-3 transition border hover:bg-cream"
                style={{ borderColor: 'var(--rule)' }}
              >
                <div>
                  <span className="font-medium text-stone-800">{order.quarter.label}</span>
                  <span className="ml-2 text-sm text-stone-500">{formatCents(order.totalInCents)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.status} />
                  <ChevronRight className="h-4 w-4 text-stone-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
