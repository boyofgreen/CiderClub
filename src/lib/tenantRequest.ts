/**
 * Server-side tenant resolution from request headers.
 *
 * Middleware (src/middleware.ts) parses the Host header and forwards a
 * trusted x-org-slug / x-org-domain header. This module reads that header
 * via next/headers, resolves it to an Organization id (with a short in-memory
 * cache — this runs on every request), and registers itself as the tenancy
 * layer's request-scope resolver.
 *
 * Outside a request scope (build-time prerender, scripts, tests) headers()
 * throws; we return null and the tenancy layer falls back to the default org.
 */
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { registerRequestOrgResolver } from '@/lib/tenancy'
import { ORG_SLUG_HEADER, ORG_DOMAIN_HEADER } from '@/lib/tenantHost'

const TTL_MS = 60_000
const cache = new Map<string, { id: string | null; expires: number }>()

export function clearTenantLookupCache(): void {
  cache.clear()
}

async function lookupOrgId(kind: 'slug' | 'domain', value: string): Promise<string | null> {
  const key = `${kind}:${value}`
  const hit = cache.get(key)
  if (hit && hit.expires > Date.now()) return hit.id

  const org =
    kind === 'slug'
      ? await prisma.organization.findUnique({ where: { slug: value }, select: { id: true } })
      : await prisma.organization.findUnique({ where: { customDomain: value }, select: { id: true } })

  const id = org?.id ?? null
  cache.set(key, { id, expires: Date.now() + TTL_MS })
  return id
}

export async function resolveRequestOrgId(): Promise<string | null> {
  let slug: string | null
  let domain: string | null
  try {
    const h = headers()
    slug = h.get(ORG_SLUG_HEADER)
    domain = h.get(ORG_DOMAIN_HEADER)
  } catch {
    // Not in a request scope
    return null
  }

  if (slug) return lookupOrgId('slug', slug)
  if (domain) return lookupOrgId('domain', domain)
  return null
}

// Side effect on import (from src/lib/prisma.ts): wire into the tenancy layer.
registerRequestOrgResolver(resolveRequestOrgId)
