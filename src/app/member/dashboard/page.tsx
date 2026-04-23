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
        <h1 className="text-2xl font-bold text-stone-900">
          Welcome back, {member.firstName}! 👋
        </h1>
        <p className="mt-1 text-stone-500">
          <span className="font-medium text-stone-700">{member.plan.name}</span> member since{' '}
          {formatDate(member.joinedAt)}
        </p>
      </div>

      {/* Status banner */}
      {member.status === 'PAUSED' && (
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
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
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Current Order</p>
              <h2 className="text-lg font-bold text-stone-900 mt-0.5">
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
                  className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition"
                >
                  <Edit3 className="h-4 w-4" />
                  Customize
                </Link>
              )}
          </div>

          <div className="space-y-2">
            {currentOrder.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Beer className="h-4 w-4 text-brand-500" />
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
            <div className="mt-4 rounded-lg bg-brand-50 border border-brand-100 p-3 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-brand-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-brand-800">
                  Pickup: {formatDate(currentOrder.pickupEvent.startsAt)}
                </p>
                <p className="text-xs text-brand-600">{currentOrder.pickupEvent.location}</p>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
              <Package className="h-6 w-6 text-brand-600" />
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-stone-400 font-semibold">Next Pickup</p>
                <p className="font-semibold text-stone-800 mt-0.5">{upcomingPickup.title}</p>
                <p className="text-sm text-stone-500">{formatDate(upcomingPickup.startsAt)}</p>
                {upcomingPickup.location && (
                  <p className="text-xs text-stone-400 mt-0.5">{upcomingPickup.location}</p>
                )}
              </div>
            </div>
            <Link href="/member/pickups" className="mt-3 flex items-center justify-end text-xs font-medium text-brand-600 hover:text-brand-700">
              View all pickups <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        )}

        {/* Referral */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
              <Gift className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wide text-stone-400 font-semibold">Refer a Friend</p>
              <p className="text-sm text-stone-600 mt-0.5">Share the love and grow the club!</p>
            </div>
          </div>
          <Link href="/member/referrals" className="mt-3 flex items-center justify-end text-xs font-medium text-brand-600 hover:text-brand-700">
            Get my referral link <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </div>

      {/* Recent orders */}
      {member.orders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-stone-900">Recent Orders</h2>
            <Link href="/member/orders" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {member.orders.slice(0, 3).map((order) => (
              <Link
                key={order.id}
                href={`/member/orders/${order.id}`}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 hover:border-brand-300 hover:bg-brand-50/50 transition"
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
