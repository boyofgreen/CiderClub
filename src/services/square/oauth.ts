/**
 * Org-level Square OAuth orchestration: authorize URL + signed state,
 * connect (code exchange → encrypted storage → location detection),
 * disconnect (revoke + clear), and location management.
 *
 * Flow: tenant admin clicks Connect on their subdomain → /api/square/oauth/start
 * signs a state JWT (org + returnTo) and redirects to Square → Square redirects
 * to the SINGLE registered callback on the platform host → callback verifies
 * state, connects the org, and bounces back to the tenant's settings page.
 */
import { SignJWT, jwtVerify } from 'jose'
import { config } from '@/lib/config'
import { prisma } from '@/lib/prisma'
import {
  exchangeAuthorizationCode,
  revokeAccessToken,
  storeOrgTokens,
  listLocations,
  getValidAccessToken,
} from '@/lib/squareTokens'
import { decryptSecret } from '@/lib/crypto'

/** Scopes match what the app actually calls (payments, orders, customers,
 *  cards on file, catalog reads, inventory adjustments). */
export const SQUARE_OAUTH_SCOPES = [
  'MERCHANT_PROFILE_READ',
  'PAYMENTS_READ',
  'PAYMENTS_WRITE',
  'ORDERS_READ',
  'ORDERS_WRITE',
  'CUSTOMERS_READ',
  'CUSTOMERS_WRITE',
  'ITEMS_READ',
  'INVENTORY_READ',
  'INVENTORY_WRITE',
]

export function oauthRedirectUri(): string {
  // Must exactly match the redirect URL registered in the Square Developer
  // Console — always the platform host, never a tenant subdomain.
  return `${config.app.url}/api/square/oauth/callback`
}

interface OAuthState {
  orgId: string
  userId: string
  returnTo: string
}

function stateSecret() {
  return new TextEncoder().encode(config.auth.secret!)
}

export async function createOAuthState(state: OAuthState): Promise<string> {
  return new SignJWT({ ...state })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(stateSecret())
}

export async function verifyOAuthState(token: string): Promise<OAuthState | null> {
  try {
    const { payload } = await jwtVerify(token, stateSecret())
    if (typeof payload.orgId !== 'string' || typeof payload.returnTo !== 'string') return null
    return payload as unknown as OAuthState
  } catch {
    return null
  }
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: config.square.appId ?? '',
    scope: SQUARE_OAUTH_SCOPES.join(' '),
    session: 'false',
    state,
    redirect_uri: oauthRedirectUri(),
  })
  return `${config.square.oauthBaseUrl}/oauth2/authorize?${params.toString()}`
}

export interface ConnectResult {
  merchantId: string
  locations: { id: string; name: string; status: string }[]
  /** Set when exactly one active location existed and was auto-selected. */
  autoSelectedLocationId: string | null
}

/** Exchange the authorization code and store the connection on the org. */
export async function connectSquareForOrg(orgId: string, code: string): Promise<ConnectResult> {
  const tokens = await exchangeAuthorizationCode(code, oauthRedirectUri())

  // One Square merchant belongs to one org — block cross-connections
  if (tokens.merchantId) {
    const holder = await prisma.organization.findUnique({
      where: { squareMerchantId: tokens.merchantId },
      select: { id: true, name: true },
    })
    if (holder && holder.id !== orgId) {
      throw new Error(
        `This Square account is already connected to another organization (${holder.name}).`
      )
    }
  }

  await storeOrgTokens(orgId, tokens)

  // Auto-select the location when there's exactly one active
  let locations: ConnectResult['locations'] = []
  let autoSelectedLocationId: string | null = null
  try {
    locations = await listLocations(tokens.accessToken)
    const active = locations.filter((l) => l.status === 'ACTIVE')
    if (active.length === 1) {
      autoSelectedLocationId = active[0].id
      await prisma.organization.update({
        where: { id: orgId },
        data: { squareLocationId: autoSelectedLocationId },
      })
    }
  } catch (err) {
    console.error('[square-oauth] Could not list locations after connect:', err)
  }

  return { merchantId: tokens.merchantId, locations, autoSelectedLocationId }
}

/** Revoke tokens at Square (best effort) and clear the org's connection. */
export async function disconnectSquareForOrg(orgId: string): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { squareAccessToken: true },
  })
  if (org?.squareAccessToken) {
    try {
      await revokeAccessToken(decryptSecret(org.squareAccessToken))
    } catch (err) {
      console.error(`[square-oauth] Revoke failed for org ${orgId}:`, err)
    }
  }
  await prisma.organization.update({
    where: { id: orgId },
    data: {
      squareMerchantId: null,
      squareLocationId: null,
      squareAccessToken: null,
      squareRefreshToken: null,
      squareTokenExpiresAt: null,
    },
  })
}

/** Live location list for the org's connected merchant. */
export async function listLocationsForOrg(orgId: string) {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: {
      id: true,
      squareAccessToken: true,
      squareRefreshToken: true,
      squareTokenExpiresAt: true,
    },
  })
  const token = await getValidAccessToken(org)
  if (!token) return []
  return listLocations(token)
}

export async function setOrgSquareLocation(orgId: string, locationId: string): Promise<void> {
  await prisma.organization.update({
    where: { id: orgId },
    data: { squareLocationId: locationId },
  })
}
