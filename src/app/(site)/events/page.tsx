import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { SITE } from '@/lib/siteInfo'
import { JsonLd, SITE_URL } from '@/lib/seo'
import { eventDateParts, formatEventDateTime, formatEventTime, toVenueIso, venueNow } from '@/lib/eventTime'

export const metadata: Metadata = {
  title: 'Events',
  description:
    'Supper clubs, release parties, tastings and cigar nights at Hill Country Cider House in Castroville and Comfort, Texas.',
  alternates: { canonical: '/events' },
}

// New events should appear as soon as they're saved, and the build has no database.
export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<string, string> = {
  RELEASE_PARTY: 'Release Party',
  TASTING: 'Tasting',
  FARM_VISIT: 'On the Farm',
  WORKSHOP: 'Workshop',
  OTHER: 'Event',
}

type Event = Awaited<ReturnType<typeof getEvents>>['upcoming'][number]

async function getEvents() {
  // Stored times are venue wall clock (see lib/eventTime), so compare against
  // Texas local time on the same scale rather than the server's UTC clock.
  const localNow = venueNow()
  try {
    const [upcoming, past] = await Promise.all([
      prisma.clubEvent.findMany({
        where: {
          isPublic: true,
          OR: [{ endsAt: { gte: localNow } }, { endsAt: null, startsAt: { gte: localNow } }],
        },
        orderBy: { startsAt: 'asc' },
      }),
      prisma.clubEvent.findMany({
        where: { isPublic: true, startsAt: { lt: localNow }, OR: [{ endsAt: null }, { endsAt: { lt: localNow } }] },
        orderBy: { startsAt: 'desc' },
        take: 6,
      }),
    ])
    return { upcoming, past }
  } catch (err) {
    console.error('[events] failed to load events:', err)
    return { upcoming: [], past: [] }
  }
}

function eventSchema(e: Event) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    description: e.description ?? undefined,
    startDate: toVenueIso(e.startsAt),
    endDate: e.endsAt ? toVenueIso(e.endsAt) : undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    image: e.imageUrl ? [e.imageUrl.startsWith('/') ? `${SITE_URL}${e.imageUrl}` : e.imageUrl] : undefined,
    location: {
      '@type': 'Place',
      name: e.location ?? SITE.name,
      address: e.location ?? SITE.address,
    },
    organizer: { '@type': 'Organization', name: SITE.name, url: SITE_URL },
    offers: e.ticketUrl
      ? {
          '@type': 'Offer',
          url: e.ticketUrl,
          availability: 'https://schema.org/InStock',
          ...(e.priceText && /\d/.test(e.priceText)
            ? { price: e.priceText.replace(/[^\d.]/g, ''), priceCurrency: 'USD' }
            : {}),
        }
      : undefined,
  }
}

