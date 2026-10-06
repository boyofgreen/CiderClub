import { wallClockToDate } from '@/lib/eventTime'

const EVENT_TYPES = ['RELEASE_PARTY', 'TASTING', 'FARM_VISIT', 'WORKSHOP', 'OTHER']
const SOURCES = ['MANUAL', 'LINK', 'AI']

const text = (v: unknown, max = 5000) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null

const httpsUrl = (v: unknown) => {
  const s = text(v, 1000)
  return s && /^https:\/\/[^\s]+$/i.test(s) ? s : null
}

/** Validate the admin event form body shared by create and update. */
export function parseEventBody(body: Record<string, unknown>) {
  const title = text(body.title, 200)
  const startsAt = typeof body.startsAt === 'string' ? wallClockToDate(body.startsAt) : null
  if (!title || !startsAt) return { error: 'Title and start time are required' } as const

  const endsAt = typeof body.endsAt === 'string' && body.endsAt ? wallClockToDate(body.endsAt) : null
  if (endsAt && endsAt < startsAt) return { error: 'End time is before the start time' } as const

  return {
    data: {
      title,
      description: text(body.description),
      eventType: EVENT_TYPES.includes(body.eventType as string) ? (body.eventType as string) : 'OTHER',
      startsAt,
      endsAt,
      location: text(body.location, 300),
      isPublic: body.isPublic !== false,
      imageUrl: httpsUrl(body.imageUrl) ?? (typeof body.imageUrl === 'string' && body.imageUrl.startsWith('/') ? body.imageUrl : null),
      notes: text(body.notes),
      ticketUrl: httpsUrl(body.ticketUrl),
      priceText: text(body.priceText, 60),
      soldOut: body.soldOut === true,
    },
    source: SOURCES.includes(body.source as string) ? (body.source as string) : 'MANUAL',
    sourceUrl: httpsUrl(body.sourceUrl),
  } as const
}
