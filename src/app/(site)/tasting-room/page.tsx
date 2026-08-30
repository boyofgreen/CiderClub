import type { Metadata } from 'next'
import { Hero } from '@/components/site/Hero'
import { Photo } from '@/components/site/Photo'
import { SITE, HOURS } from '@/lib/siteInfo'

export const metadata: Metadata = {
  title: 'Tasting Room',
  description:
    'Six ciders on tap and twenty-plus in bottle at 405 HWY 90 West in Castroville, twenty minutes west of San Antonio. Family friendly, Wednesday through Saturday.',
  alternates: { canonical: '/tasting-room' },
}

const FACTS = [
  ['Flights', 'Four pours, your pick'],
  ['Family', 'All ages welcome'],
  ['Non-Alc', 'Always one on tap'],
  ['Private', 'Book the whole room'],
]

const BOARD: Array<[string, string, string]> = [
  ['/photos/bottle-pinkerton.webp', 'Pinkerton', 'Dry, bright, a little tannic'],
  ['/photos/bottle-peach.webp', 'Peach', 'Orchard sweet, Texas summer'],
  ['/photos/bottle-blueberry.webp', 'Blueberry Buckle', 'Sweet, jammy, dessert in a glass'],
  ['/photos/bottle-grenadine.webp', 'Grenadine', 'Pomegranate, tart finish'],
]

const STRIP: Array<[string, string]> = [
  ['/brand/storefront.jpg', 'The storefront on HWY 90'],
  ['/site/cider-flight.webp', 'A flight of cider'],
  ['/brand/bottles-shelf.jpg', 'Bottles on the shelf'],
  ['/photos/social-april.webp', 'An afternoon at the cider house'],
]

