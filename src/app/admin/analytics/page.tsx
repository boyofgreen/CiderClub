import { prisma } from '@/lib/prisma'
import { formatCents } from '@/lib/utils'
import { Users, TrendingUp, ShoppingBag, Beer } from 'lucide-react'

export const metadata = { title: 'Analytics' }

async function getStats() {
  const [
    membersByStatus,
    ordersByStatus,
    revenueResult,
    topProducts,
    quarterRevenue,
  ] = await Promise.all([
    prisma.member.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.aggregate({
      where: { status: 'BILLED' },
      _sum: { totalInCents: true },
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 8,
    }),
    prisma.order.groupBy({
      by: ['quarterId'],
      where: { status: 'BILLED' },
      _sum: { totalInCents: true },
      _count: { _all: true },
    }),
  ])

  // Resolve product names for top products
  const productIds = topProducts.map((r) => r.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, style: true },
  })
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]))

  // Resolve quarter labels
  const quarterIds = quarterRevenue.map((r) => r.quarterId)
  const quarters = await prisma.quarter.findMany({
    where: { id: { in: quarterIds } },
    select: { id: true, label: true },
    orderBy: { label: 'desc' },
  })
  const quarterMap = Object.fromEntries(quarters.map((q) => [q.id, q]))

  return {
    membersByStatus: Object.fromEntries(membersByStatus.map((r) => [r.status, r._count._all])),
    ordersByStatus: Object.fromEntries(ordersByStatus.map((r) => [r.status, r._count._all])),
    totalRevenue: revenueResult._sum.totalInCents ?? 0,
    topProducts: topProducts.map((r) => ({
      product: productMap[r.productId],
      quantity: r._sum.quantity ?? 0,
    })),
    quarterRevenue: quarterRevenue
      .sort((a, b) => (quarterMap[b.quarterId]?.label ?? '').localeCompare(quarterMap[a.quarterId]?.label ?? ''))
      .map((r) => ({
        label: quarterMap[r.quarterId]?.label ?? r.quarterId,
        revenue: r._sum.totalInCents ?? 0,
        orders: r._count._all,
      })),
  }
}

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: string | number; sub?: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-stone-500">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
          <Icon className="h-4 w-4 text-brand-600" />
        </div>
      </div>
      <p className="text-2xl font-bold text-stone-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-stone-400">{sub}</p>}
    </div>
  )
}

export default async function AnalyticsPage() {
  const stats = await getStats()

  const totalMembers = Object.values(stats.membersByStatus).reduce((s, n) => s + n, 0)
  const activeMembers = stats.membersByStatus['ACTIVE'] ?? 0
  const totalOrders = Object.values(stats.ordersByStatus).reduce((s, n) => s + n, 0)
  const billedOrders = stats.ordersByStatus['BILLED'] ?? 0

  const maxQty = Math.max(...stats.topProducts.map((p) => p.quantity), 1)

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-stone-900">Analytics</h1>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Members" value={activeMembers} sub={`${totalMembers} total`} icon={Users} />
        <StatCard label="Total Revenue" value={formatCents(stats.totalRevenue)} sub={`${billedOrders} paid orders`} icon={TrendingUp} />
        <StatCard label="Total Orders" value={totalOrders} sub={`${billedOrders} billed`} icon={ShoppingBag} />
        <StatCard
          label="Avg Order Value"
          value={billedOrders > 0 ? formatCents(Math.round(stats.totalRevenue / billedOrders)) : '—'}
          sub="billed orders only"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Member breakdown */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-stone-900 mb-4">Members by Status</h2>
          <div className="space-y-3">
            {[
              { key: 'ACTIVE', label: 'Active', color: 'bg-green-500' },
              { key: 'PAUSED', label: 'Paused', color: 'bg-amber-400' },
              { key: 'CANCELLED', label: 'Cancelled', color: 'bg-red-400' },
              { key: 'WAITLIST', label: 'Waitlist', color: 'bg-blue-400' },
            ].map(({ key, label, color }) => {
              const count = stats.membersByStatus[key] ?? 0
              const pct = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-stone-700">{label}</span>
                    <span className="font-medium text-stone-900">{count} <span className="text-stone-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-stone-100">
                    <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Revenue by quarter */}
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-stone-900 mb-4">Revenue by Quarter</h2>
          {stats.quarterRevenue.length === 0 ? (
            <p className="text-sm text-stone-400 py-4 text-center">No billed orders yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.quarterRevenue.map(({ label, revenue, orders }) => (
                <div key={label} className="flex items-center justify-between rounded-lg bg-stone-50 px-4 py-3">
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
      </div>

      {/* Top products */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-stone-900 mb-4">Most Popular Products</h2>
        {stats.topProducts.length === 0 ? (
          <p className="text-sm text-stone-400 py-4 text-center">No order items yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.topProducts.map(({ product, quantity }) => {
              if (!product) return null
              const pct = Math.round((quantity / maxQty) * 100)
              return (
                <div key={product.id}>
                  <div className="flex items-center gap-3 mb-1">
                    <Beer className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                    <span className="flex-1 text-sm text-stone-700 truncate">{product.name}</span>
                    {product.style && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{product.style}</span>
                    )}
                    <span className="text-sm font-semibold text-stone-900">{quantity}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-stone-100">
                    <div className="h-1.5 rounded-full bg-brand-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Orders by status */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-stone-900 mb-4">Orders by Status</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            'PENDING_CUSTOMIZATION',
            'CUSTOMIZED',
            'LOCKED',
            'AWAITING_PICKUP',
            'PICKED_UP',
            'BILLED',
          ].map((status) => (
            <div key={status} className="rounded-lg border border-stone-200 p-3 text-center">
              <p className="text-2xl font-bold text-stone-900">{stats.ordersByStatus[status] ?? 0}</p>
              <p className="mt-1 text-xs text-stone-400">{status.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
