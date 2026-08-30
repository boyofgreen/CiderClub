import type { Metadata } from 'next'
import { Hero } from '@/components/site/Hero'
import { Photo } from '@/components/site/Photo'
import { SITE } from '@/lib/siteInfo'

export const metadata: Metadata = {
  title: 'Saturdays in Comfort',
  description:
    'A personalized, private cider tasting on twenty acres at Holiday Orchard in Comfort, Texas. One group at a time, ninety minutes, five to seven ciders.',
}

const BOOKING_MAILTO = `mailto:${SITE.email}?subject=${encodeURIComponent('Saturdays in Comfort booking')}`

const INCLUDED = [
  'Welcome cocktails upon arrival',
  'Five to seven ciders presented for tasting',
  'Charcuterie and palette inspirations throughout',
  'Exclusive access to Holiday Orchard',
  'Unmatched Texas hospitality',
]

export default function ComfortPage() {
  return (
    <>
      <Hero
        src="/photos/supper-dusk-table.webp"
        alt="Candlelit table at dusk on the property at Holiday Orchard"
        vh={86}
        minHeight={520}
        objectPosition="50% 45%"
        scrimV="linear-gradient(180deg,rgba(20,16,12,0.5) 0%,rgba(20,16,12,0.26) 34%,rgba(20,16,12,0.82) 74%,rgba(20,16,12,0.96) 100%)"
        scrimH="linear-gradient(90deg,rgba(20,16,12,0.72) 0%,rgba(20,16,12,0.26) 56%,rgba(20,16,12,0) 100%)"
      >
        <p className="hc-eyebrow">Comfort, Texas · Holiday Orchard</p>
        <h1
          className="hc-display"
          style={{
            fontSize: 'clamp(38px,6.6vw,104px)',
            lineHeight: 0.95,
            letterSpacing: '-0.042em',
            maxWidth: '16ch',
          }}
        >
          Saturdays in Comfort.
        </h1>
        <p
          style={{
            fontSize: 19,
            lineHeight: 1.65,
            color: 'rgba(245,238,227,0.8)',
            maxWidth: '52ch',
            margin: '28px 0 38px',
            fontWeight: 300,
          }}
        >
          A personalized, private tasting on twenty acres of rolling Hill Country. One group at a
          time — the whole place is yours.
        </p>
        <a href={BOOKING_MAILTO} className="hc-btn hc-btn--accent">
          Book a Saturday
        </a>
      </Hero>

      {/* ── Ninety minutes ──────────────────────────────────────────────── */}
      <section className="hc-bone">
        <div className="hc-split hc-split--even">
          <div className="hc-split__text">
            <p className="hc-eyebrow">Ninety Minutes</p>
            <h2
              className="hc-display"
              style={{ fontSize: 'clamp(34px,4.2vw,60px)', lineHeight: 1.03, margin: '0 0 30px' }}
            >
              The whole property, just for your party.
            </h2>
            <p className="hc-lede" style={{ marginBottom: 22, maxWidth: '54ch' }}>
              Holiday Orchard is our micro-event retreat in Comfort — twenty acres, thoughtful and
              unhurried, rooted in the quiet character of this place. Your tasting is guided by one
              of our storytelling cider makers.
            </p>
            <p className="hc-lede" style={{ marginBottom: 44, maxWidth: '54ch' }}>
              Reserved for parties of two or more, with special pricing and tailored accommodations
              for groups of ten or larger.
            </p>
            <div className="hc-rows" style={{ maxWidth: 560 }}>
              {INCLUDED.map((item) => (
                <div key={item} style={{ padding: '20px 0', fontSize: 17.5 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <Photo
            src="/site/comfort-hills.webp"
            alt="Rolling Hill Country views at Holiday Orchard in Comfort, Texas"
            minHeight={860}
            sizes="(max-width: 900px) 100vw, 50vw"
            className="hc-img--fill"
          />
        </div>
      </section>

      <section className="hc-tiles hc-tiles--2">
        <Photo
          src="/site/comfort-flutes.webp"
          alt="Three flutes of cider with flowers"
          height={620}
          sizes="50vw"
          className="hc-img--md"
        />
        <Photo
          src="/site/comfort-dessert.webp"
          alt="Plated dessert with blueberry jam and candied lemon"
          height={620}
          sizes="50vw"
          className="hc-img--md"
        />
      </section>

      {/* ── Find us / book ──────────────────────────────────────────────── */}
      <section className="hc-deep hc-section">
        <div className="hc-wrap hc-grid-2" style={{ alignItems: 'center' }}>
          <div>
            <p className="hc-eyebrow">Find Us</p>
            <h2
              className="hc-display"
              style={{
                fontSize: 'clamp(32px,3.8vw,54px)',
                lineHeight: 1.04,
                margin: '0 0 28px',
                maxWidth: '22ch',
              }}
            >
              In the hills of Comfort, Texas.
            </h2>
            <a
              href={SITE.comfortMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: 25,
                lineHeight: 1.4,
                display: 'block',
                letterSpacing: '-0.02em',
              }}
            >
              130 Holiday Road
              <br />
              Comfort, TX 78013
            </a>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.75,
                color: 'rgba(245,238,227,0.62)',
                fontWeight: 300,
                margin: '22px 0 0',
                maxWidth: '42ch',
              }}
            >
              Just minutes from High Street.
            </p>
          </div>

          <div className="hc-bordered-col">
            <p className="hc-eyebrow">Now Booking</p>
            <h3
              className="hc-display"
              style={{
                fontSize: 32,
                lineHeight: 1.1,
                letterSpacing: '-0.035em',
                margin: '0 0 24px',
              }}
            >
              Schedule a private tasting.
            </h3>
            <div className="flex flex-wrap" style={{ gap: 14, marginBottom: 26 }}>
              <a href={BOOKING_MAILTO} className="hc-btn hc-btn--accent">
                Book Now
              </a>
              <a
                href={SITE.phoneHref}
                className="hc-btn hc-btn--outline"
                style={{ whiteSpace: 'nowrap' }}
              >
                {SITE.phone}
              </a>
            </div>
            <a
              href={`mailto:${SITE.email}`}
              style={{ fontSize: 16, color: 'rgba(245,238,227,0.62)', fontWeight: 300 }}
            >
              {SITE.email}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
