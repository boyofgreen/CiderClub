import { prisma } from '@/lib/prisma'
import { formatCents } from '@/lib/utils'
import { Users, TrendingUp, ShoppingBag, ArrowRight } from 'lucide-react'
import { RangePicker } from './RangePicker'
import { PATH_LABELS } from '@/lib/siteInfo'

export const metadata = { title: 'Analytics' }

const MS_DAY = 86_400_000

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function niceDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type SearchParams = { range?: string; from?: string; to?: string }

// Resolve the requested date range from query params.
// Presets: ?range=7|14|30|90|365 (days). Custom: ?from=yyyy-mm-dd&to=yyyy-mm-dd.
function parseRange(sp: SearchParams) {
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  if (sp.from || sp.to) {
    const from = sp.from ? new Date(`${sp.from}T00:00:00`) : daysAgo(29)
    const to = sp.to ? new Date(`${sp.to}T23:59:59.999`) : endOfToday
    if (!isNaN(from.getTime()) && !isNaN(to.getTime()) && from <= to) {
      return { from, to, key: 'custom', label: `${niceDate(from)} – ${niceDate(to)}` }
    }
  }

  const days = ['7', '14', '30', '90', '365'].includes(sp.range ?? '') ? Number(sp.range) : 30
  return {
    from: daysAgo(days - 1),
    to: endOfToday,
    key: String(days),
    label: `Last ${days} days`,
  }
}

