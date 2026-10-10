import type { Metadata } from 'next'
import Link from 'next/link'

// Linked from conversations in the tasting room rather than the nav.
export const metadata: Metadata = {
  title: 'Cider Making Supplies',
  description:
    'The yeast, nutrient, sanitizer and fermenter we point home cider makers to when they ask how to get started.',
  alternates: { canonical: '/cider-making' },
}

// Amazon Associates tracking ID. Every link carries it so purchases are credited to us.
const AMAZON_TAG = 'hcch05-20'
const amazonLink = (asin: string) => `https://www.amazon.com/dp/${asin}?tag=${AMAZON_TAG}`

type Supply = {
  step: string
  name: string
  image: string
  alt: string
  description: string
  url: string
}

const SUPPLIES: Supply[] = [
  {
    step: 'Yeast',
    name: 'Fermentis SafCider TF-6',
    image: '/photos/supply-safcider-tf6.webp',
    alt: 'A 5 gram packet of Fermentis SafCider TF-6 cider yeast',
    description:
      'A dry yeast made specifically for cider. It brings out bright, fruity aromatics — apple, pear, citrus — and suits sweeter, rounder ciders. One 5 g packet.',
    url: amazonLink('B0963ZNL15'),
  },
  {
    step: 'Nutrient',
    name: 'Fermax Yeast Nutrient',
    image: '/photos/supply-fermax-nutrient.webp',
    alt: 'A one pound container of Fermax yeast nutrient',
    description:
      'Apple juice is low in the nitrogen yeast needs. A pinch of this blend of proteins, amino acids and vitamins helps the fermentation start quickly and finish cleanly. 1 lb.',
    url: amazonLink('B07F8XT3ZX'),
  },
  {
    step: 'Sanitizer',
    name: 'Star San',
    image: '/photos/supply-star-san.webp',
    alt: 'A 32 ounce bottle of Star San sanitizer',
    description:
      'Everything that touches your cider needs to be sanitized. Star San is a no-rinse, foaming acid sanitizer — mix with water, coat, let it drip. Odorless and flavorless at the recommended dilution. 32 oz bottle.',
    url: amazonLink('B0064O7YFA'),
  },
  {
    step: 'Fermenter',
    name: 'North Mountain Supply 1-Gallon Jug',
    image: '/photos/supply-gallon-jug.webp',
    alt: 'A one gallon glass jug with handle, rubber stopper, airlock and screw cap',
    description:
      'A one-gallon glass jug with a drilled rubber stopper, airlock and screw cap — the right size for a first batch. Fill it with juice, add yeast, and let the airlock do its thing.',
    url: amazonLink('B09KNYXB2D'),
  },
]

export default function CiderMakingPage() {
  return (
    <>
      <section className="hc-dark hc-section--top">
        <div className="hc-wrap">
          <p className="hc-eyebrow" style={{ marginBottom: 28 }}>
            Make Your Own
          </p>
          <h1
            className="hc-display"
            style={{ fontSize: 'clamp(38px,6.4vw,100px)', lineHeight: 0.96, letterSpacing: '-0.042em', maxWidth: '16ch' }}
          >
            Cider making supplies.
          </h1>
          <p
            style={{
              fontSize: 19,
              lineHeight: 1.65,
              color: 'rgba(245,238,227,0.75)',
              maxWidth: '56ch',
              margin: '28px 0 0',
              fontWeight: 300,
            }}
          >
            People ask us all the time how to make cider at home. Here&rsquo;s what we&rsquo;d start
            with: four things, plus a gallon of good apple juice.
          </p>
          <p style={{ fontSize: 14, color: 'rgba(245,238,227,0.5)', margin: '18px 0 0' }}>
            As an Amazon Associate we earn from qualifying purchases.
          </p>
        </div>
      </section>

      <section className="hc-dark" style={{ paddingBottom: 120 }}>
        <div className="hc-wrap grid gap-8 sm:grid-cols-2">
          {SUPPLIES.map((s) => (
            <article
              key={s.url}
              className="flex flex-col border"
              style={{ borderColor: 'var(--hc-hairline)' }}
            >
              <a
                href={s.url}
                target="_blank"
                rel="sponsored noopener noreferrer"
                aria-label={`${s.name} on Amazon`}
                style={{ background: '#fff', display: 'block' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt={s.alt}
                  loading="lazy"
                  width={800}
                  height={800}
                  className="mx-auto block h-auto w-full"
                  style={{ maxWidth: 360, aspectRatio: '1 / 1', objectFit: 'contain', padding: 24 }}
                />
              </a>
              <div className="flex flex-1 flex-col" style={{ padding: 'clamp(24px,3vw,36px)' }}>
                <p className="hc-eyebrow" style={{ marginBottom: 12 }}>
                  {s.step}
                </p>
                <h2
                  className="hc-display"
                  style={{ fontSize: 'clamp(24px,2.4vw,32px)', lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 14px' }}
                >
                  {s.name}
                </h2>
                <p
                  style={{
                    fontSize: 16.5,
                    lineHeight: 1.7,
                    color: 'rgba(245,238,227,0.66)',
                    fontWeight: 300,
                    margin: '0 0 28px',
                  }}
                >
                  {s.description}
                </p>
                <div style={{ marginTop: 'auto' }}>
                  <a href={s.url} target="_blank" rel="sponsored noopener noreferrer" className="hc-btn hc-btn--accent">
                    View on Amazon
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="hc-deep hc-section">
        <div className="hc-wrap" style={{ maxWidth: 760 }}>
          <p className="hc-eyebrow" style={{ marginBottom: 20 }}>
            Questions?
          </p>
          <p style={{ fontSize: 18, lineHeight: 1.7, color: 'rgba(245,238,227,0.72)', fontWeight: 300, margin: '0 0 28px' }}>
            Come by the tasting room and ask. We&rsquo;re always happy to talk about cider making, and you can
            taste what we make while you&rsquo;re here.
          </p>
          <Link href="/tasting-room" className="hc-btn hc-btn--outline">
            Tasting Room Hours
          </Link>
        </div>
      </section>
    </>
  )
}