export default function TastingRoomPage() {
  return (
    <>
      <Hero
        src="/site/tasting-room-sign.webp"
        alt="Hill Country Cider House tasting room sign"
        vh={80}
        minHeight={480}
        scrimV="linear-gradient(180deg,rgba(20,16,12,0.55) 0%,rgba(20,16,12,0.28) 30%,rgba(20,16,12,0.72) 62%,rgba(20,16,12,0.95) 100%)"
        scrimH="linear-gradient(90deg,rgba(20,16,12,0.7) 0%,rgba(20,16,12,0.25) 55%,rgba(20,16,12,0) 100%)"
      >
        <p className="hc-eyebrow">405 HWY 90 West · Castroville</p>
        <h1
          className="hc-display"
          style={{
            fontSize: 'clamp(38px,6.6vw,104px)',
            lineHeight: 0.95,
            letterSpacing: '-0.042em',
            maxWidth: '18ch',
          }}
        >
          The tasting room.
        </h1>
        <p
          style={{
            fontSize: 19,
            lineHeight: 1.65,
            color: 'rgba(245,238,227,0.78)',
            maxWidth: '52ch',
            margin: '28px 0 0',
            fontWeight: 300,
          }}
        >
          Wednesday through Saturday, twenty minutes west of San Antonio. Pull off the highway, take
          a stool, and stay a while.
        </p>
      </Hero>

      {/* ── What to expect ──────────────────────────────────────────────── */}
      <section className="hc-bone hc-section">
        <div className="hc-wrap hc-grid-2" style={{ alignItems: 'center' }}>
          <Photo
            src="/photos/tasting-room-crowd.webp"
            alt="A busy afternoon in the tasting room"
            height={620}
            sizes="(max-width: 900px) 100vw, 50vw"
            className="hc-img--md"
          />
          <div>
            <p className="hc-eyebrow">What to Expect</p>
            <h2
              className="hc-display"
              style={{ fontSize: 'clamp(34px,4.2vw,60px)', lineHeight: 1.03, margin: '0 0 30px' }}
            >
              Sips are always free.
            </h2>
            <p className="hc-lede" style={{ marginBottom: 22, maxWidth: '52ch' }}>
              Six ciders on tap — always one with no alcohol — and more than twenty in bottle. Never
              had a dry cider? Say so. We&rsquo;ll walk you down the board until something lands.
            </p>
            <p className="hc-lede" style={{ marginBottom: 40, maxWidth: '52ch' }}>
              Kids are welcome, dogs are welcome on the patio, and the pizza next door travels well.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1,
                background: 'var(--hc-hairline-light)',
              }}
            >
              {FACTS.map(([label, value], i) => (
                <div
                  key={label}
                  style={{
                    background: 'var(--hc-bone)',
                    padding: i % 2 === 0 ? '24px 24px 24px 0' : 24,
                  }}
                >
                  <div className="hc-label" style={{ marginBottom: 8 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 17 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── On the board ────────────────────────────────────────────────── */}
      <section className="hc-dark hc-section">
        <div className="hc-wrap">
          <p className="hc-eyebrow" style={{ marginBottom: 24 }}>
            On the Board
          </p>
          <h2
            className="hc-display"
            style={{ fontSize: 'clamp(34px,4.2vw,62px)', margin: '0 0 56px' }}
          >
            What&rsquo;s pouring now.
          </h2>
          <div className="hc-grid-4">
            {BOARD.map(([src, name, note]) => (
              <div key={name}>
                <Photo
                  src={src}
                  alt={`${name} cider`}
                  height={400}
                  sizes="(max-width: 900px) 50vw, 25vw"
                  className="hc-img--md"
                />
                <div
                  style={{
                    fontFamily: 'var(--font-display), sans-serif',
                    fontSize: 24,
                    margin: '22px 0 8px',
                  }}
                >
                  {name}
                </div>
                <div style={{ fontSize: 15.5, color: 'rgba(245,238,227,0.58)', fontWeight: 300 }}>
                  {note}
                </div>
              </div>
            ))}
          </div>
          <p
            style={{
              fontSize: 16,
              color: 'rgba(245,238,227,0.5)',
              fontWeight: 300,
              margin: '44px 0 0',
            }}
          >
            Taps rotate weekly — the full bottle list lives in the{' '}
            <a href={SITE.shop} target="_blank" rel="noopener noreferrer">
              shop
            </a>
            .
          </p>
        </div>
      </section>

      {/* ── Hours + getting here ────────────────────────────────────────── */}
      <section className="hc-deep hc-section">
        <div className="hc-wrap hc-grid-2">
          <div>
            <p className="hc-eyebrow" style={{ marginBottom: 32 }}>
              Hours
            </p>
            <div className="hc-rows">
              {HOURS.map((h) => (
                <div
                  key={h.days}
                  className="hc-hours-row"
                  style={{ color: h.hours === 'Closed' ? 'rgba(245,238,227,0.5)' : undefined }}
                >
                  <span>{h.days}</span>
                  <span>{h.hours}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="hc-eyebrow" style={{ marginBottom: 32 }}>
              Getting Here
            </p>
            <a
              href={SITE.addressMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: 27,
                lineHeight: 1.4,
                display: 'block',
                marginBottom: 22,
              }}
            >
              405 HWY 90 West
              <br />
              Castroville, TX 78009
            </a>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.75,
                color: 'rgba(245,238,227,0.66)',
                fontWeight: 300,
                margin: '0 0 34px',
                maxWidth: '44ch',
              }}
            >
              Twenty-five minutes west of downtown San Antonio on HWY 90. Free parking out front.
              Look for the longhorn.
            </p>
            <div className="flex flex-wrap" style={{ gap: 14 }}>
              <a
                href={SITE.addressMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hc-btn hc-btn--accent"
              >
                Get Directions
              </a>
              <a
                href={SITE.phoneHref}
                className="hc-btn hc-btn--outline"
                style={{ whiteSpace: 'nowrap' }}
              >
                {SITE.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="hc-tiles">
        {STRIP.map(([src, alt]) => (
          <Photo key={src} src={src} alt={alt} height={300} sizes="25vw" className="hc-img--md" />
        ))}
      </section>
    </>
  )
}
