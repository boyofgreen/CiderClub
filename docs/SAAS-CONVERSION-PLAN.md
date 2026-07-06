# CiderClub → Multi-Tenant SaaS Conversion Plan

*Analysis date: July 2026. Codebase: Next.js 14 (App Router) + TypeScript, Prisma/PostgreSQL, NextAuth, Square, Resend, Tailwind. Hosted on Azure App Service via GitHub Actions.*

---

## Part 1 — What we have today

### Feature inventory (already built and sellable)

**Member-facing portal**
- OAuth login (Google, Facebook) + passwordless magic links with typed, expiring tokens
- Member dashboard, order customization per quarter, order history
- Pickup event RSVP, profile management (contact + card on file)
- Referral program with per-member referral codes
- Public registration with Square card tokenization at signup

**Admin portal (the real product)**
- Dashboard + analytics (MRR/QRR approximation, member counts, snapshots)
- Member CRM: statuses (active/paused/cancelled/waitlist), pause-until-quarter with auto-reactivation, notes, plan changes, Square sync
- Plans: tiered pricing, per-tier discounts, capacity caps with waitlist overflow
- Quarterly release lifecycle: UPCOMING → OPEN → LOCKED → BILLING → COMPLETED, with per-quarter product curation, per-plan default selections, bulk order generation
- Order lifecycle: PENDING_CUSTOMIZATION → CUSTOMIZED → LOCKED → AWAITING_PICKUP → PICKED_UP → BILLED (+ failure/cancel paths)
- Billing engine: card-on-file charges, Square payment links, in-person marking; bulk quarter billing; receipt + payment-failed emails
- Square integration: customers, cards, catalog sync, inventory adjustment on sale, payment webhooks
- Pickup events: scheduling, RSVP tracking, check-in
- Waitlist with positions, notification, conversion tracking
- Email: transactional (welcome, order ready, reminders, receipts, magic links) + campaign builder with recipient filters, delivery logging via Resend webhooks

This is a genuinely complete vertical: **club-membership commerce for pickup-oriented beverage producers**. That's a real niche — competitors (Commerce7, WineDirect, Corksy) are wine-centric, shipping-centric, and expensive for a small cidery running a pickup club.

### Single-tenant assumptions that must be broken

These are the load-bearing walls to move, in rough order of pain:

