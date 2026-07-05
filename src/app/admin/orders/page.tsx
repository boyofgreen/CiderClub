import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCents, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { ChevronRight, Plus } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Orders' }

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; quarter?: string; page?: string }
}) {
  const page = parseInt(searchParams.page ?? '1')
  const pageSize = 30
  const status = searchParams.status
  const quarterId = searchParams.quarter

  const where = {
    ...(status ? { status } : {}),
    // 'adhoc' is a virtual filter for orders created outside the quarterly cycle
    ...(quarterId ? (quarterId === 'adhoc' ? { quarterId: null } : { quarterId }) : {}),
  }

  const [orders, total, quarters] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { member: true, quarter: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
    prisma.quarter.findMany({ orderBy: [{ year: 'desc' }, { quarter: 'desc' }], take: 8 }),
  ])

  const statuses = [
    'PENDING_CUSTOMIZATION', 'CUSTOMIZED', 'LOCKED', 'AWAITING_PICKUP',
    'PICKED_UP', 'BILLED', 'PAYMENT_FAILED', 'CANCELLED',
  ]

  const activePill = 'bg-terracotta text-white border-terracotta'
  const inactivePill = 'border-stone-300 text-stone-600 hover:bg-stone-50'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,3vw,30px)', color: 'var(--ink)' }}>
          Orders
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-500">{total} orders</span>
          <Link href="/admin/orders/new" className="btn-saloon flex items-center gap-1.5" style={{ fontSize: 10, padding: '10px 16px' }}>
            <Plus className="h-3.5 w-3.5" /> New Ad Hoc Order
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <Link href={`/admin/orders${quarterId ? `?quarter=${quarterId}` : ''}`} className={`px-3 py-1 text-xs font-medium border transition ${!status ? 'bg-stone-900 text-white border-stone-900' : inactivePill}`}>
            All
          </Link>
          {statuses.map((s) => (
            <Link key={s} href={`/admin/orders?status=${s}${quarterId ? `&quarter=${quarterId}` : ''}`} className={`px-3 py-1 text-xs font-medium border transition ${status === s ? 'bg-stone-900 text-white border-stone-900' : inactivePill}`}>
              {s.replace(/_/g, ' ')}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Link href={`/admin/orders${status ? `?status=${status}` : ''}`} className={`px-3 py-1 text-xs font-medium border transition ${!quarterId ? activePill : inactivePill}`}>
            All Quarters
          </Link>
          {quarters.map((q) => (
            <Link key={q.id} href={`/admin/orders?quarter=${q.id}${status ? `&status=${status}` : ''}`} className={`px-3 py-1 text-xs font-medium border transition ${quarterId === q.id ? activePill : inactivePill}`}>
              {q.label}
            </Link>
          ))}
          <Link href={`/admin/orders?quarter=adhoc${status ? `&status=${status}` : ''}`} className={`px-3 py-1 text-xs font-medium border transition ${quarterId === 'adhoc' ? activePill : inactivePill}`}>
            Ad Hoc
          </Link>
        </div>
      </div>

      <div className="border bg-cream-paper shadow-sm overflow-hidden" style={{ borderColor: 'var(--rule)' }}>
        <div className="divide-y divide-stone-100">
          {orders.length === 0 ? (
            <p className="py-8 text-center text-stone-400">No orders found.</p>
          ) : (
            orders.map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-cream-deep transition">
                <div>
                  <span className="font-medium text-stone-800">{order.member.firstName} {order.member.lastName}</span>
                  <span className="ml-2 text-sm text-stone-500">{order.quarter?.label ?? 'Ad Hoc'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-stone-500">{formatCents(order.totalInCents)}</span>
                  {order.lastCustomizedAt && (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-teal-50 text-teal-700">
                      Customized
                    </span>
                  )}
                  <StatusBadge status={order.status} />
                  <ChevronRight className="h-4 w-4 text-stone-400" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {Math.ceil(total / pageSize) > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">Page {page} of {Math.ceil(total / pageSize)}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/orders?page=${page - 1}${status ? `&status=${status}` : ''}${quarterId ? `&quarter=${quarterId}` : ''}`} className="btn-secondary py-1.5 px-3">Previous</Link>}
            {page < Math.ceil(total / pageSize) && <Link href={`/admin/orders?page=${page + 1}${status ? `&status=${status}` : ''}${quarterId ? `&quarter=${quarterId}` : ''}`} className="btn-secondary py-1.5 px-3">Next</Link>}
          </div>
        </div>
      )}
    </div>
  )
}
