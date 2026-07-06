# Postgres Row-Level Security (RLS) — Implementation Handoff

*Status: NOT STARTED — deliberately deferred until the platform's Azure environment is provisioned (decision: July 2026). This document is the complete spec for whoever picks it up. It assumes no knowledge of prior conversations.*

## Why this exists, and the hard gate

The platform is a multi-tenant SaaS (see `docs/SAAS-CONVERSION-PLAN.md`). Tenant isolation is currently enforced **only at the application layer**:

- Every tenant-owned table has an `organizationId` column (FK → `Organization.id`).
- A Prisma query extension in [`src/lib/tenancy.ts`](../src/lib/tenancy.ts) injects `organizationId` on creates and adds an `organizationId` filter to list/aggregate/bulk queries. The active org comes from AsyncLocalStorage (`runWithOrg`), then the request's tenant headers (`src/lib/tenantRequest.ts`), then falls back to tenant zero.

That extension is one bug away from a cross-tenant data leak (we already caught one during development: a lazy Prisma promise escaping its org context). RLS makes the **database** refuse cross-tenant reads/writes regardless of application bugs.

> **HARD GATE: RLS must be live before any external (non-founder) organization onboards.** Until then all real data belongs to tenant zero and the risk is theoretical.

## Current state — what you inherit

| Thing | Where | Notes |
|---|---|---|
| Tenant-owned tables | `TENANT_MODELS` set in `src/lib/tenancy.ts` | 17 models: Member, MemberToken, Plan, Product, Quarter, Order, PickupEvent, WaitlistEntry, Lead, Campaign, EmailLog, Setting, EmailTemplate, PageView, ClubEvent, AnalyticsSnapshot, OrgInvite. **Child tables (OrderItem, QuarterProduct, QuarterPlanDefault, PickupAttendance) have NO organizationId** — they're only reachable through their parents. RLS on them requires either adding the column or `EXISTS` policies through the parent (see below). |
| Platform-level tables | — | Organization, OrganizationUser, User, Account, Session, VerificationToken are cross-tenant by design. Do NOT put org-scoped RLS on them. |
| Tenant zero | id `org_tenant_zero_hcch`, slug `hill-country-cider-house` | Created by migration `20260705000000_organizations`; all pre-platform rows backfilled to it. |
| **Transitional default** | Schema: `organizationId String @default("org_tenant_zero_hcch")` on all 17 models; DB: matching `SET DEFAULT` | Exists only so Prisma create types don't require organizationId (the extension injects the real value at runtime). **Removing these defaults is part of this work** — once RLS rejects wrong-org writes, the silent-fallback-to-tenant-zero behavior becomes a data-corruption bug rather than a convenience. |
| Migrations | `prisma/migrations/*` | Plain SQL, applied by `prisma migrate deploy`. The test suite applies every migration to an in-process PGlite Postgres, so new migration SQL is exercised by `npm test`. |
| Dev-machine constraint | `docs/` + memory | The dev machine is Windows ARM64: no Docker, no local Postgres, Prisma's native engine doesn't load. Tests run via PGlite + the WASM query engine (see `vitest.config.ts`, `tests/helpers/`). PGlite runs as a superuser and **ignores RLS for the connecting role**, so local tests can only partially validate policies (see Testing below). Full validation must happen against real Azure Postgres. |

## Design

### 1. Two database roles

Prisma migrations must keep running as a privileged role, while the app must NOT be the table owner (owners bypass RLS unless forced, and `FORCE` can still be circumvented by owners via `ALTER TABLE`). Use:

- **`ciderclub_admin`** (already exists on Azure) — owner of the schema; used ONLY by `prisma migrate deploy` (env var `DIRECT_DATABASE_URL` or a deploy-time-only `DATABASE_URL`).
- **`app_runtime`** (new) — the Next.js app's role. `NOSUPERUSER NOBYPASSRLS`, member of nothing special:

```sql
CREATE ROLE app_runtime LOGIN PASSWORD '<from Key Vault>' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
```

App connection string switches to `app_runtime`. Keep `_prisma_migrations` readable by it (SELECT is enough).

