import { redirect } from 'next/navigation'
import { getAppSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { PartyPopper, MapPin, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Club Events' }

const TYPE_LABELS: Record<string, string> = {
  RELEASE_PARTY: 'Release Party',
  TASTING: 'Tasting',
  FARM_VISIT: 'Farm Visit',
  WORKSHOP: 'Workshop',
  OTHER: 'Event',
}

export default async function MemberEventsPage() {
  const session = await getAppSession()
  if (!session?.memberId) redirect('/login')

  const now = new Date()

  const upcoming = await prisma.clubEvent.findMany({
    where: { isPublic: true, startsAt: { gte: now } },
    orderBy: { startsAt: 'asc' },
  })

  const past = await prisma.clubEvent.findMany({
    where: { isPublic: true, startsAt: { lt: now } },
    orderBy: { startsAt: 'desc' },
    take: 6,
  })

  return (
    <div className="space-y-8">
      <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,3vw,30px)', color: 'var(--ink)' }}>
        Club Events
      </h1>

      {/* Upcoming */}
      <div>
        <p className="smallcaps mb-3" style={{ color: 'var(--ink-soft)' }}>Upcoming</p>
        {upcoming.length === 0 ? (
          <div className="border border-dashed p-8 text-center text-stone-500" style={{ borderColor: 'var(--rule-strong)' }}>
            <PartyPopper className="mx-auto h-8 w-8 text-stone-300 mb-2" />
            No upcoming events yet — check back soon!
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((event) => (
              <Card key={event.id}>
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center"
                    style={{ backgroundColor: 'var(--cream-deep)' }}
                  >
                    <PartyPopper className="h-6 w-6 text-terracotta" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-stone-900">{event.title}</h3>
                      <span
                        className="shrink-0 text-xs font-semibold uppercase tracking-wider px-2 py-0.5"
                        style={{ backgroundColor: 'var(--cream-deep)', color: 'var(--ink-soft)' }}
                      >
                        {TYPE_LABELS[event.eventType] ?? event.eventType}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-stone-600">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-stone-400" />
                        {formatDateTime(event.startsAt)}
                        {event.endsAt && ` – ${formatDateTime(event.endsAt)}`}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-stone-400" />
                          {event.location}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="mt-2 text-sm text-stone-600">{event.description}</p>
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
          <p className="smallcaps mb-3" style={{ color: 'var(--ink-soft)' }}>Past Events</p>
          <div className="space-y-2">
            {past.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between border px-4 py-3 opacity-60"
                style={{ backgroundColor: 'var(--paper)', borderColor: 'var(--rule)' }}
              >
                <div>
                  <span className="font-medium text-stone-700">{event.title}</span>
                  <span className="ml-2 text-sm text-stone-400">
                    {TYPE_LABELS[event.eventType] ?? event.eventType}
                  </span>
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