1. **No tenant model.** Every table is global. `Member.email`, `Plan.name/slug`, `Product.slug`, `Quarter.label` are globally unique — all must become unique *per organization*.
2. **Square credentials are environment variables** (`SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `NEXT_PUBLIC_SQUARE_APP_ID`). One Square account for the whole app. The webhook handler verifies one signature key and has no way to know which tenant an event belongs to.
3. **Admin = email in `ADMIN_EMAILS` env var** (`src/lib/auth.ts`). No role model per organization; `User.role` is a single global string.
4. **Single brand, single domain.** Club name from `NEXT_PUBLIC_CLUB_NAME`, cider-specific copy/styling hardcoded in pages, one `NEXT_PUBLIC_APP_URL`.
5. **Single email identity.** One `RESEND_API_KEY` / `RESEND_FROM_EMAIL`; all mail sends from your domain.
6. **"Quarter" is baked into the domain model** and the copy. Wineries often run 2–4 releases/year on arbitrary dates; some clubs are monthly. The `Quarter {year, quarter}` shape is too rigid.
7. **Billing/campaign sends run inside HTTP request handlers.** Fine for one club of ~100 members; a tenant with 2,000 members will hit request timeouts.
8. **No platform billing** — nothing charges *your customers* (the wineries) anything.

---

## Part 2 — Target architecture

```
                        ┌──────────────────────────────────────────┐
                        │  Platform (you)                          │
                        │  superadmin console · tenant provisioning│
                        │  Stripe subscriptions (SaaS billing)     │
                        └──────────────────────────────────────────┘
                                          │
     bluebird-cidery.clubcraft.app        │        club.bluebirdcidery.com (CNAME)
                 └────────────┬───────────┴────────────┬──────────┘
                              ▼                        ▼
                   ┌─────────────────────────────────────────┐
                   │  Tenant-resolving middleware             │
                   │  host → Organization (cached)            │
                   └─────────────────────────────────────────┘
                              │
        ┌─────────────────────┼──────────────────────┐
        ▼                     ▼                      ▼
  Member portal         Admin portal           Public API +
  (themed per org)      (org roles)            embed widget
        │                     │                      │
        └─────────────────────┼──────────────────────┘
                              ▼
                ┌───────────────────────────┐     ┌────────────────────┐
                │ PostgreSQL (shared schema, │     │ Job queue / cron   │
                │ organizationId everywhere, │     │ billing runs,      │
                │ Postgres RLS as backstop)  │     │ campaign sends,    │
                └───────────────────────────┘     │ reminders          │
                              │                    └────────────────────┘
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
        Square OAuth     Resend (per-org    Payment provider
        (per-org tokens, sending domains)   abstraction
        webhook router)                     (Stripe later)
```

**Tenancy model: shared database, shared schema, `organizationId` column + Postgres Row-Level Security.** At your likely scale (tens to low hundreds of tenants), schema-per-tenant or DB-per-tenant is operational overkill. RLS gives defense-in-depth so an application bug can't leak one cidery's member list to another.

---

## Part 3 — The conversion plan, phase by phase

### Phase 0 — Safety net (do this first, ~1–2 weeks)
The refactor touches every query in the app. Before starting:
- Add integration tests around the money paths: order generation, billing (all three methods), status transitions, waitlist conversion. Even a modest suite pays for itself immediately.
- Centralize config: replace scattered `process.env` reads with a single typed config module, so tenant-scoped settings have one place to land.
- Set up a staging environment with a production data copy.

### Phase 1 — Tenant core (~3–4 weeks) · the hard one
- New models:
  ```prisma
  model Organization {
    id            String  @id @default(cuid())
    name          String              // "Bluebird Cidery"
    slug          String  @unique     // subdomain: bluebird.yourplatform.app
    customDomain  String? @unique     // club.bluebirdcidery.com
    settings      Json                // theme, terminology, feature flags
    // per-tenant integration credentials (encrypted at rest)
    squareMerchantId       String? @unique
    squareAccessToken      String?   // encrypted
    squareRefreshToken     String?   // encrypted
    squareLocationId       String?
    squareWebhookSigKey    String?
    resendDomainId         String?
    fromEmail              String?
    // platform billing
    stripeCustomerId       String?
    planTier               String   @default("TRIAL")
    trialEndsAt            DateTime?
  }
  ```
- Add `organizationId` to every tenant-owned table (Member, Plan, Product, Quarter, Order, PickupEvent, WaitlistEntry, Campaign, EmailLog, MemberToken, AnalyticsSnapshot). Convert global uniques to composites: `@@unique([organizationId, email])`, `@@unique([organizationId, slug])`, etc.
- **Tenant resolution middleware**: map `Host` header → org (slug subdomain or custom domain), attach `orgId` to the request context. Cache lookups (in-memory + short TTL) — this runs on every request.
- **Query scoping**: a Prisma client extension that injects `organizationId` into every query for tenant-scoped models, so no individual route can forget the filter. Enable Postgres RLS keyed on a session variable as the backstop.
- **Migration**: a script that creates org #1 ("your cidery") and backfills `organizationId` on all existing rows. Your current site becomes tenant zero — you stay your own best customer and dogfood every release.
- Rename/generalize `Quarter` → `ReleaseCycle` with arbitrary dates and a `cadence` hint (monthly/quarterly/custom). Keep the same lifecycle statuses — they're good. Terminology ("quarter", "pack", "bottle") becomes an org setting used in UI copy.

### Phase 2 — Auth, roles, onboarding (~2 weeks)
- Replace `ADMIN_EMAILS` with an `OrganizationUser` join table: `role: OWNER | ADMIN | STAFF`, so a user can belong to multiple orgs (and you, as superadmin, to all).
- Club members stay tenant-scoped (Member rows + magic links already fit; just scope token lookups by org).
- Add email/password or email-magic-link auth for *operators* — don't force winery owners through Google/Facebook.
- **Onboarding wizard**: create org → pick subdomain → connect Square → verify email domain → create first plan → import members (CSV import is a must-have for switching costs; every prospect already has a spreadsheet or a Commerce7 export).
- Platform superadmin console: list tenants, impersonate ("log in as") for support, usage stats.

### Phase 3 — Per-tenant payments: Square OAuth (~2–3 weeks)
This is the "connect their own credit card system" requirement.
- Register as a **Square platform app**; implement the OAuth connect flow (`/admin/settings/payments` → Square consent → store access + refresh tokens encrypted, plus `merchant_id` and chosen `location_id`).
- Token refresh job (Square access tokens expire ~30 days; refresh proactively).
- **Webhook router**: one platform-level webhook endpoint subscribed via the Square app; route events to tenants by `merchant_id` in the payload. Replaces the per-account signature key model.
- Frontend: `NEXT_PUBLIC_SQUARE_APP_ID` stays platform-level (it's your app), but location ID for the Web Payments SDK comes from the org record, not env.
- All existing Square service code (`src/services/square/*`) changes from module-level client to `getSquareClientForOrg(orgId)`.
- Handle the disconnect/revoke path gracefully (org can disconnect; billing features disable with clear warnings).

### Phase 4 — White-labeling (~2 weeks)
- **Theming**: org settings for logo, primary/accent colors (CSS variables — Tailwind config already supports this pattern), hero image, welcome copy, club terminology. A theme editor with live preview in admin settings.
- **Custom domains**: CNAME to your platform + automated cert issuance. Note: Azure App Service custom-domain automation is clunky at scale — either front with **Azure Front Door**, or consider moving hosting to Vercel/Cloudflare where per-tenant domains + certs are a managed feature. Decide this early; it affects Phase 1 middleware testing.
- **Per-tenant email**: use Resend's Domains API to let each org verify their own sending domain (guided DKIM/SPF setup in the onboarding wizard); fall back to `clubname@mail.yourplatform.app` until verified. All templates take org branding.

### Phase 5 — Charge for it: platform billing (~1–2 weeks)
- **Stripe Billing** for your SaaS subscriptions (don't use Square for this — Stripe's subscription/dunning/tax tooling is far better, and it keeps platform billing cleanly separate from tenant payment processing).
- Suggested packaging (validate against the market):
  - **Starter** ~$79/mo — up to 150 members, subdomain only
  - **Growth** ~$149/mo — up to 500 members, custom domain, campaigns
  - **Pro** ~$299/mo — unlimited members, API access, priority support
  - 30-day free trial; no per-transaction fee (their Square account, their processing fees — this is a *selling point* vs. Commerce7/WineDirect's take rates)
- Feature gating + member-count metering; grace periods and dunning emails on failed platform payments.

### Phase 6 — Operational readiness (~2–3 weeks, overlaps others)
- **Background jobs**: move bulk billing runs and campaign sends out of HTTP handlers into a queue/cron worker (Azure Functions + Storage Queues, or a lightweight worker + pg-boss since Postgres is already there). Billing runs need per-order idempotency keys and a resumable progress model.
- Audit log table (who did what, per org) — operators will ask, and it's your support lifeline.
- Rate limiting on public endpoints (register, magic link request) per tenant.
- Observability: per-tenant error tracking and Square API failure alerting.
- Backups + tested restore; data export (full org export to CSV/JSON — also your answer to "what if I want to leave," which *increases* buyer trust).
- Security pass: encrypt integration tokens (Azure Key Vault or app-level AES-GCM with key in Key Vault), secrets rotation, dependency audit. Multi-tenant + stored payment relationships means a breach is existential.

**Realistic total: roughly 3–4 months of focused solo work to first paying tenant**, with Phases 4–6 partially parallelizable. The compressed "friendly first customer" path (Phases 0–3 + minimal theming) is ~2 months.

---

## Part 4 — Nice-to-have features (roadmap after launch)

**High leverage for sales**
- **Embeddable signup widget** — a `<script>` snippet wineries drop into their existing Squarespace/Wix/WordPress site; this is the literal "connect to their own site" ask and a killer demo
- **Member CSV import with plan mapping** (arguably a must-have; listed here if cut from Phase 2)
- **Stripe as an alternate tenant processor** behind a payment-provider interface — many wineries are on Stripe or want choice; also unlocks prospects who hate Square
- **SMS notifications** (Twilio): pickup reminders and "your order is ready" texts massively outperform email for pickup compliance
- **QR-code pickup check-in** — member shows a QR (or Apple/Google Wallet pass), staff scans, order marked picked up + billed in one motion

**Product depth**
- Shipping support for wineries that ship: label purchase, tracking emails — and **alcohol shipping compliance** (Sovos ShipCompliant integration). Big lift, big moat; wine shipping law is a nightmare and solving it is why WineDirect exists
- Gift memberships and gift cards
- Add-on store during customization ("add 2 bottles of the reserve at member pricing") — you have `unitPriceInCents` on OrderItem already; expand into a real upsell flow
- Dunning flows for failed member charges (auto-retry schedule, card-update magic links)
- Cancel-save flow (pause offer before cancel confirmation) — you already have pause-until-quarter, just put it in the cancellation path
- Event ticketing beyond pickups (release parties, tastings with paid tickets)
- Multi-location support (tasting room A vs. B pickup inventories)

**Platform/ecosystem**
- Public REST API + webhooks per tenant; Zapier connector
- POS integration beyond Square (Toast, Clover) via the provider abstraction
- Cross-tenant anonymized benchmarking ("your churn is 4%; platform median is 7%") — unique data asset no single-shop competitor has
- White-label member PWA (installable, push notifications for pickup windows)
- Email template gallery seeded from your own campaigns that worked

**Compliance & trust**
- Age gate / DOB capture at signup (alcohol!), TCPA-compliant SMS opt-in, per-org privacy policy pages, GDPR/CCPA delete + export

---

## Part 5 — Key decisions to make early

| Decision | Recommendation | Why |
|---|---|---|
| Tenancy model | Shared schema + `organizationId` + Postgres RLS | Right cost/complexity at your scale; RLS prevents cross-tenant leaks |
| Tenant payments | Square OAuth platform app first; provider abstraction from day one | Matches existing code; abstraction keeps Stripe door open cheaply |
| Platform billing | Stripe Billing | Best subscription/dunning tooling; separates concerns |
| Custom domains | Decide Azure Front Door vs. Vercel/Cloudflare **before Phase 1 ends** | Affects middleware, certs, and ops burden for years |
| "Quarter" model | Generalize to ReleaseCycle in Phase 1, not later | Schema renames get exponentially harder post-launch |
| First customers | 2–3 design-partner cideries at steep discount | Real Square accounts + real members will surface every tenancy bug before you scale |

## Part 6 — Honest risks

- **Square OAuth review**: Square reviews platform apps before production OAuth; start the application early (weeks of lead time).
- **Migration risk**: tenant-zero backfill on your live club must be rehearsed on staging — your own members are the ones hurt by a bad migration.
- **Alcohol regulation**: pickup-only clubs are low-risk, but the moment a tenant asks for shipping you're in three-tier-law territory. Be explicit in your terms that compliance is the winery's responsibility until you build compliance features.
- **Support load**: every tenant's "payments are broken" is now your pager. The superadmin impersonation tool and audit log aren't nice-to-haves — build them before customer #2.
