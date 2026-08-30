import type { Metadata } from 'next'
import { SiteNav } from '@/components/site/SiteNav'
import { SiteFooter } from '@/components/site/SiteFooter'
import { JsonLd, SITE_URL, localBusinessSchema, organizationSchema } from '@/lib/seo'

const DESCRIPTION =
  'Small batch hard cider twenty minutes from San Antonio in Castroville, TX. Tasting room with six ciders on tap, private tastings in Comfort, and a quarterly cider club.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s | Hill Country Cider House',
    // Absolute: the root layout's own "%s | Cider Club" template would otherwise
    // append to this already-complete title on the homepage.
    absolute: 'Hill Country Cider House — Hard Cider Near San Antonio, TX',
  },
  description: DESCRIPTION,
  applicationName: 'Hill Country Cider House',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Hill Country Cider House',
    locale: 'en_US',
    url: SITE_URL,
    title: 'Hill Country Cider House — Hard Cider Near San Antonio, TX',
    description: DESCRIPTION,
    images: [
      {
        url: '/photos/hero-black-bart.webp',
        width: 1200,
        height: 630,
        alt: 'Hill Country Cider House hard cider',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hill Country Cider House — Hard Cider Near San Antonio, TX',
    description: DESCRIPTION,
    images: ['/photos/hero-black-bart.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  other: {
    // Legacy geo hints — cheap, and Bing still reads them.
    'geo.region': 'US-TX',
    'geo.placename': 'Castroville, Texas',
  },
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="hc-theme flex min-h-screen flex-col">
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={organizationSchema()} />
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
