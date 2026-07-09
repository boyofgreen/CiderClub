/**
 * Central typed access to all server-side configuration.
 *
 * Phase 0 of the SaaS conversion (docs/SAAS-CONVERSION-PLAN.md): every value
 * that an Organization will eventually own per-tenant (Square credentials,
 * email identity, branding, admin emails) is read through this module, so the
 * Phase 1 multi-tenant refactor can swap the source from process.env to the
 * tenant record in one place instead of hunting through the codebase.
 *
 * All getters are lazy — values are read from process.env on access, never
 * captured at import time.
 */
export const config = {
  app: {
    /** Public base URL — used in magic links and email CTAs. */
    get url(): string {
      return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    },
    /** Display name of the club. Becomes per-tenant branding in Phase 4. */
    get clubName(): string {
      return process.env.NEXT_PUBLIC_CLUB_NAME ?? 'Hill Country Cider Club'
    },
    /**
     * Platform root domain for tenant subdomains: <slug>.<rootDomain>.
     * Requests to the root itself (or www) are "platform" requests and use
     * the default org. Any other host is treated as a tenant custom domain.
     */
    get rootDomain(): string {
      return process.env.PLATFORM_ROOT_DOMAIN ?? 'localhost'
    },
  },

  auth: {
    get secret(): string | undefined {
      return process.env.NEXTAUTH_SECRET
    },
    /** Emails that get the ADMIN role. Replaced by OrganizationUser roles in Phase 2. */
    get adminEmails(): string[] {
      return (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    },
    google: {
      get clientId(): string {
        return process.env.GOOGLE_CLIENT_ID ?? ''
      },
      get clientSecret(): string {
        return process.env.GOOGLE_CLIENT_SECRET ?? ''
      },
    },
    facebook: {
      get clientId(): string {
        return process.env.FACEBOOK_CLIENT_ID ?? ''
      },
      get clientSecret(): string {
        return process.env.FACEBOOK_CLIENT_SECRET ?? ''
      },
    },
  },

  /**
   * Platform-level Square app credentials (OAuth client). Per-tenant access
   * tokens live encrypted on the Organization record; the env accessToken is
   * only the legacy fallback for tenant zero.
   */
  square: {
    /** OAuth client id — the Square Application ID. */
    get appId(): string | undefined {
      return process.env.SQUARE_APP_ID ?? process.env.NEXT_PUBLIC_SQUARE_APP_ID
    },
    get appSecret(): string | undefined {
      return process.env.SQUARE_APP_SECRET
    },
    /** Base URL for OAuth endpoints (sandbox vs production). */
    get oauthBaseUrl(): string {
      return process.env.SQUARE_ENVIRONMENT?.toLowerCase() === 'production'
        ? 'https://connect.squareup.com'
        : 'https://connect.squareupsandbox.com'
    },
    get accessToken(): string | undefined {
      return process.env.SQUARE_ACCESS_TOKEN
    },
    get configured(): boolean {
      return Boolean(process.env.SQUARE_ACCESS_TOKEN)
    },
    get environment(): 'production' | 'sandbox' {
      return process.env.SQUARE_ENVIRONMENT?.toLowerCase() === 'production'
        ? 'production'
        : 'sandbox'
    },
    get locationId(): string | undefined {
      return process.env.SQUARE_LOCATION_ID
    },
    get webhookSignatureKey(): string {
      return process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? ''
    },
  },

  /** Becomes per-tenant (verified sending domain per org) in Phase 4. */
  resend: {
    get apiKey(): string | undefined {
      return process.env.RESEND_API_KEY
    },
    get fromEmail(): string {
      return process.env.RESEND_FROM_EMAIL ?? 'Hill Country Cider Club <hello@hillcountryciderhouse.com>'
    },
    get webhookSecret(): string | undefined {
      return process.env.RESEND_WEBHOOK_SECRET
    },
  },
}
