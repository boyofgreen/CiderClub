import { SITE, HOURS } from '@/lib/siteInfo'

/** Canonical origin for the public site. Used for canonical URLs, OG tags, sitemap. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.hillcountryciderhouse.com'
).replace(/\/$/, '')

// ─── Opening hours → schema.org format ────────────────────────────────────────
// HOURS is authored for humans ("Wednesday", "4PM – 8PM"); search engines need
// day URIs and 24-hour times, so translate rather than maintaining two lists.

const DAY_URI: Record<string, string[]> = {
  'Sunday – Tuesday': ['Sunday', 'Monday', 'Tuesday'],
  Wednesday: ['Wednesday'],
  Thursday: ['Thursday'],
  Friday: ['Friday'],
  Saturday: ['Saturday'],
}

/** "4PM" → "16:00", "2PM" → "14:00", "11AM" → "11:00" */
function to24h(t: string): string | null {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i.exec(t.trim())
  if (!m) return null
  let h = parseInt(m[1], 10)
  const min = m[2] ?? '00'
  const mer = m[3].toUpperCase()
  if (mer === 'PM' && h !== 12) h += 12
  if (mer === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${min}`
}

function openingHoursSpecification() {
  const spec: Array<Record<string, unknown>> = []
  for (const { days, hours } of HOURS) {
    const dayOfWeek = DAY_URI[days]
    if (!dayOfWeek) continue
    if (hours === 'Closed') {
      spec.push({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek,
        opens: '00:00',
        closes: '00:00',
      })
      continue
    }
    const [open, close] = hours.split('–').map((s) => s.trim())
    const opens = to24h(open)
    const closes = to24h(close)
    if (opens && closes) {
      spec.push({ '@type': 'OpeningHoursSpecification', dayOfWeek, opens, closes })
    }
  }
  return spec
}

const SAME_AS = [SITE.instagram, SITE.facebook, SITE.shop]

/**
 * Winery is schema.org's closest published type for a cidery tasting room — it
 * is a FoodEstablishment subtype, which is what earns the hours/price/rating
 * treatment in local results. `additionalType` keeps the cidery meaning explicit.
 */
export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Winery',
    '@id': `${SITE_URL}/#tasting-room`,
    additionalType: 'https://en.wikipedia.org/wiki/Cider_house',
    name: SITE.name,
    description:
      'Small batch hard cider made in Texas. Tasting room in Castroville on HWY 90, twenty minutes from San Antonio — six ciders on tap, twenty-plus in bottle, family friendly.',
    url: SITE_URL,
    telephone: SITE.phoneHref.replace('tel:', ''),
    email: SITE.email,
    priceRange: '$$',
    servesCuisine: 'Hard cider',
    image: [`${SITE_URL}/photos/hero-black-bart.webp`, `${SITE_URL}/brand/storefront.jpg`],
    logo: `${SITE_URL}/brand/logo.png`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '405 HWY 90 West',
      addressLocality: 'Castroville',
      addressRegion: 'TX',
      postalCode: '78009',
      addressCountry: 'US',
    },
    hasMap: SITE.addressMapUrl,
    openingHoursSpecification: openingHoursSpecification(),
    sameAs: SAME_AS,
    areaServed: [
      { '@type': 'City', name: 'San Antonio' },
      { '@type': 'City', name: 'Castroville' },
      { '@type': 'City', name: 'Hondo' },
      { '@type': 'City', name: 'Boerne' },
      { '@type': 'City', name: 'Comfort' },
    ],
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'Family friendly', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Free tastings', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Non-alcoholic option', value: true },
    ],
  }
}

/** The Comfort venue is a separate physical place with its own address. */
export function comfortVenueSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Winery',
    '@id': `${SITE_URL}/saturdays-in-comfort#venue`,
    name: 'Holiday Orchard at Hill Country Cider House',
    description:
      'Private cider tastings on twenty acres in Comfort, Texas. One group at a time, ninety minutes, five to seven ciders.',
    url: `${SITE_URL}/saturdays-in-comfort`,
    telephone: SITE.phoneHref.replace('tel:', ''),
    email: SITE.email,
    priceRange: '$$$',
    parentOrganization: { '@type': 'Organization', name: SITE.name, url: SITE_URL },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '130 Holiday Road',
      addressLocality: 'Comfort',
      addressRegion: 'TX',
      postalCode: '78013',
      addressCountry: 'US',
    },
    hasMap: SITE.comfortMapUrl,
    sameAs: SAME_AS,
  }
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE.name,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo.png`,
    email: SITE.email,
    telephone: SITE.phoneHref.replace('tel:', ''),
    foundingDate: '2020',
    sameAs: SAME_AS,
  }
}

/** Marks up a Q&A list so it can win an expandable FAQ result. */
export function faqSchema(items: Array<[string, string]>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }
}

/** Renders JSON-LD. Content is our own constants, never user input. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
