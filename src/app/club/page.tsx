import Link from 'next/link'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { SiteNav } from '@/components/site/SiteNav'
import { SiteFooter } from '@/components/site/SiteFooter'
import { Hero } from '@/components/site/Hero'
import { Photo } from '@/components/site/Photo'

export const metadata = {
  // Absolute: this page sits outside the (site) group, so the root layout's
  // "%s | Cider Club" template would otherwise render "Cider Club | Cider Club".
  title: { absolute: 'Cider Club — Hill Country Cider House' },
  description:
    "Four times a year we set aside a small batch of our best ciders for the people who make this place feel like home. Three tiers, member pricing, and open-bar pickup parties.",
}

// Tier copy is final per the design handoff; the DB supplies only the plan id
// the Saddle Up link needs.
const TIER_COPY = [
  {
    level: 'Level I',
    name: 'The Pickers',
    bottles: 3,
    blurb: 'A fine place to start — three of our best, hand-picked.',
    perks: [
      '10% off club purchase bottles',
      '5% off every day',
      'One free pour each visit',
      'Open-bar pickup party',
    ],
  },
  {
    level: 'Level II',
    name: 'The Pressers',
    bottles: 6,
    featured: true,
    blurb: 'Our most-loved tier — six bottles, open bar, and a front-row seat.',
    perks: [
      '15% off club purchase bottles',
      '5% off every day',
      'Free pour for you + a guest',
      'Open-bar pickup party',
      'Early access to new releases',
    ],
  },
  {
    level: 'Level III',
    name: 'Cellar Crew',
    bottles: 9,
    blurb: 'For the devoted — nine bottles and first pick of every batch.',
    perks: [
      '20% off club purchase bottles',
      '10% off every day',
      'Free pour for you + a guest',
      'First access to limited releases',
      'Free barrel-room reservation',
    ],
  },
]

const STEPS: Array<[string, string, string]> = [
  ['I.', 'Saddle Up', 'Pick your tier, tell us a bit about yourself, drop a card on file. Two minutes.'],
  ['II.', 'We Holler', 'When the new quarter opens, you get an email with a personal link to your order.'],
  ['III.', 'Pick Your Bottles', 'Swap in your favorites, or keep our picks. Your call, always.'],
  ['IV.', 'Come On Down', "Pick up at the quarterly party or whenever you're ready. We charge the card on file."],
]

const LINEUP_FALLBACK = [
  { name: 'Endless Melon', img: '/photos/bottle-pinkerton.webp' },
  { name: '2022 Vintage Unto Us', img: '/photos/bottle-blueberry.webp' },
  { name: 'Gala', img: '/brand/manzana.jpg' },
  { name: 'Cherry Bloom', img: '/brand/cherry.jpg' },
]

const IMG_KEYWORDS: Array<[string, string]> = [
  ['pinkerton', '/photos/bottle-pinkerton.webp'],
  ['blueberry', '/photos/bottle-blueberry.webp'],
  ['peach', '/photos/bottle-peach.webp'],
  ['grenadine', '/photos/bottle-grenadine.webp'],
  ['manzana', '/brand/manzana.jpg'],
  ['marvelous', '/brand/manzana.jpg'],
  ['cherry', '/brand/cherry.jpg'],
  ['pineapple', '/brand/pineapple.jpg'],
  ['lemon', '/brand/lemongrass.jpg'],
  ['lush', '/brand/lemongrass.jpg'],
]

const FALLBACK_IMGS = LINEUP_FALLBACK.map((b) => b.img)

async function getPageData() {
  try {
    const [plans, products, memberCount] = await Promise.all([
      prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.product.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 4 }),
      prisma.member.count({ where: { status: 'ACTIVE' } }),
    ])
    return { plans, products, memberCount }
  } catch {
    return { plans: [], products: [], memberCount: 0 }
  }
}

/**
 * Where the wordmark should link. On the club.* subdomain "/" is rewritten back
 * to this page, so send visitors to the main site instead of a dead click.
 */
function mainSiteHref(host: string | null): string {
  const h = (host ?? '').toLowerCase().split(':')[0]
  if (!h.startsWith('club.')) return '/'
  const root = h.slice('club.'.length)
  return root.includes('.') ? `https://www.${root}` : '/'
}

