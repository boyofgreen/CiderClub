/**
 * Square OAuth token plumbing — raw fetch against Square's OAuth endpoints
 * (no SDK: the endpoints are stable, and fetch is trivially mockable in
 * tests). Handles code exchange, refresh, revocation, and the encrypted
 * persistence of per-org tokens.
 *
 * Kept separate from lib/square.ts (client construction) and
 * services/square/oauth.ts (org-level connect/disconnect orchestration)
 * to avoid import cycles.
 */
import { config } from '@/lib/config'
import { encryptSecret, decryptSecret } from '@/lib/crypto'
import { prisma } from '@/lib/prisma'

export interface SquareTokens {
  accessToken: string
  refreshToken: string
  expiresAt: string // ISO 8601, ~30 days out
  merchantId: string
}

class SquareOAuthError extends Error {
  constructor(message: string, readonly detail?: unknown) {
    super(message)
    this.name = 'SquareOAuthError'
  }
}

function requireAppCredentials(): { clientId: string; clientSecret: string } {
  const clientId = config.square.appId
  const clientSecret = config.square.appSecret
  if (!clientId || !clientSecret) {
    throw new SquareOAuthError(
      'Square app credentials are not configured (SQUARE_APP_ID / SQUARE_APP_SECRET).'
    )
  }
  return { clientId, clientSecret }
}

async function tokenRequest(body: Record<string, string>): Promise<SquareTokens> {
  const res = await fetch(`${config.square.oauthBaseUrl}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok || !data.access_token) {
    throw new SquareOAuthError(
      `Square token request failed (${res.status})`,
      data
    )
  }
  return {
    accessToken: String(data.access_token),
    refreshToken: String(data.refresh_token ?? ''),
    expiresAt: String(data.expires_at ?? ''),
    merchantId: String(data.merchant_id ?? ''),
  }
}

/** Exchange an OAuth authorization code for tokens. */
export async function exchangeAuthorizationCode(code: string, redirectUri: string): Promise<SquareTokens> {
  const { clientId, clientSecret } = requireAppCredentials()
  return tokenRequest({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  })
}

/** Refresh an access token using the stored refresh token. */
export async function refreshAccessToken(refreshToken: string): Promise<SquareTokens> {
  const { clientId, clientSecret } = requireAppCredentials()
  return tokenRequest({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })
}

/** Revoke the merchant's tokens (called on disconnect). */
export async function revokeAccessToken(accessToken: string): Promise<void> {
  const { clientId, clientSecret } = requireAppCredentials()
  const res = await fetch(`${config.square.oauthBaseUrl}/oauth2/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Client ${clientSecret}`,
    },
    body: JSON.stringify({ client_id: clientId, access_token: accessToken }),
  })
  if (!res.ok) {
    // Revocation failure shouldn't block disconnect — log and continue
    console.error('[square-oauth] Token revocation failed:', res.status)
  }
}

/** List the merchant's locations (used at connect time and in settings). */
export async function listLocations(accessToken: string): Promise<{ id: string; name: string; status: string }[]> {
  const res = await fetch(`${config.square.oauthBaseUrl}/v2/locations`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = (await res.json().catch(() => ({}))) as {
    locations?: { id: string; name?: string; status?: string }[]
  }
  if (!res.ok) throw new SquareOAuthError(`Failed to list locations (${res.status})`, data)
  return (data.locations ?? []).map((l) => ({
    id: l.id,
    name: l.name ?? l.id,
    status: l.status ?? 'ACTIVE',
  }))
}

/** Persist tokens (encrypted) on the org. */
export async function storeOrgTokens(orgId: string, tokens: SquareTokens): Promise<void> {
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      squareMerchantId: tokens.merchantId || undefined,
      squareAccessToken: encryptSecret(tokens.accessToken),
      squareRefreshToken: tokens.refreshToken ? encryptSecret(tokens.refreshToken) : null,
      squareTokenExpiresAt: tokens.expiresAt ? new Date(tokens.expiresAt) : null,
    },
  })
}

const REFRESH_WINDOW_MS = 3 * 24 * 60 * 60 * 1000 // refresh when < 3 days left

/**
 * Decrypt the org's access token, transparently refreshing (and persisting)
 * when it's close to expiry. Returns null when the org has no connection.
 */
export async function getValidAccessToken(org: {
  id: string
  squareAccessToken: string | null
  squareRefreshToken: string | null
  squareTokenExpiresAt: Date | null
}): Promise<string | null> {
  if (!org.squareAccessToken) return null

  const needsRefresh =
    org.squareTokenExpiresAt !== null &&
    org.squareTokenExpiresAt.getTime() - Date.now() < REFRESH_WINDOW_MS

  if (needsRefresh && org.squareRefreshToken) {
    try {
      const fresh = await refreshAccessToken(decryptSecret(org.squareRefreshToken))
      await storeOrgTokens(org.id, fresh)
      return fresh.accessToken
    } catch (err) {
      console.error(`[square-oauth] Refresh failed for org ${org.id}:`, err)
      // Fall through to the existing token — it may still be valid
    }
  }

  return decryptSecret(org.squareAccessToken)
}
