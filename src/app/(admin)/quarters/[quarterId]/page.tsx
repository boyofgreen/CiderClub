import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate, formatCents } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'
import { QuarterActions } from './QuarterActions'
import { ProductsTab } from './ProductsTab'
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
      orders: {
        include: { member: true },
        orderBy: { createdAt: 'desc' },
      },
      pickupEvents: { orderBy: { startsAt: 'asc' } },
    },
  })

  if (!quarter) notFound()

  const allProducts = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

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
            <h1 className="text-2xl font-bold text-stone-900">{quarter.label}</h1>
            {quarter.name && <span className="text-lg text-stone-500">— {quarter.name}</span>}
            <StatusBadge status={quarter.status} />
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Customization: {formatDate(quarter.startsAt)} – {formatDate(quarter.endsAt)}
          </p>
        </div>
        <QuarterActions quarterId={quarter.id} status={quarter.status} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Orders', value: orderStats.total },
          { label: 'Pending', value: orderStats.pending + orderStats.customized },
          { label: 'Billed', value: orderStats.billed },
          { label: 'Revenue', value: formatCents(orderStats.revenue) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
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
        />

        {/* Pickup events */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-stone-900">Pickup Events</h2>
            <Link href={`/admin/pickups?quarter=${quarter.id}`} className="text-xs text-brand-600 hover:text-brand-700">
              Add event →
            </Link>
          </div>
          {quarter.pickupEvents.length === 0 ? (
            <p className="text-sm text-stone-400 py-4 text-center">
              No pickup events yet.{' '}
              <Link href={`/admin/pickups?quarter=${quarter.id}`} className="text-brand-600 underline">
                Schedule one
              </Link>
            </p>
          ) : (
            <div className="space-y-2">
              {quarter.pickupEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/admin/pickups/${event.id}`}
                  className="flex items-center justify-between rounded-lg border border-stone-200 px-4 py-3 hover:bg-stone-50 transition"
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

      {/* Orders table */}
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Orders ({orderStats.total})</h2>
          <Link href={`/admin/orders?quarter=${quarter.id}`} className="text-xs text-brand-600 hover:text-brand-700">
            View all →
          </Link>
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
                className="flex items-center justify-between px-6 py-3 hover:bg-stone-50 transition"
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