export default async function ClubPage() {
  const { plans, products, memberCount } = await getPageData()
  const homeHref = mainSiteHref(headers().get('host'))

  const lineup =
    products.length > 0
      ? products.map((p, i) => {
          const lower = p.name.toLowerCase()
          return {
            name: p.name,
            img: IMG_KEYWORDS.find(([k]) => lower.includes(k))?.[1] ?? FALLBACK_IMGS[i % 4],
          }
        })
      : LINEUP_FALLBACK

  const stats: Array<[string, string]> = [
    [memberCount > 0 ? String(memberCount) : '64', 'Members'],
    ['26', 'Ciders & counting'],
    ['4×', 'Pickup parties / yr'],
    ['20%', 'Off bottles, up to'],
  ]

  return (
    <div className="hc-theme flex min-h-screen flex-col">
      <SiteNav homeHref={homeHref} />

      <main className="flex-1">
        <Hero
          src="/brand/party.jpg"
          alt="A club pickup party at the cider house"
          vh={92}
          minHeight={560}
          objectPosition="50% 28%"
          scrimV="linear-gradient(180deg,rgba(20,16,12,0.6) 0%,rgba(20,16,12,0.38) 32%,rgba(20,16,12,0.86) 72%,rgba(20,16,12,0.97) 100%)"
          scrimH="linear-gradient(90deg,rgba(20,16,12,0.78) 0%,rgba(20,16,12,0.3) 56%,rgba(20,16,12,0) 100%)"
        >
          <p className="hc-eyebrow">A Quarterly Cider Club</p>
          <h1
            className="hc-display hc-h1--xl"
            style={{
              fontSize: 'clamp(44px,7.6vw,124px)',
              lineHeight: 0.93,
              letterSpacing: '-0.045em',
              maxWidth: '14ch',
            }}
          >
            Pull up a chair. You&rsquo;re family now.
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
            Four times a year we set aside a small batch of our best ciders for the people who make
            this place feel like home. Pick the bottles you love. Bring a friend. We&rsquo;ll keep
            the porch light on.
          </p>
          <Link href="/register" className="hc-btn hc-btn--accent">
            Join the Club
          </Link>
        </Hero>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <section className="hc-bone" style={{ padding: '90px 0' }}>
          <div className="hc-wrap">
            <div
              className="hc-grid-4"
              style={{ gap: 1, background: 'var(--hc-hairline-light)' }}
            >
              {stats.map(([value, label], i) => (
                <div
                  key={label}
                  style={{
                    background: 'var(--hc-bone)',
                    padding: i === 0 ? '8px 24px 8px 0' : '8px 24px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-display), sans-serif',
                      fontSize: 52,
                      lineHeight: 1,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {value}
                  </div>
                  <div className="hc-label" style={{ marginTop: 10 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="hc-dark hc-section">
          <div className="hc-wrap">
            <p className="hc-eyebrow" style={{ marginBottom: 24 }}>
              How It Works
            </p>
            <h2
              className="hc-display"
              style={{ fontSize: 'clamp(34px,4.2vw,62px)', margin: '0 0 64px' }}
            >
              Four seasons, four good reasons.
            </h2>
            <div className="hc-grid-4" style={{ gap: 1, background: 'var(--hc-hairline)' }}>
              {STEPS.map(([numeral, title, body], i) => (
                <div
                  key={numeral}
                  style={{
                    background: 'var(--hc-ink)',
                    padding: i === 0 ? '36px 28px 36px 0' : '36px 28px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--hc-accent)',
                      letterSpacing: '0.2em',
                      fontWeight: 600,
                      marginBottom: 24,
                    }}
                  >
                    {numeral}
                  </div>
                  <h3
                    className="hc-display"
                    style={{ fontSize: 24, letterSpacing: '-0.03em', margin: '0 0 12px' }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.7,
                      color: 'rgba(245,238,227,0.6)',
                      fontWeight: 300,
                      margin: 0,
                    }}
                  >
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Tiers ─────────────────────────────────────────────────────── */}
        <section className="hc-deep hc-section">
          <div className="hc-wrap">
            <div className="hc-section-head" style={{ marginBottom: 56 }}>
              <div>
                <p className="hc-eyebrow" style={{ marginBottom: 24 }}>
                  Three Tiers
                </p>
                <h2 className="hc-display" style={{ fontSize: 'clamp(34px,4.2vw,62px)' }}>
                  Choose your seat at the table.
                </h2>
              </div>
              <p
                style={{
                  fontSize: 16.5,
                  lineHeight: 1.7,
                  color: 'rgba(245,238,227,0.6)',
                  maxWidth: '32ch',
                  fontWeight: 300,
                  margin: 0,
                }}
              >
                Billed quarterly when you pick up. Pause whenever. Cancel any time, no hard feelings.
              </p>
            </div>

            <div className="hc-grid-3" style={{ gap: 24 }}>
              {TIER_COPY.map((tier, i) => {
                const plan = plans[i] ?? null
                const featured = !!tier.featured
                return (
                  <div
                    key={tier.level}
                    style={{
                      border: `1px solid ${featured ? 'var(--hc-accent)' : 'rgba(245,238,227,0.18)'}`,
                      background: featured ? 'rgba(185,162,106,0.06)' : undefined,
                      padding: '44px 36px',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                    }}
                  >
                    {featured && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -1,
                          right: -1,
                          background: 'var(--hc-accent)',
                          color: 'var(--hc-on-accent)',
                          fontSize: 10.5,
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          padding: '9px 16px',
                        }}
                      >
                        Most Picked
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: 11,
                        letterSpacing: '0.22em',
                        textTransform: 'uppercase',
                        color: 'rgba(245,238,227,0.5)',
                        marginBottom: 18,
                      }}
                    >
                      {tier.level}
                    </div>
                    <h3
                      className="hc-display"
                      style={{ fontSize: 32, letterSpacing: '-0.035em', margin: '0 0 8px' }}
                    >
                      {tier.name}
                    </h3>
                    <div
                      style={{
                        fontSize: 12.5,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: 'var(--hc-accent)',
                        fontWeight: 600,
                        marginBottom: 28,
                      }}
                    >
                      {tier.bottles} bottles · every quarter
                    </div>
                    <p
                      style={{
                        fontSize: 17,
                        lineHeight: 1.7,
                        color: 'rgba(245,238,227,0.7)',
                        fontWeight: 300,
                        margin: '0 0 28px',
                      }}
                    >
                      {tier.blurb}
                    </p>

                    <div className="hc-rows" style={{ marginBottom: 32 }}>
                      {tier.perks.map((perk) => (
                        <div
                          key={perk}
                          style={{
                            padding: '14px 0',
                            fontSize: 16,
                            color: 'rgba(245,238,227,0.82)',
                          }}
                        >
                          {perk}
                        </div>
                      ))}
                    </div>

                    <Link
                      href={plan ? `/register?plan=${plan.id}` : '/register'}
                      className={`hc-btn ${featured ? 'hc-btn--accent' : 'hc-btn--outline'}`}
                      style={{ marginTop: 'auto', padding: '17px 28px' }}
                    >
                      Saddle Up
                    </Link>
                  </div>
                )
              })}
            </div>

            <p
              style={{
                fontSize: 16,
                color: 'rgba(245,238,227,0.55)',
                fontWeight: 300,
                margin: '36px 0 0',
              }}
            >
              Already a member?{' '}
              <Link href="/magic/request" style={{ color: 'var(--hc-accent)', fontWeight: 500 }}>
                Get your access link →
              </Link>
            </p>
          </div>
        </section>

        {/* ── Lineup ────────────────────────────────────────────────────── */}
        <section id="lineup" className="hc-dark hc-section">
          <div className="hc-wrap">
            <p className="hc-eyebrow" style={{ marginBottom: 24 }}>
              This Quarter&rsquo;s Pour
            </p>
            <h2
              className="hc-display"
              style={{ fontSize: 'clamp(34px,4.2vw,62px)', margin: '0 0 20px' }}
            >
              Spring &rsquo;26 lineup.
            </h2>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.7,
                color: 'rgba(245,238,227,0.6)',
                fontWeight: 300,
                margin: '0 0 52px',
                maxWidth: '56ch',
              }}
            >
              Members can mix any combination from the lineup — defaults are set, but the choice is
              always yours.
            </p>
            <div className="hc-grid-4" style={{ gap: 24 }}>
              {lineup.map((bottle) => (
                <div key={bottle.name}>
                  <Photo
                    src={bottle.img}
                    alt={`${bottle.name} cider`}
                    height={400}
                    sizes="(max-width: 900px) 50vw, 25vw"
                    className="hc-img--md"
                  />
                  <div
                    style={{
                      fontFamily: 'var(--font-display), sans-serif',
                      fontSize: 23,
                      letterSpacing: '-0.03em',
                      margin: '20px 0 0',
                    }}
                  >
                    {bottle.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Founder ───────────────────────────────────────────────────── */}
        <section className="hc-bone hc-section">
          <div className="hc-wrap hc-wrap--tight" style={{ textAlign: 'center' }}>
            <p
              className="hc-display"
              style={{
                fontWeight: 500,
                fontSize: 'clamp(26px,3.2vw,42px)',
                lineHeight: 1.22,
                letterSpacing: '-0.035em',
                margin: '0 0 32px',
              }}
            >
              &ldquo;We started with a folding table and one cider. Five years on, this club is how
              we say thank you to the folks who make our cider part of their lives.&rdquo;
            </p>
            <div
              style={{
                fontSize: 12,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--hc-light-muted)',
                fontWeight: 600,
              }}
            >
              JB · Founder
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
