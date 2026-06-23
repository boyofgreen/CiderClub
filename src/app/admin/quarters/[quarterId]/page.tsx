import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate, formatCents } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'
import { QuarterActions } from './QuarterActions'
import { ProductsTab } from './ProductsTab'
import { PrintButton } from './PrintButton'
import { EmailActionButton } from '@/components/admin/EmailActionButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Quarter Detail' }

export default async function QuarterDetailPage({
  params,
}: {
  params: { quarterId: string }
}) {
  const quarter = await prisma.quarter.findUnique({
    where: { id: params.quarterId },
    include: {
      products: { include: { product: true }, orderBy: { sortOrder: 'asc' } },
      planDefaults: {
        include: { product: true, plan: true },
        orderBy: { sortOrder: 'asc' },
      },
      orders: {
        include: { member: true },
        orderBy: { createdAt: 'desc' },
      },
      pickupEvents: { orderBy: { startsAt: 'asc' } },
    },
  })

  if (!quarter) notFound()

  const [allProducts, allPlans, rawItems] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.orderItem.findMany({
      where: { order: { quarterId: params.quarterId, status: { notIn: ['CANCELLED'] } } },
      include: { product: true },
    }),
  ])

  // Aggregate quantities per product for the pull sheet
  const ledgerMap = new Map<string, { name: string; style: string | null; total: number }>()
  for (const item of rawItems) {
    const existing = ledgerMap.get(item.productId)
    if (existing) {
      existing.total += item.quantity
    } else {
      ledgerMap.set(item.productId, { name: item.product.name, style: item.product.style, total: item.quantity })
    }
  }
  const ledger = [...ledgerMap.values()].sort((a, b) => b.total - a.total)
  const ledgerTotalBottles = ledger.reduce((s, r) => s + r.total, 0)
  const pendingCount = quarter.orders.filter((o) => o.status === 'PENDING_CUSTOMIZATION').length

  const orderStats = {
    total: quarter.orders.length,
    pending: quarter.orders.filter((o) => o.status === 'PENDING_CUSTOMIZATION').length,
    customized: quarter.orders.filter((o) => o.status === 'CUSTOMIZED').length,
    locked: quarter.orders.filter((o) => o.status === 'LOCKED').length,
    billed: quarter.orders.filter((o) => o.status === 'BILLED').length,
    failed: quarter.orders.filter((o) => o.status === 'PAYMENT_FAILED').length,
    revenue: quarter.orders
      .filter((o) => o.status === 'BILLED')
      .reduce((s, o) => s + o.totalInCents, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/admin/quarters" className="mt-1 text-stone-500 hover:text-stone-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(20px,3vw,28px)', color: 'var(--ink)' }}>{quarter.label}</h1>
            {quarter.name && <span className="text-lg text-stone-500">— {quarter.name}</span>}
            <StatusBadge status={quarter.status} />
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Customization: {formatDate(quarter.startsAt)} – {formatDate(quarter.endsAt)}
          </p>
        </div>
        <QuarterActions
          quarterId={quarter.id}
          status={quarter.status}
          initialData={{
            label: quarter.label,
            name: quarter.name,
            startsAt: quarter.startsAt.toISOString(),
            endsAt: quarter.endsAt.toISOString(),
            pickupStartsAt: quarter.pickupStartsAt?.toISOString() ?? null,
            pickupEndsAt: quarter.pickupEndsAt?.toISOString() ?? null,
          }}
          orderStats={{
            total: orderStats.total,
            billed: orderStats.billed,
            failed: orderStats.failed,
          }}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Orders', value: orderStats.total },
          { label: 'Pending', value: orderStats.pending + orderStats.customized },
          { label: 'Billed', value: orderStats.billed },
          { label: 'Revenue', value: formatCents(orderStats.revenue) },
        ].map((stat) => (
          <div key={stat.label} className="border bg-cream-paper p-4 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
            <p className="text-xs text-stone-500">{stat.label}</p>
            <p className="text-xl font-bold text-stone-900 mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Products */}
        <ProductsTab
          quarterId={quarter.id}
          quarterProducts={quarter.products}
          allProducts={allProducts}
          allPlans={allPlans}
          planDefaults={quarter.planDefaults}
        />

        {/* Pickup events */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-900">Pickup Events</h2>
            <Link href={`/admin/pickups?quarter=${quarter.id}`} className="text-xs text-terracotta hover:text-terracotta-deep">
              Add event →
            </Link>
          </div>
          {quarter.pickupEvents.length === 0 ? (
            <p className="text-sm text-stone-400 py-4 text-center">
              No pickup events yet.{' '}
              <Link href={`/admin/pickups?quarter=${quarter.id}`} className="text-terracotta underline">
                Schedule one
              </Link>
            </p>
          ) : (
            <div className="space-y-2">
              {quarter.pickupEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/admin/pickups/${event.id}`}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-cream-deep transition" style={{ borderColor: 'var(--rule)' }}
                >
                  <div>
                    <p className="font-medium text-stone-700 text-sm">{event.title}</p>
                    <p className="text-xs text-stone-400">{formatDate(event.startsAt)}</p>
                  </div>
                  <span className="text-xs text-stone-400">{event.location}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Pull Sheet */}
      <div className="border bg-cream-paper shadow-sm overflow-hidden print:shadow-none" style={{ borderColor: 'var(--rule)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <div>
            <h2 className="font-semibold text-stone-900">Pull Sheet</h2>
            <p className="text-xs text-stone-400 mt-0.5">
              {ledgerTotalBottles} bottle{ledgerTotalBottles !== 1 ? 's' : ''} across {ledger.length} cider{ledger.length !== 1 ? 's' : ''} · {quarter.orders.filter(o => o.status !== 'CANCELLED').length} orders included
              {pendingCount > 0 && (
                <span className="ml-2 text-amber-600">· {pendingCount} order{pendingCount !== 1 ? 's' : ''} not yet customized (using defaults)</span>
              )}
            </p>
          </div>
          <PrintButton />
        </div>

        {ledger.length === 0 ? (
          <p className="py-8 text-center text-stone-400 text-sm">No order items yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left">
                <th className="px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Cider</th>
                <th className="px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide hidden sm:table-cell">Style</th>
                <th className="px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide text-right">Bottles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {ledger.map((row) => (
                <tr key={row.name} className="hover:bg-cream-deep transition">
                  <td className="px-6 py-3 font-medium text-stone-800">{row.name}</td>
                  <td className="px-6 py-3 text-stone-400 hidden sm:table-cell">{row.style ?? '—'}</td>
                  <td className="px-6 py-3 text-right">
                    <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--terracotta)' }}>
                      {row.total}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-stone-200">
                <td className="px-6 py-3 font-semibold text-stone-700">Total</td>
                <td className="hidden sm:table-cell" />
                <td className="px-6 py-3 text-right">
                  <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--ink)', fontWeight: 600 }}>
                    {ledgerTotalBottles}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Orders table */}
      <div className="border bg-cream-paper shadow-sm overflow-hidden" style={{ borderColor: 'var(--rule)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Orders ({orderStats.total})</h2>
          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <EmailActionButton
                endpoint={`/api/quarters/${quarter.id}/send-reminders`}
                label="Send customization reminders"
                confirm={`Send a customization reminder to the ${pendingCount} member${pendingCount !== 1 ? 's' : ''} who haven't customized yet?`}
                successText={(n) => `Reminded ${n} member${n !== 1 ? 's' : ''}.`}
              />
            )}
            <Link href={`/admin/orders?quarter=${quarter.id}`} className="text-xs text-terracotta hover:text-terracotta-deep">
              View all →
            </Link>
          </div>
        </div>
        {quarter.orders.length === 0 ? (
          <p className="py-8 text-center text-stone-400 text-sm">
            No orders yet. Use the "Generate Orders" button above.
          </p>
        ) : (
          <div className="divide-y divide-stone-100">
            {quarter.orders.slice(0, 10).map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-cream-deep transition"
              >
                <span className="text-sm font-medium text-stone-800">
                  {order.member.firstName} {order.member.lastName}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-stone-500">{formatCents(order.totalInCents)}</span>
                  <StatusBadge status={order.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
