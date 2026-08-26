import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDateTime } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, MapPin, Clock, Tag } from 'lucide-react'
import { EventActions } from './EventActions'
import { EmailActionButton } from '@/components/admin/EmailActionButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Club Event' }

const TYPE_LABELS: Record<string, string> = {
  RELEASE_PARTY: 'Release Party',
  TASTING: 'Tasting',
  FARM_VISIT: 'Farm Visit',
  WORKSHOP: 'Workshop',
  OTHER: 'Event',
}

export default async function AdminEventDetailPage({
  params,
}: {
  params: { eventId: string }
}) {
  const event = await prisma.clubEvent.findUnique({
    where: { id: params.eventId },
  })

  if (!event) notFound()

  const typeLabel = TYPE_LABELS[event.eventType] ?? event.eventType

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/admin/events" className="mt-1 text-stone-500 hover:text-stone-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(20px,3vw,28px)', color: 'var(--ink)' }}>
            {event.title}
          </h1>
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-stone-500">
            <span className="flex items-center gap-1">
              <Tag className="h-4 w-4" />{typeLabel}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDateTime(event.startsAt)}
              {event.endsAt && ` – ${formatDateTime(event.endsAt)}`}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />{event.location}
              </span>
            )}
          </div>
          {!event.isPublic && (
            <span className="inline-block mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5">
              Hidden from members
            </span>
          )}
        </div>
        <EventActions
          event={{
            id: event.id,
            title: event.title,
            description: event.description,
            eventType: event.eventType,
            startsAt: event.startsAt.toISOString(),
            endsAt: event.endsAt?.toISOString() ?? null,
            location: event.location,
            isPublic: event.isPublic,
            notes: event.notes,
          }}
        />
      </div>

      {/* Description */}
      {event.description && (
        <Card>
          <h2 className="font-semibold text-stone-900 mb-2">Description</h2>
          <p className="text-sm text-stone-700 whitespace-pre-wrap">{event.description}</p>
        </Card>
      )}

      {/* Communications */}
      <Card>
        <h2 className="font-semibold text-stone-900 mb-1">Communications</h2>
        <p className="text-sm text-stone-500 mb-4">
          Send an event alert to all members who opted into event notifications.
        </p>
        <EmailActionButton
          endpoint={`/api/events/${event.id}/send-alert`}
          label="Send event alert"
          confirm={`Announce "${event.title}" to all members who opted into event alerts?`}
          successText="Alerted {n} member{s}."
        />
      </Card>

      {/* Internal notes */}
      {event.notes && (
        <Card>
          <h2 className="font-semibold text-stone-900 mb-2">Internal Notes</h2>
          <p className="text-sm text-stone-600 whitespace-pre-wrap">{event.notes}</p>
        </Card>
      )}
    </div>
  )
}
