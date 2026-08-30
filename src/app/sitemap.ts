import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/** Public pages, ordered by how much we want them crawled. */
const PAGES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/tasting-room', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/saturdays-in-comfort', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/cigars', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/club', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/apple-trees', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/about', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'yearly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return PAGES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified,
    changeFrequency,
    priority,
  }))
}
