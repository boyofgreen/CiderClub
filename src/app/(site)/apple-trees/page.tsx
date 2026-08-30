import type { Metadata } from 'next'
import { Hero } from '@/components/site/Hero'
import { Photo } from '@/components/site/Photo'
import { SITE } from '@/lib/siteInfo'
import { JsonLd, faqSchema } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Apple Trees',
  description:
    'Have apple trees on your property? We pick them for free and turn them into Texas cider — you get a bottle for every three bushels.',
  alternates: { canonical: '/apple-trees' },
}

const TREES_MAILTO = `mailto:${SITE.email}?subject=${encodeURIComponent('Apple trees')}`

const STATS: Array<[string, string]> = [
  ['Free', 'We pick'],
  ['3 : 1', 'Bushels per bottle'],
  ['Bonded', 'Fully insured'],
]

const FAQ: Array<[string, string]> = [
  ['Who picks the apples?', 'We come to your property at a convenient time and pick them for you.'],
  ['How long does it take?', 'A few hours per tree.'],
  ['Do you bring your own equipment?', 'Yes — everything we need comes with us.'],
  [
    'Are you insured while on my property?',
    "Yes. We're bonded for all our cidery work, so there's no risk to you even in the unlikely event of an accident.",
  ],
  [
    'What do I get in exchange for my apples?',
    'Cider. A bottle of ours for every three bushels of apples. Everybody wins.',
  ],
  [
    'Can I harvest the apples I want first?',
    "Absolutely. We don't need pretty apples for cider — pick what you want and we'll take the rest.",
  ],
  [
    'What kind of trees are you looking for?',
    'Any kind. You don’t need to know the variety — wild apples work as well as named ones, and the “spitters” are often the best for cider. We use crab apples more than full-sized apples.',
  ],
  [
    'When do you pick?',
    'Texas apple season runs as early as May and as late as October. Give us a call when the first apple drops from the tree.',
  ],
  [
    'Can you use apples that have fallen?',
    'Federal regulation says no fruit off the ground, so we try to get to the tree before too many fall.',
  ],
  [
    'Do you prune or care for the trees?',
    "When we can, we identify trees in the spring and sometimes prune to maximize growth — never without the owner's express permission, and never in a way that changes how the tree looks.",
  ],
]

export default function AppleTreesPage() {
  return (
    <>
      <JsonLd data={faqSchema(FAQ)} />
      <Hero
        src="/site/apple-tree-home.webp"
        alt="A Texas home with an apple tree bearing ripe red apples"
        vh={76}
        minHeight={460}
        scrimV="linear-gradient(180deg,rgba(20,16,12,0.5) 0%,rgba(20,16,12,0.28) 32%,rgba(20,16,12,0.82) 74%,rgba(20,16,12,0.96) 100%)"
        scrimH="linear-gradient(90deg,rgba(20,16,12,0.6) 0%,rgba(20,16,12,0.15) 60%,rgba(20,16,12,0) 100%)"
      >
        <p className="hc-eyebrow">Where It All Starts</p>
        <h1
          className="hc-display"
          style={{
            fontSize: 'clamp(38px,6.6vw,104px)',
            lineHeight: 0.95,
            letterSpacing: '-0.042em',
            maxWidth: '16ch',
          }}
        >
          Got apple trees?
        </h1>
        <p
          style={{
            fontSize: 19,
            lineHeight: 1.65,
            color: 'rgba(245,238,227,0.8)',
            maxWidth: '50ch',
            margin: '28px 0 38px',
            fontWeight: 300,
          }}
        >
          We pick them for free and turn them into Texas cider. You get a bottle for every three
          bushels.
        </p>
        <a href={TREES_MAILTO} className="hc-btn hc-btn--accent">
          Email Us About Your Trees
        </a>
      </Hero>

      {/* ── Texas apples ────────────────────────────────────────────────── */}
      <section className="hc-bone">
        <div className="hc-split">
          <div className="hc-split__text">
            <h2
              className="hc-display"
              style={{
                fontSize: 'clamp(34px,4.2vw,58px)',
                lineHeight: 1.04,
                margin: '0 0 30px',
                maxWidth: '22ch',
              }}
            >
              Texas apples make Texas cider.
            </h2>
            <p className="hc-lede" style={{ marginBottom: 22, maxWidth: '54ch' }}>
              Plenty of folks have a tree or two producing more fruit than they can use — or a
              &ldquo;wild&rdquo; apple tree growing somewhere on the property. We can turn those
              apples into something worth pouring.
            </p>
            <p
              style={{
                fontSize: 22,
                lineHeight: 1.6,
                color: 'var(--hc-light-ink)',
                fontWeight: 400,
                margin: '0 0 40px',
                maxWidth: '44ch',
              }}
            >
              Yellow, red, or green. Sweet, bitter, or crabby. We can use them all.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 1,
                background: 'var(--hc-hairline-light)',
                maxWidth: 620,
              }}
            >
              {STATS.map(([value, label], i) => (
                <div
                  key={label}
                  style={{
                    background: 'var(--hc-bone)',
                    padding: i === 0 ? '24px 20px 24px 0' : '24px 20px',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-display), sans-serif',
                      fontSize: 38,
                      lineHeight: 1,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    {value}
                  </div>
                  <div
                    className="hc-label"
                    style={{ marginTop: 8, letterSpacing: '0.18em', fontSize: 11 }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Photo
            src="/photos/apples-pressing.webp"
            alt="Texas apples washed and ready for pressing"
            minHeight={760}
            sizes="(max-width: 900px) 100vw, 50vw"
            className="hc-img--fill"
          />
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="hc-dark hc-section">
        <div className="hc-wrap hc-wrap--narrow">
          <p className="hc-eyebrow" style={{ marginBottom: 24 }}>
            Questions
          </p>
          <h2
            className="hc-display"
            style={{ fontSize: 'clamp(32px,4vw,56px)', margin: '0 0 52px' }}
          >
            Apple tree FAQ.
          </h2>
          <div className="hc-rows hc-faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
          <div
            className="flex flex-wrap items-center"
            style={{ marginTop: 56, gap: 14 }}
          >
            <a href={TREES_MAILTO} className="hc-btn hc-btn--accent">
              Sign Up Your Trees
            </a>
            <span style={{ fontSize: 16, color: 'rgba(245,238,227,0.55)', fontWeight: 300 }}>
              Or call{' '}
              <a href={SITE.phoneHref} style={{ whiteSpace: 'nowrap' }}>
                {SITE.phone}
              </a>{' '}
              and we&rsquo;ll get rolling.
            </span>
          </div>
        </div>
      </section>
    </>
  )
}
