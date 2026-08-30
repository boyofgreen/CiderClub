import type { Metadata } from 'next'
import Link from 'next/link'
import { Hero } from '@/components/site/Hero'
import { Photo } from '@/components/site/Photo'
import { SITE, HOURS } from '@/lib/siteInfo'

export const metadata: Metadata = {
  title: 'Cigars',
  description:
    'Mayfin cigars on the open-air porch in Castroville, plus our cider and cigar flight. Twenty minutes west of San Antonio. Outdoor seating only, 21 and up.',
  alternates: { canonical: '/cigars' },
}

// NOTE: these are stand-ins from the existing library so the page reads well
// today. Swap the four paths below for real cigar photography when it lands —
// nothing else needs to change.
const HERO_IMG = '/photos/rodeo-night.webp'
const HUMIDOR_IMG = '/photos/social-april.webp'
const FLIGHT_IMG = '/site/cider-flight.webp'
const PORCH_IMG = '/photos/supper-dusk-table.webp'

const PORCH_FACTS: Array<[string, string]> = [
  ['Outdoors', 'Open-air porch only'],
  ['Ages', '21 and up to smoke'],
  ['Pairing', 'Cider & cigar flight'],
  ['Weather', 'Best on a clear evening'],
]

export default function CigarsPage() {
  return (
    <>
      <Hero
        src={HERO_IMG}
        alt="An evening on the porch at Hill Country Cider House"
        vh={80}
        minHeight={480}
        objectPosition="50% 45%"
        scrimV="linear-gradient(180deg,rgba(20,16,12,0.58) 0%,rgba(20,16,12,0.3) 30%,rgba(20,16,12,0.78) 66%,rgba(20,16,12,0.96) 100%)"
        scrimH="linear-gradient(90deg,rgba(20,16,12,0.74) 0%,rgba(20,16,12,0.28) 56%,rgba(20,16,12,0) 100%)"
      >
        <p className="hc-eyebrow">Mayfin Cigars · On the Porch</p>
        <h1
          className="hc-display"
          style={{
            fontSize: 'clamp(38px,6.6vw,104px)',
            lineHeight: 0.95,
            letterSpacing: '-0.042em',
            maxWidth: '17ch',
          }}
        >
          Cider and cigars, under an open sky.
        </h1>
        <p
          style={{
            fontSize: 19,
            lineHeight: 1.65,
            color: 'rgba(245,238,227,0.8)',
            maxWidth: '54ch',
            margin: '28px 0 38px',
            fontWeight: 300,
          }}
        >
          We carry Mayfin cigars, and we pour the cider to go with them. Everything happens out on
          the porch &mdash; no smoky room, just Texas evening air.
        </p>
        <Link href="/tasting-room" className="hc-btn hc-btn--accent">
          Plan Your Visit
        </Link>
      </Hero>

      {/* ── Mayfin ──────────────────────────────────────────────────────── */}
      <section className="hc-bone hc-section">
        <div className="hc-wrap hc-grid-2" style={{ alignItems: 'center' }}>
          <div>
            <p className="hc-eyebrow">The Humidor</p>
            <h2
              className="hc-display"
              style={{ fontSize: 'clamp(34px,4.2vw,60px)', lineHeight: 1.03, margin: '0 0 30px' }}
            >
              We carry Mayfin.
            </h2>
            <p className="hc-lede" style={{ marginBottom: 22, maxWidth: '52ch' }}>
              Mayfin is a small-batch cigar maker, and that suits us &mdash; we spend our days
              pressing fruit in small lots, so we know what care at that scale looks like. We keep a
              humidor behind the bar and a rotating handful of their sticks in it.
            </p>
            <p className="hc-lede" style={{ marginBottom: 40, maxWidth: '52ch' }}>
              New to cigars? Say so. Same as the cider board &mdash; tell us what you like and
              we&rsquo;ll point you at something that fits, without the ceremony.
            </p>
            <div className="flex flex-wrap" style={{ gap: 14 }}>
              <a href={SITE.phoneHref} className="hc-btn hc-btn--outline" style={{ whiteSpace: 'nowrap' }}>
                Ask What&rsquo;s In Stock
              </a>
            </div>
          </div>
          <Photo
            src={HUMIDOR_IMG}
            alt="An evening at the cider house"
            height={620}
            sizes="(max-width: 900px) 100vw, 50vw"
            className="hc-img--md"
          />
        </div>
      </section>

      {/* ── The flight ──────────────────────────────────────────────────── */}
      <section className="hc-dark hc-section">
        <div className="hc-wrap hc-grid-2" style={{ alignItems: 'center' }}>
          <Photo
            src={FLIGHT_IMG}
            alt="A flight of cider ready for pairing"
            height={620}
            sizes="(max-width: 900px) 100vw, 50vw"
            className="hc-img--md"
          />
          <div>
            <p className="hc-eyebrow">The Pairing</p>
            <h2
              className="hc-display"
              style={{ fontSize: 'clamp(34px,4.2vw,60px)', lineHeight: 1.03, margin: '0 0 30px' }}
            >
              The cider &amp; cigar flight.
            </h2>
            <p className="hc-lede" style={{ marginBottom: 22, maxWidth: '52ch' }}>
              A cigar from the humidor and a flight of cider chosen to sit beside it. Cider does
              something beer and whiskey can&rsquo;t here &mdash; the acid cuts through the smoke and
              resets your palate between draws, so the last third tastes like the first.
            </p>
            <p className="hc-lede" style={{ marginBottom: 22, maxWidth: '52ch' }}>
              We&rsquo;ll build the pour around what you pick: something dry and tannic to stand up
              to a fuller stick, or the fruit-forward end of the board for something milder.
            </p>
            <p
              style={{
                fontSize: 16,
                color: 'rgba(245,238,227,0.55)',
                fontWeight: 300,
                margin: '0 0 34px',
                maxWidth: '48ch',
              }}
            >
              Ask at the bar for current pricing and what&rsquo;s in the humidor this week.
            </p>
            <Link href="/tasting-room" className="hc-btn hc-btn--accent">
              See the Cider Board
            </Link>
          </div>
        </div>
      </section>

      {/* ── The porch (set expectations honestly) ───────────────────────── */}
      <section className="hc-bone hc-section">
        <div className="hc-wrap hc-grid-2" style={{ alignItems: 'center' }}>
          <div>
            <p className="hc-eyebrow">Before You Come</p>
            <h2
              className="hc-display"
              style={{ fontSize: 'clamp(32px,4vw,56px)', lineHeight: 1.03, margin: '0 0 30px' }}
            >
              It&rsquo;s a porch, not a lounge.
            </h2>
            <p className="hc-lede" style={{ marginBottom: 22, maxWidth: '52ch' }}>
              Smoking happens outside, on the open-air porch. We don&rsquo;t have an indoor cigar
              room &mdash; the tasting room stays smoke-free for the families and kids who fill it.
            </p>
            <p className="hc-lede" style={{ marginBottom: 40, maxWidth: '52ch' }}>
              Which means a mild evening is the best evening for it. Come when the weather&rsquo;s
              good, bring a jacket in winter, and settle in.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 1,
                background: 'var(--hc-hairline-light)',
              }}
            >
              {PORCH_FACTS.map(([label, value], i) => (
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
          <Photo
            src={PORCH_IMG}
            alt="The porch at dusk"
            height={620}
            sizes="(max-width: 900px) 100vw, 50vw"
            className="hc-img--md"
          />
        </div>
      </section>

      {/* ── Cigar nights ────────────────────────────────────────────────── */}
      <section className="hc-deep hc-section">
        <div className="hc-wrap hc-grid-2">
          <div>
            <p className="hc-eyebrow" style={{ marginBottom: 28 }}>
              Cigar Nights
            </p>
            <h2
              className="hc-display"
              style={{
                fontSize: 'clamp(32px,3.8vw,54px)',
                lineHeight: 1.04,
                margin: '0 0 28px',
                maxWidth: '20ch',
              }}
            >
              Evenings on the porch.
            </h2>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.75,
                color: 'rgba(245,238,227,0.66)',
                fontWeight: 300,
                margin: '0 0 34px',
                maxWidth: '46ch',
              }}
            >
              We put on cigar nights out back &mdash; a stick, a pairing, and a few hours of good
              company under the string lights. Dates go out to the mailing list and get posted on
              Instagram first, so that&rsquo;s the place to catch them.
            </p>
            <div className="flex flex-wrap" style={{ gap: 14 }}>
              <a
                href={SITE.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="hc-btn hc-btn--accent"
              >
                Follow for Dates
              </a>
              <Link href="/club" className="hc-btn hc-btn--outline">
                Join the Club
              </Link>
            </div>
          </div>

          <div className="hc-bordered-col">
            <p className="hc-eyebrow" style={{ marginBottom: 32 }}>
              Porch Hours
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
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: 'rgba(245,238,227,0.5)',
                fontWeight: 300,
                margin: '26px 0 0',
              }}
            >
              Same hours as the tasting room. Cigar sales and smoking are 21 and up &mdash; please
              bring ID.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
