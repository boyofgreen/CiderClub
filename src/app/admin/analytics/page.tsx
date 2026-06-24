import { prisma } from '@/lib/prisma'
import { formatCents } from '@/lib/utils'
import { Users, TrendingUp, ShoppingBag, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Analytics' }

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

async function getStats() {
  const since30 = daysAgo(30)
  const since14 = daysAgo(14)

  const [
    membersByStatus,
    ordersByStatus,
    revenueResult,
    topProducts,
    quarterRevenue,
    // Acquisition funnel
    homepageViews30,
    registerViews30,
    newMembers30,
    // Daily traffic (last 14 days)
    recentViews,
    // Top referrers
    topReferrers,
  ] = await Promise.all([
    prisma.member.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.aggregate({ where: { status: 'BILLED' }, _sum: { totalInCents: true } }),
    prisma.orderItem.groupBy({ by: ['productId'], _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 8 }),
    prisma.order.groupBy({ by: ['quarterId'], where: { status: 'BILLED' }, _sum: { totalInCents: true }, _count: { _all: true } }),
    // Funnel counts
    prisma.pageView.count({ where: { path: '/', createdAt: { gte: since30 } } }),
    prisma.pageView.count({ where: { path: '/register', createdAt: { gte: since30 } } }),
    prisma.member.count({ where: { createdAt: { gte: since30 } } }),
    // Raw rows for daily grouping
    prisma.pageView.findMany({
      where: { createdAt: { gte: since14 } },
      select: { createdAt: true, path: true },
    }),
    // Referrers
    prisma.pageView.groupBy({
      by: ['referrer'],
      where: { createdAt: { gte: since30 }, referrer: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { referrer: 'desc' } },
      take: 8,
    }),
  ])

  // Build daily traffic buckets (last 14 days)
  const dailyMap: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = daysAgo(i)
    dailyMap[d.toISOString().slice(0, 10)] = 0
  }
  for (const row of recentViews) {
    const key = row.createdAt.toISOString().slice(0, 10)
    if (key in dailyMap) dailyMap[key]++
  }
  const dailyTraffic = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

  // Products
  const productIds = topProducts.map((r) => r.productId)
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, style: true } })
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]))

  const quarterIds = quarterRevenue.map((r) => r.quarterId)
  const quarters = await prisma.quarter.findMany({ where: { id: { in: quarterIds } }, select: { id: true, label: true }, orderBy: { label: 'desc' } })
  const quarterMap = Object.fromEntries(quarters.map((q) => [q.id, q]))

  return {
    membersByStatus: Object.fromEntries(membersByStatus.map((r) => [r.status, r._count._all])),
    ordersByStatus: Object.fromEntries(ordersByStatus.map((r) => [r.status, r._count._all])),
    totalRevenue: revenueResult._sum.totalInCents ?? 0,
    topProducts: topProducts.map((r) => ({ product: productMap[r.productId], quantity: r._sum.quantity ?? 0 })),
    quarterRevenue: quarterRevenue
      .sort((a, b) => (quarterMap[b.quarterId]?.label ?? '').localeCompare(quarterMap[a.quarterId]?.label ?? ''))
      .map((r) => ({ label: quarterMap[r.quarterId]?.label ?? r.quarterId, revenue: r._sum.totalInCents ?? 0, orders: r._count._all })),
    funnel: { homepageViews30, registerViews30, newMembers30 },
    dailyTraffic,
    topReferrers: topReferrers
      .filter((r) => r.referrer)
      .map((r) => ({ referrer: r.referrer!, count: r._count._all })),
  }
}

function pct(num: number, den: number) {
  if (!den) return '—'
  return `${Math.round((num / den) * 100)}%`
}

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon: React.ElementType }) {
  return (
    <div className="border bg-cream-paper p-5 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-stone-500">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center" style={{ backgroundColor: 'var(--cream-deep)' }}>
          <Icon className="h-4 w-4 text-gold-deep" />
        </div>
      </div>
      <p className="text-2xl font-bold text-stone-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-stone-400">{sub}</p>}
    </div>
  )
}

