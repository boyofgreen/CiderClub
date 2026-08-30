import type { Metadata } from 'next'
import { SiteNav } from '@/components/site/SiteNav'
import { SiteFooter } from '@/components/site/SiteFooter'

export const metadata: Metadata = {
  title: {
    template: '%s | Hill Country Cider House',
    // Absolute: the root layout's own "%s | Cider Club" template would otherwise
    // append to this already-complete title on the homepage.
    absolute: 'Hill Country Cider House — Craft Hard Cider in Castroville, TX',
  },
  description:
    'Small batch, quality hard cider just a stones throw from San Antonio in Castroville, TX. Tasting room, cider club, private tastings in Comfort, and Texas-grown apples.',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="hc-theme flex min-h-screen flex-col">
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
