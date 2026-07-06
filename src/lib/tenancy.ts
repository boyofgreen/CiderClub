/**
 * Multi-tenancy core (Phase 1 of docs/SAAS-CONVERSION-PLAN.md).
 *
 * Every tenant-owned model carries organizationId. Rather than touching every
 * query in the app, the withTenancy() Prisma extension:
 *   - injects organizationId into create / createMany / upsert-create data
 *   - adds an organizationId filter to findMany / findFirst / count /
 *     aggregate / groupBy / updateMany / deleteMany
 *
 * findUnique / update / delete by primary id are left untouched: cuids don't
 * collide across tenants, and Postgres RLS will add the hard guarantee later
 * in Phase 1.
 *
 * The active organization comes from AsyncLocalStorage (set per-request by
 * tenant-resolving middleware once multi-org routing lands). Until then, every
 * query falls back to the default organization — "tenant zero", the original
 * club — so the app keeps behaving exactly as it did single-tenant.
 */
import { AsyncLocalStorage } from 'async_hooks'
import type { PrismaClient } from 'prisma-generated'

/** Prisma model names that carry organizationId. */
export const TENANT_MODELS = new Set([
  'Member',
  'MemberToken',
  'Plan',
  'Product',
  'Quarter',
  'Order',
  'PickupEvent',
  'WaitlistEntry',
  'Lead',
  'Campaign',
  'EmailLog',
  'Setting',
  'EmailTemplate',
  'PageView',
  'ClubEvent',
  'AnalyticsSnapshot',
  'OrgInvite',
])

// Defined in tenantHost.ts (edge-safe); re-exported here for server code.
import { DEFAULT_ORG_ID, DEFAULT_ORG_SLUG, DEFAULT_ORG_NAME } from '@/lib/tenantHost'
export { DEFAULT_ORG_ID, DEFAULT_ORG_SLUG, DEFAULT_ORG_NAME }

const orgContext = new AsyncLocalStorage<string>()

/**
 * Run fn with all tenant-scoped queries bound to the given organization.
 *
 * fn is awaited INSIDE the context on purpose: Prisma queries are lazy and
 * only execute when awaited, so returning an un-awaited PrismaPromise out of
 * the context would make it run under the caller's org instead.
 */
export async function runWithOrg<T>(orgId: string, fn: () => Promise<T> | T): Promise<T> {
  return orgContext.run(orgId, async () => await fn())
}

/** The organization bound to the current async context, if any. */
export function getContextOrgId(): string | undefined {
  return orgContext.getStore()
}

let cachedDefaultOrgId: string | null = null

/** Test hook: the default org row is recreated after a DB reset. */
export function clearDefaultOrgCache(): void {
  cachedDefaultOrgId = null
}

/**
 * Optional request-scope resolver (wired up by src/lib/tenantRequest.ts,
 * which maps the middleware's tenant headers to an org id). Kept as a
 * registration hook so this module never imports next/headers — it must
 * stay usable from scripts, seeds, and tests.
 */
type RequestOrgResolver = () => Promise<string | null>
let requestOrgResolver: RequestOrgResolver | null = null

export function registerRequestOrgResolver(fn: RequestOrgResolver | null): void {
  requestOrgResolver = fn
}

interface OrgUpsertClient {
  organization: {
    upsert(args: {
      where: { slug: string }
      create: { id: string; name: string; slug: string }
      update: Record<string, never>
    }): Promise<{ id: string }>
  }
}

/**
 * Resolve the organization for the current query, in priority order:
 *   1. explicit runWithOrg context
 *   2. the request's tenant (subdomain / custom domain via middleware headers)
 *   3. the default org — tenant zero (created on first use so fresh DBs work)
 */
export async function resolveOrgId(base: OrgUpsertClient): Promise<string> {
  const fromContext = orgContext.getStore()
  if (fromContext) return fromContext

  if (requestOrgResolver) {
    const fromRequest = await requestOrgResolver()
    if (fromRequest) return fromRequest
  }

  if (!cachedDefaultOrgId) {
    const org = await base.organization.upsert({
      where: { slug: DEFAULT_ORG_SLUG },
      create: { id: DEFAULT_ORG_ID, name: DEFAULT_ORG_NAME, slug: DEFAULT_ORG_SLUG },
      update: {},
    })
    cachedDefaultOrgId = org.id
  }
  return cachedDefaultOrgId
}

const WHERE_OPS = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'updateMany',
  'deleteMany',
])

/** Wrap a Prisma client so all tenant-model queries are org-scoped. */
export function withTenancy(base: PrismaClient) {
  return base.$extends({
    name: 'tenancy',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_MODELS.has(model)) return query(args)

          const orgId = await resolveOrgId(base as unknown as OrgUpsertClient)
          /* eslint-disable @typescript-eslint/no-explicit-any */
          const a: any = args ?? {}

          if (operation === 'create') {
            a.data = { organizationId: orgId, ...a.data }
          } else if (operation === 'createMany' || operation === 'createManyAndReturn') {
            if (Array.isArray(a.data)) {
              a.data = a.data.map((d: any) => ({ organizationId: orgId, ...d }))
            } else if (a.data) {
              a.data = { organizationId: orgId, ...a.data }
            }
          } else if (operation === 'upsert') {
            a.create = { organizationId: orgId, ...a.create }
          } else if (WHERE_OPS.has(operation)) {
            // Caller-provided organizationId (if any) wins via spread order.
            a.where = { organizationId: orgId, ...a.where }
          }
          /* eslint-enable @typescript-eslint/no-explicit-any */

          return query(a)
        },
      },
    },
  })
}
