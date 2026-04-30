import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAppSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { formatCents, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { ChevronRight, ShoppingBag } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Orders' }

export default async function MemberOrdersPage() {
  const session = await getAppSession()
  if (!session?.memberId) redirect('/login')

  const orders = await prisma.order.findMany({
    where: { memberId: session.memberId },
    include: {
      quarter: true,
      items: { include: { product: true } },
      pickupEvent: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,3vw,30px)', color: 'var(--ink)' }}>
        My Orders
      </h1>

      {orders.length === 0 ? (
        <div className="border border-dashed p-12 text-center" style={{ borderColor: 'var(--rule-strong)' }}>
          <ShoppingBag className="mx-auto h-10 w-10 text-stone-300" />
          <p className="mt-3 font-medium text-stone-500">No orders yet</p>
          <p className="mt-1 text-sm text-stone-400">
            Your orders will appear here when your first quarterly order is generated.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/member/orders/${order.id}`}
              className="block bg-cream-paper p-5 transition hover:bg-cream border"
              style={{ borderColor: 'var(--rule)' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900">{order.quarter.label}</span>
                    {order.quarter.name && (
                      <span className="text-sm text-stone-500">— {order.quarter.name}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-stone-500">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} ·{' '}
                    {formatCents(order.totalInCents)}
                    {order.billedAt && ` · Paid ${formatDate(order.billedAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.status} />
                  <ChevronRight className="h-4 w-4 text-stone-400" />
                </div>
              </div>

              {/* Item preview */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {order.items.map((item) => (
                  <span
                    key={item.id}
                    className="px-2.5 py-1 text-xs text-stone-600"
                    style={{ backgroundColor: 'var(--cream-deep)' }}
                  >
                    {item.product.name} ×{item.quantity}
                  </span>
                ))}
              </div>

              {order.pickupEvent && (
                <p className="mt-3 text-xs text-stone-400">
                  📍 Pickup: {formatDate(order.pickupEvent.startsAt)} · {order.pickupEvent.location}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