function EventCard({ e }: { e: Event }) {
  const d = eventDateParts(e.startsAt)
  const time = e.endsAt
    ? `${formatEventTime(e.startsAt)} – ${formatEventTime(e.endsAt)}`
    : formatEventTime(e.startsAt)

  return (
    <article
      className="grid gap-0 border md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
      style={{ borderColor: 'var(--hc-hairline)' }}
    >
      <div className="relative min-h-[220px]" style={{ background: 'var(--hc-deep, #221913)' }}>
        {e.imageUrl ? (
          // Remote ticketing CDNs vary per event, so a plain <img> rather than next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={e.imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <div className="hc-label" style={{ letterSpacing: '0.3em' }}>{d.month}</div>
            <div
              className="hc-display"
              style={{ fontSize: 96, lineHeight: 1, letterSpacing: '-0.05em', margin: '6px 0' }}
            >
              {d.day}
            </div>
            <div style={{ fontSize: 15, color: 'rgba(245,238,227,0.6)', fontWeight: 300 }}>{d.weekday}</div>
          </div>
        )}
      </div>

      <div style={{ padding: 'clamp(28px,4vw,48px)' }}>
        <p className="hc-eyebrow" style={{ marginBottom: 16 }}>
          {TYPE_LABELS[e.eventType] ?? 'Event'} · {d.weekday}, {d.month.charAt(0) + d.month.slice(1).toLowerCase()} {d.day}
        </p>
        <h2
          className="hc-display"
          style={{ fontSize: 'clamp(26px,3vw,40px)', lineHeight: 1.08, letterSpacing: '-0.035em', margin: '0 0 18px' }}
        >
          {e.title}
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(245,238,227,0.72)', margin: '0 0 6px' }}>{time}</p>
        {e.location && (
          <p style={{ fontSize: 16, color: 'rgba(245,238,227,0.55)', fontWeight: 300, margin: 0 }}>{e.location}</p>
        )}
        {e.description && (
          <p
            style={{
              fontSize: 16.5,
              lineHeight: 1.7,
              color: 'rgba(245,238,227,0.66)',
              fontWeight: 300,
              margin: '22px 0 0',
              maxWidth: '60ch',
              whiteSpace: 'pre-line',
            }}
          >
            {e.description}
          </p>
        )}
        {e.ticketUrl && (
          <div className="flex flex-wrap items-center" style={{ gap: 18, marginTop: 30 }}>
            <a href={e.ticketUrl} target="_blank" rel="noopener noreferrer" className="hc-btn hc-btn--accent">
              Get Tickets
            </a>
            {e.priceText && (
              <span style={{ fontSize: 16, color: 'rgba(245,238,227,0.6)' }}>{e.priceText}</span>
            )}
          </div>
        )}
      </div>
    </article>
  )
}

export default async function EventsPage() {
  const { upcoming, past } = await getEvents()

  return (
    <>
      {upcoming.map((e) => (
        <JsonLd key={e.id} data={eventSchema(e)} />
      ))}

      <section className="hc-dark hc-section--top">
        <div className="hc-wrap">
          <p className="hc-eyebrow" style={{ marginBottom: 28 }}>
            On the Calendar
          </p>
          <h1
            className="hc-display"
            style={{ fontSize: 'clamp(38px,6.4vw,100px)', lineHeight: 0.96, letterSpacing: '-0.042em', maxWidth: '18ch' }}
          >
            Come out and see us.
          </h1>
          <p
            style={{
              fontSize: 19,
              lineHeight: 1.65,
              color: 'rgba(245,238,227,0.75)',
              maxWidth: '54ch',
              margin: '28px 0 0',
              fontWeight: 300,
            }}
          >
            Supper clubs in the orchard, release parties, tastings and cigar nights — in Castroville and
            out at Holiday Orchard in Comfort.
          </p>
        </div>
      </section>

      <section className="hc-dark" style={{ paddingBottom: 120 }}>
        <div className="hc-wrap" style={{ display: 'grid', gap: 32 }}>
          {upcoming.length > 0 ? (
            upcoming.map((e) => <EventCard key={e.id} e={e} />)
          ) : (
            <div className="border text-center" style={{ borderColor: 'var(--hc-hairline)', padding: '64px 24px' }}>
              <p className="hc-display" style={{ fontSize: 28, margin: '0 0 12px' }}>
                Nothing on the calendar just yet.
              </p>
              <p style={{ fontSize: 16.5, color: 'rgba(245,238,227,0.62)', fontWeight: 300, margin: '0 0 28px' }}>
                New dates go up on Instagram first — or swing by the tasting room, open Wednesday through Saturday.
              </p>
              <div className="flex flex-wrap justify-center" style={{ gap: 14 }}>
                <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" className="hc-btn hc-btn--accent">
                  Follow on Instagram
                </a>
                <Link href="/tasting-room" className="hc-btn hc-btn--outline">
                  Tasting Room Hours
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {past.length > 0 && (
        <section className="hc-deep hc-section">
          <div className="hc-wrap">
            <p className="hc-eyebrow" style={{ marginBottom: 32 }}>
              Recently
            </p>
            <div className="hc-rows">
              {past.map((e) => (
                <div key={e.id} className="hc-hours-row">
                  <span>{e.title}</span>
                  <span style={{ color: 'rgba(245,238,227,0.5)' }}>{formatEventDateTime(e.startsAt).split(',').slice(0, 3).join(',')}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