async function getStats(from: Date, to: Date) {
  const inRange = { gte: from, lte: to }

  const [
    membersByStatus,
    ordersByStatus,
    revenueResult,
    topProducts,
    quarterRevenue,
    // Acquisition funnel (within range)
    siteViews,
    clubViews,
    registerViews,
    newMembers,
    // Raw views for the traffic chart
    rangeViews,
    // Top referrers (within range)
    topReferrers,
    // Views per page
    viewsByPath,
  ] = await Promise.all([
    prisma.member.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.aggregate({ where: { status: 'BILLED' }, _sum: { totalInCents: true } }),
    prisma.orderItem.groupBy({ by: ['productId'], _sum: { quantity: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 8 }),
    prisma.order.groupBy({ by: ['quarterId'], where: { status: 'BILLED' }, _sum: { totalInCents: true }, _count: { _all: true } }),
    // Any marketing page counts as a site visit at the top of the funnel
    prisma.pageView.count({
      where: { path: { notIn: ['/club', '/register', '/magic/request'] }, createdAt: inRange },
    }),
    prisma.pageView.count({ where: { path: '/club', createdAt: inRange } }),
    prisma.pageView.count({ where: { path: '/register', createdAt: inRange } }),
    prisma.member.count({ where: { createdAt: inRange } }),
    prisma.pageView.findMany({
      where: { createdAt: inRange },
      select: { createdAt: true },
    }),
    prisma.pageView.groupBy({
      by: ['referrer'],
      where: { createdAt: inRange, referrer: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { referrer: 'desc' } },
      take: 8,
    }),
    prisma.pageView.groupBy({
      by: ['path'],
      where: { createdAt: inRange },
      _count: { _all: true },
      orderBy: { _count: { path: 'desc' } },
      take: 12,
    }),
  ])

  // Traffic buckets: daily for ranges up to 45 days, weekly beyond that.
  const totalDays = Math.max(1, Math.floor((to.getTime() - from.getTime()) / MS_DAY) + 1)
  const stepDays = totalDays > 45 ? 7 : 1
  const numBuckets = Math.ceil(totalDays / stepDays)
  const counts = new Array<number>(numBuckets).fill(0)
  for (const row of rangeViews) {
    const idx = Math.floor((row.createdAt.getTime() - from.getTime()) / (stepDays * MS_DAY))
    if (idx >= 0 && idx < numBuckets) counts[idx]++
  }
  const traffic = counts.map((count, i) => {
    const start = new Date(from.getTime() + i * stepDays * MS_DAY)
    return {
      iso: isoDate(start),
      label: `${start.getMonth() + 1}/${start.getDate()}`,
      count,
    }
  })

  // Products
  const productIds = topProducts.map((r) => r.productId)
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, style: true } })
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]))

  const quarterIds = quarterRevenue.map((r) => r.quarterId).filter(Boolean) as string[]
  const quarters = await prisma.quarter.findMany({ where: { id: { in: quarterIds } }, select: { id: true, label: true }, orderBy: { label: 'desc' } })
  const quarterMap = Object.fromEntries(quarters.map((q) => [q.id, q]))
  const quarterLabel = (id: string | null) => (id ? quarterMap[id]?.label ?? id : 'Ad Hoc')

  return {
    membersByStatus: Object.fromEntries(membersByStatus.map((r) => [r.status, r._count._all])),
    ordersByStatus: Object.fromEntries(ordersByStatus.map((r) => [r.status, r._count._all])),
    totalRevenue: revenueResult._sum.totalInCents ?? 0,
    topProducts: topProducts.map((r) => ({ product: productMap[r.productId], quantity: r._sum.quantity ?? 0 })),
    quarterRevenue: quarterRevenue
      .sort((a, b) => quarterLabel(b.quarterId).localeCompare(quarterLabel(a.quarterId)))
      .map((r) => ({ label: quarterLabel(r.quarterId), revenue: r._sum.totalInCents ?? 0, orders: r._count._all })),
    funnel: { siteViews, clubViews, registerViews, newMembers },
    traffic,
    trafficStep: stepDays,
    topReferrers: topReferrers
      .filter((r) => r.referrer)
      .map((r) => ({ referrer: r.referrer!, count: r._count._all })),
    topPages: viewsByPath.map((r) => ({
      path: r.path,
      label: PATH_LABELS[r.path] ?? r.path,
      count: r._count._all,
    })),
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

export default async function AnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const range = parseRange(searchParams)
  const stats = await getStats(range.from, range.to)

  const totalMembers = Object.values(stats.membersByStatus).reduce((s, n) => s + n, 0)
  const activeMembers = stats.membersByStatus['ACTIVE'] ?? 0
  const totalOrders = Object.values(stats.ordersByStatus).reduce((s, n) => s + n, 0)
  const billedOrders = stats.ordersByStatus['BILLED'] ?? 0
  const maxQty = Math.max(...stats.topProducts.map((p) => p.quantity), 1)
  const maxBucket = Math.max(...stats.traffic.map((d) => d.count), 1)
  // Thin out x-axis labels when there are many bars
  const labelEvery = Math.ceil(stats.traffic.length / 16)

  const { siteViews, clubViews, registerViews, newMembers } = stats.funnel
  const maxPageViews = Math.max(...stats.topPages.map((p) => p.count), 1)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,3vw,30px)', color: 'var(--ink)' }}>
          Analytics
        </h1>
        <RangePicker activeKey={range.key} from={isoDate(range.from)} to={isoDate(range.to)} />
      </div>

      {/* KPI row (all-time) */}
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
          <span className="text-xs text-stone-400">{range.label}</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
          <FunnelStep
            label="Site Visits"
            count={siteViews}
            sub="all marketing pages"
            rate={pct(clubViews, siteViews)}
          />
          <FunnelStep
            label="Cider Club Page"
            count={clubViews}
            sub="/club"
            rate={pct(registerViews, clubViews)}
          />
          <FunnelStep
            label="Join Page Views"
            count={registerViews}
            sub="/register"
            rate={pct(newMembers, registerViews)}
          />
          <FunnelStep
            label="New Signups"
            count={newMembers}
            sub="completed registration"
            last
          />
        </div>
        {siteViews === 0 && (
          <p className="text-xs text-stone-400 mt-4 italic">
            No visit data in this range — tracking starts once the site receives traffic.
          </p>
        )}
      </div>

      {/* ── TRAFFIC CHART ── */}
      <div className="border bg-cream-paper p-6 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-semibold text-stone-900">
            {stats.trafficStep === 7 ? 'Weekly Page Views' : 'Daily Page Views'}
          </h2>
          <span className="text-xs text-stone-400">
            {range.label}
            {stats.trafficStep === 7 ? ' · grouped by week' : ''}
          </span>
        </div>
        <div className="flex items-end gap-1 h-28">
          {stats.traffic.map(({ iso, label, count }, i) => (
            <div key={iso} className="flex-1 flex flex-col items-center gap-1 group relative min-w-0">
              <div
                className="w-full bg-terracotta/70 group-hover:bg-terracotta transition-colors"
                style={{ height: `${Math.max(4, Math.round((count / maxBucket) * 88))}px` }}
              />
              <span className="text-[9px] text-stone-400 whitespace-nowrap">
                {i % labelEvery === 0 ? label : ' '}
              </span>
              {/* Tooltip */}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-stone-800 text-white text-xs px-2 py-0.5 whitespace-nowrap z-10">
                {stats.trafficStep === 7 ? `wk of ${label}: ` : `${label}: `}{count}
              </div>
            </div>
          ))}
        </div>
        {stats.traffic.every((d) => d.count === 0) && (
          <p className="text-xs text-stone-400 mt-2 italic text-center">No traffic recorded in this range.</p>
        )}
      </div>

      {/* ── TOP PAGES ── */}
      <div className="border bg-cream-paper p-6 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-semibold text-stone-900">Top Pages</h2>
          <span className="text-xs text-stone-400">{range.label}</span>
        </div>
        {stats.topPages.length === 0 ? (
          <p className="text-sm text-stone-400 py-4 text-center">No page views in this range.</p>
        ) : (
          <div className="space-y-3">
            {stats.topPages.map(({ path, label, count }) => (
              <div key={path}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-stone-700">
                    {label}
                    <span className="ml-2 text-xs text-stone-400">{path}</span>
                  </span>
                  <span className="font-semibold text-stone-900">{count.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-stone-100">
                  <div
                    className="h-1.5 bg-terracotta transition-all"
                    style={{ width: `${Math.round((count / maxPageViews) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── TOP REFERRERS + MEMBER BREAKDOWN side by side ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Referrers */}
        <div className="border bg-cream-paper p-6 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-semibold text-stone-900">Top Referrers</h2>
            <span className="text-xs text-stone-400">{range.label}</span>
          </div>
          {stats.topReferrers.length === 0 ? (
            <p className="text-sm text-stone-400 py-4 text-center">No referrer data in this range.</p>
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
