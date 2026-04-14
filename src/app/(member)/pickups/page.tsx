import { redirect } from 'next/navigation'
import { getAppSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Calendar, MapPin, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pickup Events' }

export default async function MemberPickupsPage() {
  const session = await getAppSession()
  if (!session?.memberId) redirect('/login')

  const upcoming = await prisma.pickupEvent.findMany({
    where: { isPublic: true, endsAt: { gte: new Date() } },
    include: { quarter: true },
    orderBy: { startsAt: 'asc' },
  })

  const past = await prisma.pickupEvent.findMany({
    where: { isPublic: true, endsAt: { lt: new Date() } },
    include: { quarter: true },
    orderBy: { startsAt: 'desc' },
    take: 5,
  })

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-stone-900">Pickup Events</h1>

      {/* Upcoming */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-3">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-stone-500">
            No upcoming pickup events scheduled yet.
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((event) => (
              <Card key={event.id}>
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                    <Calendar className="h-6 w-6 text-brand-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-stone-900">{event.title}</h3>
                    <p className="text-sm text-stone-500 mt-0.5">
                      {event.quarter.label}
                      {event.quarter.name ? ` — ${event.quarter.name}` : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-stone-600">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-stone-400" />
                        {formatDateTime(event.startsAt)} – {formatDateTime(event.endsAt)}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-stone-400" />
                          {event.location}
                        </span>
                      )}
                    </div>
                    {event.notes && (
                      <p className="mt-2 text-sm text-stone-500 bg-stone-50 rounded-lg p-2">{event.notes}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500 mb-3">Past Events</h2>
          <div className="space-y-2">
            {past.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 opacity-60">
                <div>
                  <span className="font-medium text-stone-700">{event.title}</span>
                  <span className="ml-2 text-sm text-stone-400">{event.quarter.label}</span>
                </div>
                <span className="text-sm text-stone-400">{formatDate(event.startsAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
