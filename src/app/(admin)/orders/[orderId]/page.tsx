import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCents, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Beer } from 'lucide-react'
import { OrderAdminActions } from './OrderAdminActions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Order Detail' }

export default async function AdminOrderDetailPage({
  params,
}: {
  params: { orderId: string }
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      member: { include: { plan: true } },
      quarter: { include: { products: { include: { product: true } } } },
      items: { include: { product: true } },
      pickupEvent: true,
    },
  })

  if (!order) notFound()

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/admin/orders" className="mt-1 text-stone-500 hover:text-stone-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-stone-900">
            Order — {order.member.firstName} {order.member.lastName}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={order.status} />
            <span className="text-sm text-stone-500">{order.quarter.label}</span>
            <span className="text-sm font-semibold text-stone-700">{formatCents(order.totalInCents)}</span>
          </div>
        </div>
        <OrderAdminActions
          orderId={order.id}
          status={order.status}
          memberHasCard={!!order.member.squareCardId}
          paymentLinkUrl={order.squarePaymentLinkUrl}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-stone-900 mb-3">Member</h2>
          <div className="space-y-1 text-sm">
            <Link href={`/admin/members/${order.member.id}`} className="font-medium text-brand-600 hover:text-brand-700">
              {order.member.firstName} {order.member.lastName}
            </Link>
            <p className="text-stone-500">{order.member.email}</p>
            <p className="text-stone-500">{order.member.plan.name}</p>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-stone-900 mb-3">Billing</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500">Total</span>
              <span className="font-semibold">{formatCents(order.totalInCents)}</span>
            </div>
            {order.billedAt && (
              <div className="flex justify-between">
                <span className="text-stone-500">Paid on</span>
                <span>{formatDate(order.billedAt)}</span>
              </div>
            )}
            {order.billingMethod && (
              <div className="flex justify-between">
                <span className="text-stone-500">Method</span>
                <span>{order.billingMethod.replace(/_/g, ' ')}</span>
              </div>
            )}
            {order.squarePaymentLinkUrl && (
              <a
                href={order.squarePaymentLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-brand-600 hover:text-brand-700 underline text-xs mt-1"
              >
                Payment link →
              </a>
            )}
            {order.squareReceiptUrl && (
              <a
                href={order.squareReceiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-brand-600 hover:text-brand-700 underline text-xs"
              >
                Square receipt →
              </a>
            )}
          </div>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <h2 className="font-semibold text-stone-900 mb-4">
          Order Items ({order.items.reduce((s, i) => s + i.quantity, 0)} / {order.member.plan.packsPerOrder})
        </h2>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Beer className="h-4 w-4 text-brand-500" />
                <div>
                  <p className="font-medium text-stone-800">{item.product.name}</p>
                  {item.product.style && (
                    <p className="text-xs text-stone-400">{item.product.style}</p>
                  )}
                </div>
              </div>
              <span className="font-semibold text-stone-700">×{item.quantity}</span>
            </div>
          ))}
        </div>
        {order.lastCustomizedAt && (
          <p className="mt-3 text-xs text-stone-400">
            Last customized: {formatDate(order.lastCustomizedAt)}
          </p>
        )}
      </Card>

      {/* Pickup */}
      {order.pickupEvent && (
        <Card>
          <h2 className="font-semibold text-stone-900 mb-3">Pickup</h2>
          <p className="font-medium text-stone-700">{order.pickupEvent.title}</p>
          <p className="text-sm text-stone-500">{formatDate(order.pickupEvent.startsAt)}</p>
          {order.pickupEvent.location && (
            <p className="text-sm text-stone-500">{order.pickupEvent.location}</p>
          )}
          {order.pickedUpAt && (
            <p className="mt-2 text-xs text-green-600 font-medium">
              ✓ Picked up {formatDate(order.pickedUpAt)}
            </p>
          )}
        </Card>
      )}

      {/* Admin notes */}
      {order.adminNotes && (
        <Card>
          <h2 className="font-semibold text-stone-900 mb-2">Admin Notes</h2>
          <p className="text-sm text-stone-600">{order.adminNotes}</p>
        </Card>
      )}
    </div>
  )
}
