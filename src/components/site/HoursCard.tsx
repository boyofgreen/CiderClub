import { SITE, HOURS } from '@/lib/siteInfo'
import { MapPin, Phone, Mail } from 'lucide-react'

/** Address + hours block, used on the home and tasting room pages. */
export function HoursCard() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div>
        <p className="smallcaps mb-3" style={{ color: 'var(--terracotta)' }}>Find Us</p>
        <a
          href={SITE.addressMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-2 hover:opacity-75 transition"
          style={{ color: 'var(--ink)', textDecoration: 'none' }}
        >
          <MapPin className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--gold-deep)' }} />
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 20, lineHeight: 1.4 }}>
            {SITE.address}
          </span>
        </a>
        <div className="mt-5 space-y-2">
          <a href={SITE.phoneHref} className="flex items-center gap-2 text-sm hover:opacity-75" style={{ color: 'var(--ink-soft)', textDecoration: 'none' }}>
            <Phone className="h-4 w-4" style={{ color: 'var(--gold-deep)' }} />
            {SITE.phone}
          </a>
          <a href={`mailto:${SITE.email}`} className="flex items-center gap-2 text-sm hover:opacity-75" style={{ color: 'var(--ink-soft)', textDecoration: 'none' }}>
            <Mail className="h-4 w-4" style={{ color: 'var(--gold-deep)' }} />
            {SITE.email}
          </a>
        </div>
      </div>

      <div>
        <p className="smallcaps mb-3" style={{ color: 'var(--terracotta)' }}>Hours of Operation</p>
        <div className="border" style={{ borderColor: 'var(--rule)' }}>
          {HOURS.map((h, i) => {
            const closed = h.hours === 'Closed'
            return (
              <div
                key={h.days}
                className="flex items-center justify-between px-4 py-2.5"
                style={{
                  borderTop: i > 0 ? '1px solid var(--rule)' : 'none',
                  backgroundColor: closed ? 'transparent' : 'var(--cream-deep)',
                }}
              >
                <span className="text-sm" style={{ color: closed ? 'var(--ink-soft)' : 'var(--ink)', opacity: closed ? 0.6 : 1 }}>
                  {h.days}
                </span>
                <span
                  className="text-sm"
                  style={{
                    fontFamily: closed ? 'var(--font-sans)' : 'var(--font-serif)',
                    fontStyle: closed ? 'normal' : 'italic',
                    fontSize: closed ? 13 : 16,
                    color: closed ? 'var(--ink-soft)' : 'var(--terracotta)',
                    opacity: closed ? 0.6 : 1,
                  }}
                >
                  {h.hours}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
