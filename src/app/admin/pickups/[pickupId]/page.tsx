import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDateTime, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, MapPin, Clock, CheckCircle } from 'lucide-react'
import { CheckInButton } from './CheckInButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pickup Event' }

export default async function AdminPickupDetailPage({
  params,
}: {
  params: { pickupId: string }
}) {
  const event = await prisma.pickupEvent.findUnique({
    where: { id: params.pickupId },
    include: {
      quarter: true,
      orders: {
        include: { member: true },
        orderBy: [{ status: 'asc' }],
      },
      attendances: {
        include: { member: true },
        orderBy: { rsvpAt: 'asc' },
      },
    },
  })

  if (!event) notFound()

  const checkedIn = event.attendances.filter((a) => a.checkedInAt).length

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/admin/pickups" className="mt-1 text-stone-500 hover:text-stone-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-stone-900">{event.title}</h1>
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-stone-500">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatDateTime(event.startsAt)} – {formatDateTime(event.endsAt)}</span>
            {event.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{event.location}</span>}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Orders', value: event.orders.length },
          { label: 'RSVPs', value: event.attendances.length },
          { label: 'Checked In', value: checkedIn },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-stone-900">{s.value}</p>
            <p className="text-xs text-stone-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Orders / check-in list */}
      <Card>
        <h2 className="font-semibold text-stone-900 mb-4">Orders</h2>
        {event.orders.length === 0 ? (
          <p className="text-sm text-stone-400 py-4 text-center">No orders assigned to this pickup yet.</p>
        ) : (
          <div className="space-y-2">
            {event.orders.map((order) => {
              const attendance = event.attendances.find((a) => a.memberId === order.memberId)
              return (
                <div key={order.id} className="flex items-center justify-between rounded-lg border border-stone-200 px-4 py-3">
                  <div>
                    <p className="font-medium text-stone-800">
                      {order.member.firstName} {order.member.lastName}
                    </p>
                    <p className="text-xs text-stone-400">{order.member.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    {attendance?.checkedInAt ? (
                      <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                        <CheckCircle className="h-4 w-4" />
                        In
                      </div>
                    ) : (
                      <CheckInButton
                        pickupId={event.id}
                        memberId={order.memberId}
                        orderId={order.id}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
