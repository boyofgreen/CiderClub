# Local Testing Guide

How to test the platform on your machine — no database server, no Docker, no
Azure, and no Square/Resend accounts required.

## Quick start

```bash
npm install          # also runs `prisma generate` (postinstall)
npm test             # full suite, ~60 tests, ~20s
npm run test:watch   # re-runs on file changes
```

Run one file, or one test by name:

```bash
npx vitest run tests/services/billing.test.ts
npx vitest run -t "never crosses tenant boundaries"
```

## How the test harness works (and why you can trust it)

Everything is wired in [`vitest.config.ts`](../vitest.config.ts) and `tests/helpers/`:

| Piece | What happens in tests |
|---|---|
| **Database** | A real Postgres runs *inside the test process* (PGlite/WASM). Every migration in `prisma/migrations/` is applied in order, so tests exercise the exact SQL production will run. Each test file gets its own fresh database; `resetDb()` truncates between tests. |
| **Prisma** | The app's client is swapped (via alias) for one backed by PGlite using Prisma's WASM query engine — required because this machine is Windows ARM64 and Prisma's native engine is x64-only. Same query API, same generated client. |
| **Tenancy** | The real `withTenancy` extension wraps the test client, so org injection/filtering behaves exactly like production. |
| **Square** | `@/lib/square` is aliased to a controllable fake (`tests/helpers/squareMock.ts`). Payment/order/inventory/customer calls are recorded in `squareState` for assertions; set `squareState.failCharge = true` to simulate a declined card. No network calls ever. |
| **Email** | Not mocked at all — `RESEND_API_KEY` is unset, so `sendEmail()` skips the network send but still writes `EmailLog` rows. Assert on those. |

### Writing a test

Use the builders in `tests/helpers/fixtures.ts` (`createPlan`, `createMember`,
`createProduct`, `createQuarter`, `createOrder`, `setSalesTax`) and start each
test file with:

```ts
beforeEach(async () => {
  await resetDb()
  resetSquareState()      // if the test touches Square
  await setSalesTax('0')  // pin tax so money math is deterministic
})
```

### Testing multi-tenant behavior

Everything runs as tenant zero by default. To act as another org:

```ts
const org = await prisma.organization.create({ data: { name: 'Bluebird', slug: 'bluebird' } })
const members = await runWithOrg(org.id, () => prisma.member.findMany())
```

**Important:** always `await` Prisma calls *inside* the `runWithOrg` callback
(or call service functions, which await internally). Returning an un-awaited
query out of the callback runs it under the caller's org — this is a real
footgun we caught with a test; `runWithOrg` guards against it, but don't fight it.

### Testing a new migration

Nothing special to do: drop the SQL into `prisma/migrations/<timestamp>_<name>/migration.sql`,
run `npx prisma generate` (if the schema changed), and `npm test`. If the SQL
is invalid or the backfill breaks, every test file fails at setup with the
Postgres error.

## Typecheck and lint

```bash
npx tsc --noEmit   # should print nothing
npm run lint
```

## Running the actual app locally — the honest caveats

On **this machine (Windows ARM64)** `npm run dev` cannot serve database-backed
pages: the standard Prisma client loads a native x64 engine that won't run
under ARM64 Node, and there's no local Postgres anyway (`.env` has a leftover
`DATABASE_URL="file:./dev.db"` that the postgres provider can't use). The test
suite above is the local verification path; full in-browser testing happens on
the Azure staging site once it exists.

On an **x64 machine with a real Postgres** (or once staging exists), the app
runs normally:

1. Set `DATABASE_URL` to the Postgres instance, `NEXTAUTH_SECRET`, OAuth creds,
   and `PLATFORM_ROOT_DOMAIN="localhost"` (see `.env.example`).
2. `npx prisma migrate deploy && npm run db:seed && npm run dev`
3. **Multi-tenant hosts work in a plain browser**: `http://localhost:3000` is
   the platform host (tenant zero), and `http://<org-slug>.localhost:3000`
   resolves to that org — Chrome/Edge/Firefox route `*.localhost` to loopback
   automatically, no hosts-file edits needed. Create a second org at
   `/onboarding`, then visit `http://<its-slug>.localhost:3000/admin/dashboard`
   to see the tenant switch (branding is still tenant-zero's until Phase 4).
4. Square: create a **sandbox** app at developer.squareup.com and use its
   sandbox Application ID / access token in `.env` — never production
   credentials in local dev. Resend: leave `RESEND_API_KEY` unset locally and
   read `/admin/email-logs` instead of sending real mail.

## Before you push

```bash
npx tsc --noEmit && npm test
```

Both clean = safe to push to `platform`. (Reminder: never push to
`claude/cider-club-platform-uGYHA` or `deploy` — those auto-deploy the LIVE
club site.)