### 2. Policies

For each of the 17 org-scoped tables:

```sql
ALTER TABLE "Member" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Member" FORCE ROW LEVEL SECURITY;  -- also binds the owner, belt & braces

CREATE POLICY tenant_isolation ON "Member"
  USING ("organizationId" = current_setting('app.org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.org_id', true));
```

Notes:
- `current_setting('app.org_id', true)` returns NULL when unset → comparison is NULL → **no rows visible and no writes allowed**. That is the correct fail-closed default: a code path that forgot to set the org sees an empty tenant, not someone else's data.
- The app sometimes needs deliberate cross-tenant access:
  - `OrgInvite` acceptance looks up an invite by token from any host (`src/services/orgInvites.ts` — `acceptInvite`). Options: (a) add a permissive additional policy `USING (true)` restricted to a `SECURITY DEFINER` function that looks up by exact token; or (b) simpler — before the lookup, resolve the invite's org via a platform-context query. **Recommended (c): give the platform code path a "platform context"** — see §4.
  - The **superadmin console** (`/platform/orgs`) lists all orgs with member counts. `Organization`/`OrganizationUser` aren't RLS'd, but `_count.members` touches `Member`. Same solution: platform context.
- Child tables without organizationId: either
  - **Option A (recommended):** add `organizationId` to OrderItem, QuarterProduct, QuarterPlanDefault, PickupAttendance (backfill from parent, index, same policy). Mechanical, mirrors migration `20260705000000_organizations`, keeps policies trivial and fast.
  - Option B: `EXISTS (SELECT 1 FROM "Order" o WHERE o.id = "orderId")` policies that piggyback on the parent's RLS. Fewer columns, slower plans, harder to reason about. Only pick this if write amplification worries you.

### 3. Binding the org per request/transaction — the Prisma part

`SET LOCAL` only survives inside a transaction, so every query must run in a transaction that first executes:

```sql
SELECT set_config('app.org_id', $1, true);  -- true = transaction-local
```

Implement inside the existing extension (`withTenancy` in `src/lib/tenancy.ts`), replacing the current where/data injection **for reads/writes on tenant models** with transaction wrapping:

```ts
// sketch — inside $allOperations for tenant models
const orgId = await resolveOrgId(base)
return base.$transaction(async (tx) => {
  await tx.$executeRaw`SELECT set_config('app.org_id', ${orgId}, true)`
  // re-dispatch the operation on tx — see below
  return (tx as any)[modelJsName][operation](args)
})
```

Practical notes learned from this codebase:
- **Keep the existing app-layer injection too.** RLS is the backstop, not a replacement: the `WITH CHECK` needs the correct `organizationId` present on INSERT anyway (after the transitional default is dropped, inserts without it fail NOT NULL first). Defense in depth, and query plans get the benefit of the explicit filter.
- Interactive transactions have overhead. Batch alternative: `base.$transaction([set_config raw, actual query])` (sequential batch) works for single operations and is cheaper. Measure both.
- Model → client property name: lowercase first letter of the model name (`Member` → `member`, `OrgInvite` → `orgInvite`).
- Nested writes (e.g., `order.create({ data: { items: { create: [...] } } })`) run inside the same transaction — fine.
- Code that already opens `$transaction` (none today in services, but check `grep -rn "\$transaction" src/`) must set the config itself; the extension can't wrap an existing transaction.
- **PgBouncer / pooling caveat:** Azure PG Flexible Server's built-in PgBouncer in *transaction* mode is compatible with `SET LOCAL`/`set_config(..., true)` since it's transaction-scoped. **Session-scoped `SET` is NOT safe** through transaction pooling — never use `set_config(..., false)`.

### 4. Platform context (superadmin / cross-tenant paths)

Add a sentinel to the tenancy layer, e.g. `runAsPlatform(fn)` setting an ALS flag. When set, the extension:
- skips org-filter injection (already the behavior for non-tenant models), and
- sets `set_config('app.org_id', '__platform__', true)` — paired with an additional policy on each table:

