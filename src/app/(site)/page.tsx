import Link from 'next/link'
import { Hero } from '@/components/site/Hero'
import { Photo } from '@/components/site/Photo'
import { SITE, HOURS } from '@/lib/siteInfo'

const CARDS = [
  {
    href: '/tasting-room',
    src: '/photos/bottle-pinkerton.webp',
    alt: 'Pinkerton cider styled with fresh fruit',
    title: 'Visit Our Tasting Room',
    body: 'The small town Texas experience, or your new local hangout. Family friendly, open Wednesday through Saturday.',
    cta: 'Plan your visit →',
  },
  {
    href: '/club',
    src: '/photos/bottle-peach.webp',
    alt: 'Peach cider bottle with fresh peaches',
    title: 'Join the Cider Club',
    body: 'Support a small Texas business, drink better cider for less, and get first pour on everything new.',
    cta: 'Become an in-sider →',
  },
  {
    href: '/saturdays-in-comfort',
    src: '/photos/bottle-grenadine.webp',
    alt: 'Grenadine cider bottle styled with fruit',
    title: 'Host an Event',
    body: 'Want our place to be your place for the night? We host in the tasting room and at Holiday Orchard in Comfort.',
    cta: 'Start planning →',
  },
]

const CLUB_PERKS = [
  ['01', 'Member pricing, every bottle', 'In the tasting room and online.'],
  ['02', 'First pour on new releases', 'Small batches go fast. You go first.'],
  ['03', 'Club-only pickup nights', 'Orchard suppers, harvest pressings, and the parties in between.'],
  ['04', 'Bring a friend, always', 'Your people drink like members too.'],
]

const STRIP: Array<[string, string]> = [
  ['/photos/supper-toast.webp', 'A toast at the supper club'],
  ['/photos/dessert-dome.webp', 'Chocolate mousse dome dessert'],
  ['/photos/supper-table-2.webp', 'Long table set under the oaks'],
  ['/site/comfort-table.webp', 'Private tasting table set in natural light at Holiday Orchard'],
]

