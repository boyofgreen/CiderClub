import { config } from '@/lib/config'

/** Public URL for a tenant's portal, aware of local dev. */
export function portalUrlFor(slug: string): string {
  const root = config.app.rootDomain
  if (root === 'localhost') return `http://${slug}.localhost:3000`
  return `https://${slug}.${root}`
}
