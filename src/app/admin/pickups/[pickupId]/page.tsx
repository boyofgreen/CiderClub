import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDateTime, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, MapPin, Clock, CheckCircle } from 'lucide-react'
import { CheckInButton } from './CheckInButton'
import { PickupActions } from './PickupActions'
import { EmailActionButton } from '@/components/admin/EmailActionButton'
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
        <div className="flex-1">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(20px,3vw,28px)', color: 'var(--ink)' }}>{event.title}</h1>
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-stone-500">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatDateTime(event.startsAt)} – {formatDateTime(event.endsAt)}</span>
            {event.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{event.location}</span>}
          </div>
        </div>
        <PickupActions
          event={{
            id: event.id,
            title: event.title,
            location: event.location,
            startsAt: event.startsAt.toISOString(),
            endsAt: event.endsAt.toISOString(),
            notes: event.notes,
            isPublic: event.isPublic,
            orderCount: event.orders.length,
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Orders', value: event.orders.length },
          { label: 'RSVPs', value: event.attendances.length },
          { label: 'Checked In', value: checkedIn },
        ].map((s) => (
          <div key={s.label} className="border bg-cream-paper p-4 shadow-sm text-center" style={{ borderColor: 'var(--rule)' }}>
            <p className="text-2xl font-bold text-stone-900">{s.value}</p>
            <p className="text-xs text-stone-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Email actions */}
      <Card>
        <h2 className="font-semibold text-stone-900 mb-1">Communications</h2>
        <p className="text-sm text-stone-500 mb-4">
          Send emails about this event. Reminders go to members with an order this quarter;
          event alerts go to all members who opted in.
        </p>
        <div className="flex flex-wrap items-start gap-4">
          <EmailActionButton
            endpoint={`/api/pickups/${event.id}/send-reminders`}
            label="Send pickup reminder"
            confirm="Send a pickup reminder to all members with an order this quarter?"
            successText={(n) => `Reminded ${n} member${n !== 1 ? 's' : ''}.`}
          />
          <EmailActionButton
            endpoint={`/api/pickups/${event.id}/send-alert`}
            label="Send event alert"
            confirm="Announce this event to all members who opted into event alerts?"
            successText={(n) => `Alerted ${n} member${n !== 1 ? 's' : ''}.`}
          />
        </div>
      </Card>

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
                <div key={order.id} className="flex items-center justify-between rounded-lg border px-4 py-3" style={{ borderColor: 'var(--rule)' }}>
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