export default function HomePage() {
  return (
    <>
      <Hero
        src="/photos/hero-black-bart.webp"
        alt="Black Bart cider bottle with blackberries and confections"
        vh={92}
        minHeight={560}
        objectPosition="62% 50%"
        paddingBottom={92}
        scrimV="linear-gradient(180deg,rgba(20,16,12,0.5) 0%,rgba(20,16,12,0.3) 34%,rgba(20,16,12,0.8) 72%,rgba(20,16,12,0.96) 100%)"
        scrimH="linear-gradient(90deg,rgba(20,16,12,0.72) 0%,rgba(20,16,12,0.28) 52%,rgba(20,16,12,0) 100%)"
      >
        <p className="hc-eyebrow">Castroville · Comfort · Texas</p>
        <h1
          className="hc-display"
          style={{
            fontSize: 'clamp(38px,7.2vw,116px)',
            lineHeight: 0.94,
            maxWidth: '16ch',
            textWrap: 'balance',
          }}
        >
          Hard cider, a stone&rsquo;s throw from San&nbsp;Antonio.
        </h1>
        <p
          style={{
            fontSize: 19,
            lineHeight: 1.65,
            color: 'rgba(245,238,227,0.78)',
            maxWidth: '52ch',
            margin: '30px 0 40px',
            fontWeight: 300,
          }}
        >
          Six on tap, twenty in bottle, and a howdy with every visit. Small batch cider poured in a
          small Texas town — right on HWY 90 in Castroville.
        </p>
        <div className="flex flex-wrap" style={{ gap: 14 }}>
          <a href="#visit" className="hc-btn hc-btn--accent">
            Visit the Tasting Room
          </a>
          <Link href="/club" className="hc-btn hc-btn--outline">
            Join the Cider Club
          </Link>
        </div>
      </Hero>

      {/* ── Welcome ─────────────────────────────────────────────────────── */}
      <section className="hc-bone">
        <div className="hc-split">
          <div className="hc-split__text">
            <p className="hc-eyebrow">Welcome, Partner</p>
            <h2
              className="hc-display"
              style={{ fontSize: 'clamp(36px,4.4vw,66px)', marginBottom: 32, maxWidth: '22ch' }}
            >
              American cider meets Texas hospitality.
            </h2>
            <p className="hc-lede" style={{ marginBottom: 22, maxWidth: '56ch' }}>
              Hard cider is an age-old American tradition, and we celebrate its roots in every glass.
              You&rsquo;ll get a &ldquo;howdy&rdquo; with every visit and a story with every pour —
              whether you&rsquo;ve been drinking cider for years or you&rsquo;re about to have your
              first.
            </p>
            <p className="hc-lede" style={{ marginBottom: 44, maxWidth: '56ch' }}>
              We&rsquo;re family friendly, we&rsquo;re minutes from San Antonio, and sips are always
              free.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,auto)',
                borderTop: '1px solid var(--hc-hairline-light)',
                maxWidth: 520,
              }}
            >
              {[
                ['6', 'On tap'],
                ['20+', 'In bottle'],
                ['2020', 'Est.'],
              ].map(([value, label], i) => (
                <div
                  key={label}
                  style={{
                    padding: i === 0 ? '26px 26px 0 0' : i === 2 ? '26px 0 0 26px' : '26px 26px 0',
                    borderLeft: i > 0 ? '1px solid var(--hc-hairline-light)' : undefined,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-display), sans-serif',
                      fontSize: 44,
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </div>
                  <div className="hc-label" style={{ marginTop: 8 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Photo
            src="/photos/apples-pressing.webp"
            alt="Texas apples washed and ready for pressing"
            minHeight={820}
            sizes="(max-width: 900px) 100vw, 50vw"
            className="hc-img--fill"
          />
        </div>
      </section>

      {/* ── Small town, big pour ────────────────────────────────────────── */}
      <section className="hc-dark">
        <div className="hc-tiles hc-tiles--2">
          <Photo
            src="/photos/parade-horses.webp"
            alt="Riders carrying flags down a small town Texas street"
            height={680}
            sizes="50vw"
            className="hc-img--md"
          />
          <Photo
            src="/photos/rodeo-night.webp"
            alt="Night at the rodeo"
            height={680}
            sizes="50vw"
            className="hc-img--md"
          />
        </div>
        <div className="hc-wrap hc-section" style={{ textAlign: 'center' }}>
          <p className="hc-eyebrow" style={{ marginBottom: 34 }}>
            Small Town, Big Pour
          </p>
          <h2
            className="hc-display"
            style={{
              fontWeight: 500,
              fontSize: 'clamp(30px,3.6vw,56px)',
              lineHeight: 1.14,
              letterSpacing: '-0.035em',
              margin: '0 auto',
              maxWidth: '32ch',
            }}
          >
            &ldquo;You can taste the place in it. The apples, the heat, the two-lane road that got
            you here.&rdquo;
          </h2>
          <p
            style={{
              fontSize: 13,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(245,238,227,0.5)',
              margin: '40px 0 0',
              fontWeight: 500,
            }}
          >
            Castroville, Texas · Pop. 2,800
          </p>
        </div>
      </section>

      {/* ── Three ways in ───────────────────────────────────────────────── */}
      <section className="hc-dark hc-section">
        <div className="hc-wrap">
          <div
            className="hc-section-head"
            style={{ paddingBottom: 44, borderBottom: '1px solid rgba(245,238,227,0.14)' }}
          >
            <div>
              <p className="hc-eyebrow" style={{ marginBottom: 24 }}>
                Three Ways In
              </p>
              <h2 className="hc-display" style={{ fontSize: 'clamp(36px,4.4vw,66px)' }}>
                Experience cider with us.
              </h2>
            </div>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.7,
                color: 'rgba(245,238,227,0.62)',
                maxWidth: '34ch',
                fontWeight: 300,
                margin: 0,
              }}
            >
              Drop in for the afternoon, take the table in Comfort, or make our place your place for
              the night.
            </p>
          </div>

          <div className="hc-grid-3" style={{ paddingTop: 56 }}>
            {CARDS.map((c) => (
              <Link key={c.href} href={c.href} className="hc-card" style={{ display: 'block' }}>
                <Photo
                  src={c.src}
                  alt={c.alt}
                  height={460}
                  sizes="(max-width: 900px) 100vw, 33vw"
                  className="hc-zoom hc-img--md"
                />
                <h3
                  className="hc-display"
                  style={{
                    fontWeight: 500,
                    fontSize: 30,
                    margin: '30px 0 14px',
                    letterSpacing: '-0.03em',
                  }}
                >
                  {c.title}
                </h3>
                <p
                  style={{
                    fontSize: 16.5,
                    lineHeight: 1.7,
                    color: 'rgba(245,238,227,0.62)',
                    fontWeight: 300,
                    margin: '0 0 20px',
                  }}
                >
                  {c.body}
                </p>
                <span className="hc-arrow">{c.cta}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Saturdays in Comfort ────────────────────────────────────────── */}
      <section
        className="hc-hero"
        style={
          {
            '--hc-hero-vh': 100,
            '--hc-hero-min': '620px',
            alignItems: 'center',
          } as React.CSSProperties
        }
      >
        <Photo
          src="/photos/supper-chef.webp"
          alt="Chef presenting a course at the orchard supper club"
          objectPosition="60% 50%"
          className="hc-hero__media"
        />
        <div
          className="hc-hero__scrim"
          style={{
            background:
              'linear-gradient(90deg,rgba(20,16,12,0.94) 0%,rgba(20,16,12,0.78) 42%,rgba(20,16,12,0.12) 100%)',
          }}
        />
        <div
          className="hc-wrap"
          style={{ position: 'relative', width: '100%', paddingTop: 120, paddingBottom: 120 }}
        >
          <div style={{ maxWidth: '44ch' }}>
            <p className="hc-eyebrow">Saturdays in Comfort</p>
            <h2
              className="hc-display"
              style={{
                fontSize: 'clamp(38px,4.8vw,74px)',
                lineHeight: 0.99,
                letterSpacing: '-0.042em',
                margin: '0 0 30px',
              }}
            >
              When you&rsquo;re here, you&rsquo;re family.
            </h2>
            <p
              style={{
                fontSize: 19,
                lineHeight: 1.75,
                color: 'rgba(245,238,227,0.8)',
                fontWeight: 300,
                margin: '0 0 22px',
              }}
            >
              Your own private slice of the Hill Country: quiet rolling views, small-batch cider
              poured just for you, and a tasting that moves at your pace.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontStyle: 'italic',
                fontSize: 24,
                lineHeight: 1.5,
                color: 'var(--hc-accent)',
                margin: '0 0 44px',
              }}
            >
              One group. One table. One unforgettable Saturday.
            </p>
            <Link href="/saturdays-in-comfort" className="hc-btn hc-btn--outline">
              Reserve a Saturday
            </Link>
          </div>
        </div>
      </section>

      {/* ── Cider club ──────────────────────────────────────────────────── */}
      <section id="club" className="hc-deep hc-section">
        <div className="hc-wrap hc-club-split">
          <div>
            <p className="hc-eyebrow">The Cider Club</p>
            <h2
              className="hc-display"
              style={{
                fontSize: 'clamp(36px,4.6vw,70px)',
                lineHeight: 1,
                letterSpacing: '-0.042em',
                margin: '0 0 30px',
                maxWidth: '20ch',
              }}
            >
              Become a cider in-sider.
            </h2>
            <p className="hc-lede" style={{ marginBottom: 48, maxWidth: '50ch' }}>
              Members keep this small orchard business running — and get the best seat in the house
              while they&rsquo;re at it.
            </p>

            <div className="hc-rows">
              {CLUB_PERKS.map(([num, title, sub]) => (
                <div
                  key={num}
                  style={{
                    padding: '24px 0',
                    display: 'grid',
                    gridTemplateColumns: '44px 1fr',
                    gap: 20,
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display), sans-serif',
                      fontSize: 15,
                      color: 'var(--hc-accent)',
                    }}
                  >
                    {num}
                  </span>
                  <div>
                    <div style={{ fontSize: 19, fontWeight: 500, marginBottom: 6 }}>{title}</div>
                    <div style={{ fontSize: 16, color: 'rgba(245,238,227,0.58)', fontWeight: 300 }}>
                      {sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center" style={{ gap: 14, marginTop: 48 }}>
              <Link href="/club" className="hc-btn hc-btn--accent">
                Join the Club
              </Link>
              <Link
                href="/login"
                style={{
                  padding: '19px 8px',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'rgba(245,238,227,0.6)',
                }}
              >
                Member sign in
              </Link>
            </div>
          </div>

          <Photo
            src="/photos/bottle-blueberry.webp"
            alt="Blueberry Buckle cider with blueberry tarts"
            height={760}
            sizes="(max-width: 900px) 100vw, 40vw"
            className="hc-img--fill"
          />
        </div>
      </section>

      {/* ── Photo strip ─────────────────────────────────────────────────── */}
      <section className="hc-tiles">
        {STRIP.map(([src, alt]) => (
          <Photo key={src} src={src} alt={alt} height={280} sizes="25vw" className="hc-img--md" />
        ))}
      </section>

      {/* ── Visit ───────────────────────────────────────────────────────── */}
      <section id="visit" className="hc-bone hc-section">
        <div className="hc-wrap hc-grid-2">
          <div>
            <p className="hc-eyebrow">Find Us</p>
            <h2
              className="hc-display"
              style={{ fontSize: 'clamp(36px,4.4vw,64px)', margin: '0 0 40px' }}
            >
              Visit our tasting room.
            </h2>
            <a
              href={SITE.addressMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: 27,
                lineHeight: 1.4,
                display: 'block',
                marginBottom: 26,
              }}
            >
              405 HWY 90 West
              <br />
              Castroville, TX 78009
            </a>
            <div
              className="flex flex-wrap"
              style={{
                gap: '12px 28px',
                fontSize: 16.5,
                color: 'var(--hc-light-body)',
                marginBottom: 44,
              }}
            >
              <a href={SITE.phoneHref} style={{ whiteSpace: 'nowrap' }}>
                {SITE.phone}
              </a>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </div>
            <a
              href={SITE.addressMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hc-btn hc-btn--dark"
            >
              Get Directions
            </a>
          </div>

          <div>
            <p className="hc-eyebrow" style={{ marginBottom: 32 }}>
              Hours of Operation
            </p>
            <div className="hc-rows">
              {HOURS.map((h) => (
                <div
                  key={h.days}
                  className="hc-hours-row"
                  style={{ color: h.hours === 'Closed' ? 'var(--hc-light-muted)' : undefined }}
                >
                  <span>{h.days}</span>
                  <span>{h.hours}</span>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 44,
                padding: 34,
                background: 'var(--hc-light-ink)',
                color: 'var(--hc-bone)',
              }}
            >
              <h3
                className="hc-display"
                style={{ fontWeight: 500, fontSize: 26, margin: '0 0 12px' }}
              >
                Can&rsquo;t make it out to us?
              </h3>
              <p
                style={{
                  fontSize: 16.5,
                  lineHeight: 1.7,
                  color: 'rgba(245,238,227,0.7)',
                  fontWeight: 300,
                  margin: '0 0 24px',
                }}
              >
                Browse bottles, merch, and gift cards in the online shop.
              </p>
              <a href={SITE.shop} target="_blank" rel="noopener noreferrer" className="hc-arrow">
                Shop Cider →
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