```sql
CREATE POLICY platform_access ON "Member"
  USING (current_setting('app.org_id', true) = '__platform__')
  WITH CHECK (false);  -- platform context may read, never write tenant rows
```

Wrap ONLY: superadmin console queries, invite-token lookup (read + the accept path needs a write to OrgInvite/OrganizationUser — for that, resolve the org first, then `runWithOrg(orgId, ...)` for the write; no platform-write policy needed).

### 5. Drop the transitional defaults (same milestone)

New migration:
```sql
ALTER TABLE "Member" ALTER COLUMN "organizationId" DROP DEFAULT;  -- ×17 tables
```
And in `prisma/schema.prisma` remove all `@default("org_tenant_zero_hcch")` on `organizationId`, then `npx prisma generate`. This re-introduces the TypeScript requirement to pass organizationId in create types — the extension still injects at runtime, so fix type errors by keeping creates as-is and casting through the extension boundary OR (cleaner) accept the ~25 call-site edits to pass nothing and let the extension's injected value satisfy runtime while types use `Prisma.XUncheckedCreateInput` with organizationId marked optional via a wrapper type. Decide at implementation time; the tests will catch behavioral drift either way.

## Rollout order (on Azure)

1. Provision Azure PG Flexible Server; run `prisma migrate deploy` as `ciderclub_admin`.
2. Create `app_runtime`, grants (SQL above). Point the app at it. **Deploy and verify the app works with zero RLS enabled yet** (pure privilege-drop step, easy rollback).
3. Ship the extension change (transaction wrapping + platform context) behind an env flag, e.g. `RLS_MODE=off|log|enforce`, defaulting `off`.
4. Apply the RLS migration (enable+force+policies on all 17 tables — write it as a normal Prisma migration so PGlite tests parse it; guard Azure-only statements if any).
5. Flip `RLS_MODE=enforce` on staging → run the vitest suite pointed at staging DB (`DATABASE_URL` override) → manual smoke: member portal, admin portal, billing dry-run, superadmin console, invite accept.
6. Enforce in production. Then apply the drop-defaults migration (§5).

## Verification checklist

- [ ] As `app_runtime` with `app.org_id` unset: `SELECT count(*) FROM "Member"` returns 0 (not an error, not other tenants' rows).
- [ ] With `app.org_id = orgA`: cannot SELECT/UPDATE/DELETE orgB rows; INSERT with orgB's id fails the `WITH CHECK`.
- [ ] `ALTER ROLE app_runtime BYPASSRLS` is false; `app_runtime` is not the table owner.
- [ ] Existing vitest suite (60+ tests incl. `tests/services/tenancy.test.ts` isolation cases) passes against a real Postgres with RLS enforced.
- [ ] Invite acceptance works from a different tenant's host.
- [ ] Superadmin console renders counts.
- [ ] Billing run (card-on-file happy path in Square sandbox) unaffected.
- [ ] `EXPLAIN ANALYZE` on the member list query: index on `organizationId` still used (policies add a filter; the composite indexes from migration `20260705000000` cover it).

## Known traps

- **PGlite tests**: PGlite connects as superuser/owner; even with `FORCE ROW LEVEL SECURITY`, superusers bypass RLS entirely, so don't trust green local tests as proof of enforcement. You can still unit-test policy SQL by creating a non-login role in PGlite and using `SET ROLE app_runtime` inside a test transaction — worth doing, but staging validation is the real gate.
- **`prisma migrate deploy` must NOT run as `app_runtime`** — policies would block the backfill UPDATEs in old migrations on fresh databases.
- **Long-lived Prisma connections**: `set_config(..., true)` is transaction-local so there's no leakage between pooled transactions; do not "optimize" it to session-local.
- **`findUnique` by id**: the app-layer extension deliberately doesn't filter these (cuids are unguessable). RLS closes that gap — expect a few places (admin order detail across orgs for superadmin, etc.) to start returning null in platform context until wrapped correctly.
- **Seed script** (`prisma/seed.ts`) connects with whatever `DATABASE_URL` is set — run it as admin or wrap with `runWithOrg`.
