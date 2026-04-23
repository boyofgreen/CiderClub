import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCents, formatDate } from '@/lib/utils'
import { KpiCard } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import {
  Users, DollarSign, ShoppingBag, Calendar, List,
  ChevronRight, Zap, AlertTriangle
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const [
    activeMembers,
    pausedMembers,
    cancelledMembers,
    waitlistCount,
    plans,
    currentQuarterOrders,
    recentOrders,
    upcomingPickup,
    failedOrders,
  ] = await Promise.all([
    prisma.member.count({ where: { status: 'ACTIVE' } }),
    prisma.member.count({ where: { status: 'PAUSED' } }),
    prisma.member.count({ where: { status: 'CANCELLED' } }),
    prisma.member.count({ where: { status: 'WAITLIST' } }),
    prisma.plan.findMany({ where: { isActive: true }, include: { _count: { select: { members: true } } } }),
    prisma.order.count({ where: { status: { notIn: ['BILLED', 'CANCELLED'] } } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { member: true, quarter: true },
    }),
    prisma.pickupEvent.findFirst({
      where: { startsAt: { gte: new Date() } },
      orderBy: { startsAt: 'asc' },
      include: { quarter: true },
    }),
    prisma.order.count({ where: { status: 'PAYMENT_FAILED' } }),
  ])

  // Calculate QRR from active members × plan prices
  const activePlanRevenue = await prisma.member.groupBy({
    by: ['planId'],
    where: { status: 'ACTIVE' },
    _count: { _all: true },
  })

  const planPriceMap = Object.fromEntries(plans.map((p) => [p.id, p.priceInCents]))
  const qrr = activePlanRevenue.reduce(
    (sum, g) => sum + g._count._all * (planPriceMap[g.planId] ?? 0),
    0
  )

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/quarters/new" className="btn-primary text-sm">
            <Calendar className="h-4 w-4" /> New Quarter
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {failedOrders > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">
            <strong>{failedOrders} orders</strong> have payment failures.{' '}
            <Link href="/admin/orders?status=PAYMENT_FAILED" className="underline font-medium">
              Review now →
            </Link>
          </p>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Active Members"
          value={activeMembers}
          sub={`${pausedMembers} paused · ${cancelledMembers} cancelled`}
          icon={Users}
          color="amber"
        />
        <KpiCard
          label="Quarterly Revenue"
          value={formatCents(qrr)}
          sub={`~${formatCents(Math.round(qrr / 3))}/mo`}
          icon={DollarSign}
          color="green"
        />
        <KpiCard
          label="Open Orders"
          value={currentQuarterOrders}
          sub="awaiting billing or pickup"
          icon={ShoppingBag}
          color="blue"
        />
        <KpiCard
          label="Waitlist"
          value={waitlistCount}
          sub="across all plans"
          icon={List}
          color="purple"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plans breakdown */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-900">Plan Breakdown</h2>
            <Link href="/admin/plans" className="text-xs text-brand-600 hover:text-brand-700">
              Manage plans →
            </Link>
          </div>
          <div className="space-y-3">
            {plans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-stone-700">{plan.name}</span>
                    <span className="text-sm font-semibold text-stone-900">
                      {plan._count.members} members
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-stone-100">
                    <div
                      className="h-2 rounded-full bg-brand-500"
                      style={{
                        width: activeMembers > 0
                          ? `${(plan._count.members / activeMembers) * 100}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next pickup */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-900">Next Pickup</h2>
            <Link href="/admin/pickups" className="text-xs text-brand-600 hover:text-brand-700">
              View all →
            </Link>
          </div>
          {upcomingPickup ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-stone-800">{upcomingPickup.title}</p>
                  <p className="text-sm text-stone-500">{formatDate(upcomingPickup.startsAt)}</p>
                  {upcomingPickup.location && (
                    <p className="text-xs text-stone-400">{upcomingPickup.location}</p>
                  )}
                </div>
              </div>
              <Link
                href={`/admin/pickups/${upcomingPickup.id}`}
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
              >
                Manage event <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="py-6 text-center text-stone-400 text-sm">
              No upcoming pickups.{' '}
              <Link href="/admin/pickups" className="text-brand-600 underline">
                Schedule one
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-brand-600 hover:text-brand-700">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-stone-100">
          {recentOrders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex items-center justify-between px-6 py-3 hover:bg-stone-50 transition"
            >
              <div>
                <span className="font-medium text-stone-800">
                  {order.member.firstName} {order.member.lastName}
                </span>
                <span className="ml-2 text-sm text-stone-500">{order.quarter.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-stone-600">{formatCents(order.totalInCents)}</span>
                <StatusBadge status={order.status} />
                <ChevronRight className="h-4 w-4 text-stone-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-stone-900 mb-3">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { href: '/admin/quarters/new', icon: Calendar, label: 'Create New Quarter', sub: 'Set up next quarter' },
            { href: '/admin/members', icon: Users, label: 'Manage Members', sub: `${activeMembers} active` },
            { href: '/admin/campaigns/new', icon: Zap, label: 'Send Email Campaign', sub: 'Reach all members' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 hover:border-brand-300 hover:shadow-sm transition"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                <action.icon className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="font-medium text-stone-800">{action.label}</p>
                <p className="text-xs text-stone-400">{action.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
