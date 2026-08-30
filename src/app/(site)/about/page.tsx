import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { ContactSection } from '@/components/site/ContactSection'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Hill Country Cider House is more than a cidery — a gathering place for curious palates in Comfort and Castroville, Texas.',
}

const PLACES = [
  {
    href: '/tasting-room',
    src: '/brand/storefront.jpg',
    alt: 'The tasting room on HWY 90 in Castroville',
    place: 'Castroville, Texas',
    title: 'The Tasting Room',
    body: 'Our everyday home on HWY 90, minutes from San Antonio. Six on tap, twenty-plus in bottle, a howdy with every visit.',
    cta: 'Plan a visit →',
    objectPosition: undefined as string | undefined,
  },
  {
    href: '/saturdays-in-comfort',
    src: '/site/comfort-hills.webp',
    alt: 'Twenty acres of rolling views at Holiday Orchard',
    place: 'Comfort, Texas',
    title: 'Holiday Orchard',
    body: 'Twenty acres of rolling views, reserved one group at a time for private Saturday tastings and events.',
    cta: 'Book a tasting →',
    objectPosition: '50% 22%',
  },
]

export default function AboutPage() {
  return (
    <>
      <section className="hc-dark hc-section--top">
        <div className="hc-wrap">
          <p className="hc-eyebrow" style={{ marginBottom: 28 }}>
            Our Story
          </p>
          <h1
            className="hc-display"
            style={{
              fontSize: 'clamp(38px,6.4vw,100px)',
              lineHeight: 0.96,
              letterSpacing: '-0.042em',
              maxWidth: '20ch',
            }}
          >
            More than a cidery.
          </h1>
        </div>
      </section>

      <section
        style={{ position: 'relative', height: '70vh', minHeight: 460, overflow: 'hidden' }}
      >
        <Image
          src="/site/about-bottles.webp"
          alt="Cider bottles with swing-top caps on a dark wooden shelf"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
      </section>

      {/* ── Story ───────────────────────────────────────────────────────── */}
      <section className="hc-bone hc-section">
        <div className="hc-wrap hc-story">
          <h2
            className="hc-display"
            style={{ fontSize: 'clamp(30px,3.4vw,46px)', lineHeight: 1.06 }}
          >
            Come for the cider, stay for the stories.
          </h2>
          <div>
            <p className="hc-story__p">
              Whether it&rsquo;s a special event at our place in the rolling hills of Comfort or an
              everyday visit to our tasting room in historic Castroville, Hill Country Cider House
              is a gathering place for curious palates, passionate drinkers, and anyone who believes
              apples deserve a little more spotlight.
            </p>
            <p className="hc-story__p">
              We&rsquo;re a family of craftsmen with a deep love for cider making and a flair for
              storytelling. Every batch blends technical precision with creative spirit — a
              barrel-aged dry one week, a fruit-infused cider bursting with flavor the next.
            </p>
            <p className="hc-story__p" style={{ marginBottom: 0 }}>
              We host seasonal releases, themed events, and club gatherings that turn neighbors into
              friends and tastings into celebrations. From rodeo parties to orchard cocktail nights,
              we believe cider should be shared, savored, and occasionally frozen into a ciderita.
            </p>
          </div>
        </div>
      </section>

      {/* ── Two places ──────────────────────────────────────────────────── */}
      <section className="hc-deep">
        <div className="hc-tiles hc-tiles--2">
          {PLACES.map((p) => (
            <div
              key={p.href}
              className="hc-place"
              style={{
                position: 'relative',
                minHeight: 560,
                display: 'flex',
                alignItems: 'flex-end',
                overflow: 'hidden',
              }}
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                style={{ objectFit: 'cover', objectPosition: p.objectPosition }}
              />
              <div
                className="hc-hero__scrim"
                style={{
                  background:
                    'linear-gradient(180deg,rgba(20,16,12,0.2) 30%,rgba(20,16,12,0.94) 100%)',
                }}
              />
              <div style={{ position: 'relative', padding: '56px 48px' }}>
                <p
                  className="hc-eyebrow"
                  style={{ letterSpacing: '0.24em', fontSize: 11, marginBottom: 16 }}
                >
                  {p.place}
                </p>
                <h3
                  className="hc-display"
                  style={{ fontSize: 34, letterSpacing: '-0.035em', margin: '0 0 14px' }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    fontSize: 17,
                    lineHeight: 1.7,
                    color: 'rgba(245,238,227,0.76)',
                    fontWeight: 300,
                    margin: '0 0 24px',
                    maxWidth: '40ch',
                  }}
                >
                  {p.body}
                </p>
                <Link href={p.href} className="hc-arrow">
                  {p.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ContactSection id="contact" />
    </>
  )
}
