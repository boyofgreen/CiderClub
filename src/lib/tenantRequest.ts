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
const cache = new Map<string, { org: { id: string; slug: string } | null; expires: number }>()

export function clearTenantLookupCache(): void {
  cache.clear()
}

async function lookupOrg(
  kind: 'slug' | 'domain',
  value: string
): Promise<{ id: string; slug: string } | null> {
  const key = `${kind}:${value}`
  const hit = cache.get(key)
  if (hit && hit.expires > Date.now()) return hit.org

  const org =
    kind === 'slug'
      ? await prisma.organization.findUnique({ where: { slug: value }, select: { id: true, slug: true } })
      : await prisma.organization.findUnique({ where: { customDomain: value }, select: { id: true, slug: true } })

  cache.set(key, { org: org ?? null, expires: Date.now() + TTL_MS })
  return org ?? null
}

function readTenantHeaders(): { slug: string | null; domain: string | null } | null {
  try {
    const h = headers()
    return { slug: h.get(ORG_SLUG_HEADER), domain: h.get(ORG_DOMAIN_HEADER) }
  } catch {
    // Not in a request scope
    return null
  }
}

async function resolveRequestOrg(): Promise<{ id: string; slug: string } | null> {
  const t = readTenantHeaders()
  if (!t) return null
  if (t.slug) return lookupOrg('slug', t.slug)
  if (t.domain) return lookupOrg('domain', t.domain)
  return null
}

export async function resolveRequestOrgId(): Promise<string | null> {
  return (await resolveRequestOrg())?.id ?? null
}

/**
 * Slug of the request's tenant org, or null on platform hosts / outside a
 * request scope. Used by auth to compute the user's role for THIS tenant.
 */
export async function resolveRequestOrgSlug(): Promise<string | null> {
  return (await resolveRequestOrg())?.slug ?? null
}

/** True when the request targets a tenant host (subdomain or custom domain). */
export function isTenantRequest(): boolean {
  const t = readTenantHeaders()
  return Boolean(t && (t.slug || t.domain))
}

// Side effect on import (from src/lib/prisma.ts): wire into the tenancy layer.
registerRequestOrgResolver(resolveRequestOrgId)
