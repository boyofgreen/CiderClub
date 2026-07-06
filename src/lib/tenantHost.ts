/**
 * Pure host-header parsing for tenant resolution. Edge-safe (no Node APIs) —
 * imported by middleware. Given the request Host and the platform root
 * domain, decide whether the request targets the platform itself, a tenant
 * subdomain, or a tenant custom domain.
 */
export type TenantHostInfo =
  | { type: 'platform' }
  | { type: 'subdomain'; slug: string }
  | { type: 'custom-domain'; domain: string }

export function parseTenantHost(hostHeader: string | null | undefined, rootDomain: string): TenantHostInfo {
  if (!hostHeader) return { type: 'platform' }

  const host = hostHeader.toLowerCase().split(':')[0]
  const root = rootDomain.toLowerCase().split(':')[0]

  if (host === root || host === `www.${root}`) return { type: 'platform' }

  if (host.endsWith(`.${root}`)) {
    const slug = host.slice(0, -(root.length + 1))
    // "www.<root>" handled above; nested subdomains aren't tenant slugs
    if (!slug || slug === 'www' || slug.includes('.')) return { type: 'platform' }
    return { type: 'subdomain', slug }
  }

  return { type: 'custom-domain', domain: host }
}

/** Request headers the middleware sets for the server-side tenant resolver. */
export const ORG_SLUG_HEADER = 'x-org-slug'
export const ORG_DOMAIN_HEADER = 'x-org-domain'