function FunnelStep({
  label, count, sub, rate, last,
}: {
  label: string; count: number; sub?: string; rate?: string; last?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 border bg-cream-paper p-4" style={{ borderColor: 'var(--rule)' }}>
        <p className="text-xs text-stone-500 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-stone-900">{count.toLocaleString()}</p>
        {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
      </div>
      {!last && (
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <ArrowRight className="h-5 w-5 text-stone-300" />
          {rate && <span className="text-xs font-semibold text-terracotta">{rate}</span>}
        </div>
      )}
    </div>
  )
}

function shortDate(iso: string) {
  const [, , dd] = iso.split('-')
  return dd
}

export default async function AnalyticsPage() {
  const stats = await getStats()

  const totalMembers = Object.values(stats.membersByStatus).reduce((s, n) => s + n, 0)
  const activeMembers = stats.membersByStatus['ACTIVE'] ?? 0
  const totalOrders = Object.values(stats.ordersByStatus).reduce((s, n) => s + n, 0)
  const billedOrders = stats.ordersByStatus['BILLED'] ?? 0
  const maxQty = Math.max(...stats.topProducts.map((p) => p.quantity), 1)
  const maxDay = Math.max(...stats.dailyTraffic.map((d) => d.count), 1)

  const { homepageViews30, registerViews30, newMembers30 } = stats.funnel

  return (
    <div className="space-y-8">
      <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,3vw,30px)', color: 'var(--ink)' }}>
        Analytics
      </h1>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Members" value={activeMembers} sub={`${totalMembers} total`} icon={Users} />
        <StatCard label="Total Revenue" value={formatCents(stats.totalRevenue)} sub={`${billedOrders} paid orders`} icon={TrendingUp} />
        <StatCard label="Total Orders" value={totalOrders} sub={`${billedOrders} billed`} icon={ShoppingBag} />
        <StatCard label="Avg Order Value" value={billedOrders > 0 ? formatCents(Math.round(stats.totalRevenue / billedOrders)) : '—'} sub="billed orders only" icon={TrendingUp} />
      </div>

      {/* ── ACQUISITION FUNNEL ── */}
      <div className="border bg-cream-paper p-6 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-semibold text-stone-900">Acquisition Funnel</h2>
          <span className="text-xs text-stone-400">Last 30 days</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
          <FunnelStep
            label="Homepage Visits"
            count={homepageViews30}
            sub="unique tab sessions"
            rate={pct(registerViews30, homepageViews30)}
          />
          <FunnelStep
            label="Join Page Views"
            count={registerViews30}
            sub="/register"
            rate={pct(newMembers30, registerViews30)}
          />
          <FunnelStep
            label="New Signups"
            count={newMembers30}
            sub="completed registration"
            last
          />
        </div>
        {homepageViews30 === 0 && (
          <p className="text-xs text-stone-400 mt-4 italic">
            No visit data yet — tracking starts once the site receives traffic.
          </p>
        )}
      </div>

      {/* ── DAILY TRAFFIC ── */}
      <div className="border bg-cream-paper p-6 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-semibold text-stone-900">Daily Page Views</h2>
          <span className="text-xs text-stone-400">Last 14 days</span>
        </div>
        <div className="flex items-end gap-1.5 h-28">
          {stats.dailyTraffic.map(({ date, count }) => (
            <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full bg-terracotta/70 group-hover:bg-terracotta transition-colors"
                style={{ height: `${Math.max(4, Math.round((count / maxDay) * 88))}px` }}
              />
              <span className="text-[9px] text-stone-400">{shortDate(date)}</span>
              {/* Tooltip */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-stone-800 text-white text-xs px-2 py-0.5 whitespace-nowrap">
                {count}
              </div>
            </div>
          ))}
        </div>
        {stats.dailyTraffic.every((d) => d.count === 0) && (
          <p className="text-xs text-stone-400 mt-2 italic text-center">No traffic recorded yet.</p>
        )}
      </div>

      {/* ── TOP REFERRERS + MEMBER BREAKDOWN side by side ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Referrers */}
        <div className="border bg-cream-paper p-6 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-semibold text-stone-900">Top Referrers</h2>
            <span className="text-xs text-stone-400">Last 30 days</span>
          </div>
          {stats.topReferrers.length === 0 ? (
            <p className="text-sm text-stone-400 py-4 text-center">No referrer data yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.topReferrers.map(({ referrer, count }) => {
                let display = referrer
                try { display = new URL(referrer).hostname.replace(/^www\./, '') } catch { /* ok */ }
                return (
                  <div key={referrer} className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: 'var(--cream-deep)' }}>
                    <span className="text-sm text-stone-700 truncate max-w-[70%]">{display}</span>
                    <span className="text-sm font-semibold text-stone-900 shrink-0">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Member breakdown */}
        <div className="border bg-cream-paper p-6 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
          <h2 className="font-semibold text-stone-900 mb-4">Members by Status</h2>
          <div className="space-y-3">
            {[
              { key: 'ACTIVE', label: 'Active', color: 'bg-green-500' },
              { key: 'PAUSED', label: 'Paused', color: 'bg-amber-400' },
              { key: 'CANCELLED', label: 'Cancelled', color: 'bg-red-400' },
              { key: 'WAITLIST', label: 'Waitlist', color: 'bg-blue-400' },
            ].map(({ key, label, color }) => {
              const count = stats.membersByStatus[key] ?? 0
              const p = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-stone-700">{label}</span>
                    <span className="font-medium text-stone-900">{count} <span className="text-stone-400 font-normal">({p}%)</span></span>
                  </div>
                  <div className="h-2 bg-stone-100">
                    <div className={`h-2 ${color} transition-all`} style={{ width: `${p}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── REVENUE BY QUARTER ── */}
      <div className="border bg-cream-paper p-6 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
        <h2 className="font-semibold text-stone-900 mb-4">Revenue by Quarter</h2>
        {stats.quarterRevenue.length === 0 ? (
          <p className="text-sm text-stone-400 py-4 text-center">No billed orders yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.quarterRevenue.map(({ label, revenue, orders }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: 'var(--cream-deep)' }}>
                <div>
                  <p className="text-sm font-medium text-stone-800">{label}</p>
                  <p className="text-xs text-stone-400">{orders} orders</p>
                </div>
                <p className="font-semibold text-stone-900">{formatCents(revenue)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── TOP PRODUCTS ── */}
      <div className="border bg-cream-paper p-6 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
        <h2 className="font-semibold text-stone-900 mb-4">Most Popular Products</h2>
        {stats.topProducts.length === 0 ? (
          <p className="text-sm text-stone-400 py-4 text-center">No order items yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.topProducts.map(({ product, quantity }) => {
              if (!product) return null
              const p = Math.round((quantity / maxQty) * 100)
              return (
                <div key={product.id}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="flex-1 text-sm text-stone-700 truncate">{product.name}</span>
                    {product.style && <span className="bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{product.style}</span>}
                    <span className="text-sm font-semibold text-stone-900">{quantity}</span>
                  </div>
                  <div className="h-1.5 bg-stone-100">
                    <div className="h-1.5 bg-terracotta transition-all" style={{ width: `${p}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── ORDERS BY STATUS ── */}
      <div className="border bg-cream-paper p-6 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
        <h2 className="font-semibold text-stone-900 mb-4">Orders by Status</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {['PENDING_CUSTOMIZATION', 'CUSTOMIZED', 'LOCKED', 'AWAITING_PICKUP', 'PICKED_UP', 'BILLED'].map((status) => (
            <div key={status} className="border p-3 text-center" style={{ borderColor: 'var(--rule)' }}>
              <p className="text-2xl font-bold text-stone-900">{stats.ordersByStatus[status] ?? 0}</p>
              <p className="mt-1 text-xs text-stone-400">{status.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
