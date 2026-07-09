import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { prisma, resetDb } from '../helpers/prismaTestClient'
import { decryptSecret } from '@/lib/crypto'
import {
  connectSquareForOrg,
  disconnectSquareForOrg,
  buildAuthorizeUrl,
  createOAuthState,
  verifyOAuthState,
} from '@/services/square/oauth'
import { getValidAccessToken } from '@/lib/squareTokens'
import { DEFAULT_ORG_ID } from '../../src/lib/tenancy'

const fetchMock = vi.fn()

beforeEach(async () => {
  await resetDb()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status })
}

async function ensureDefaultOrg() {
  await prisma.setting.findFirst({ where: { key: 'warmup' } }) // lazily creates tenant zero
  return DEFAULT_ORG_ID
}

describe('OAuth state', () => {
  it('round-trips and rejects garbage', async () => {
    const token = await createOAuthState({ orgId: 'org1', userId: 'u1', returnTo: 'http://x/admin' })
    expect(await verifyOAuthState(token)).toMatchObject({ orgId: 'org1', returnTo: 'http://x/admin' })
    expect(await verifyOAuthState('garbage')).toBeNull()
  })

  it('authorize URL carries app id, scopes, and state', () => {
    const url = new URL(buildAuthorizeUrl('the-state'))
    expect(url.origin).toBe('https://connect.squareupsandbox.com')
    expect(url.searchParams.get('client_id')).toBe('sq-test-app-id')
    expect(url.searchParams.get('state')).toBe('the-state')
    expect(url.searchParams.get('scope')).toContain('PAYMENTS_WRITE')
  })
})

describe('connectSquareForOrg', () => {
  it('exchanges the code, stores encrypted tokens, and auto-selects a single location', async () => {
    const orgId = await ensureDefaultOrg()
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          access_token: 'sq-access-123',
          refresh_token: 'sq-refresh-456',
          expires_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
          merchant_id: 'MERCHANT_A',
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(200, { locations: [{ id: 'LOC_A', name: 'Tasting Room', status: 'ACTIVE' }] })
      )

    const result = await connectSquareForOrg(orgId, 'auth-code')

    expect(result.merchantId).toBe('MERCHANT_A')
    expect(result.autoSelectedLocationId).toBe('LOC_A')

    const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } })
    expect(org.squareMerchantId).toBe('MERCHANT_A')
    expect(org.squareLocationId).toBe('LOC_A')
    // Tokens are stored encrypted, never plaintext
    expect(org.squareAccessToken).not.toContain('sq-access-123')
    expect(decryptSecret(org.squareAccessToken!)).toBe('sq-access-123')
    expect(decryptSecret(org.squareRefreshToken!)).toBe('sq-refresh-456')
  })

  it('leaves location unselected when the merchant has several', async () => {
    const orgId = await ensureDefaultOrg()
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          access_token: 'tok',
          refresh_token: 'ref',
          expires_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
          merchant_id: 'MERCHANT_MULTI',
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          locations: [
            { id: 'L1', name: 'Downtown', status: 'ACTIVE' },
            { id: 'L2', name: 'Farm', status: 'ACTIVE' },
          ],
        })
      )

    const result = await connectSquareForOrg(orgId, 'code')
    expect(result.autoSelectedLocationId).toBeNull()
    const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } })
    expect(org.squareLocationId).toBeNull()
  })

  it('refuses to connect a merchant already linked to another org', async () => {
    await ensureDefaultOrg()
    await prisma.organization.create({
      data: { name: 'Other', slug: 'other-cidery', squareMerchantId: 'MERCHANT_TAKEN' },
    })
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        access_token: 'tok',
        refresh_token: 'ref',
        expires_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
        merchant_id: 'MERCHANT_TAKEN',
      })
    )

    await expect(connectSquareForOrg(DEFAULT_ORG_ID, 'code')).rejects.toThrow(/already connected/)
  })

  it('surfaces Square token-exchange failures', async () => {
    const orgId = await ensureDefaultOrg()
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { errors: [{ code: 'UNAUTHORIZED' }] }))
    await expect(connectSquareForOrg(orgId, 'bad-code')).rejects.toThrow(/token request failed/)
  })
})

describe('token refresh', () => {
  it('refreshes and persists when the token is near expiry', async () => {
    const orgId = await ensureDefaultOrg()
    // Connect with a token expiring tomorrow (inside the 3-day refresh window)
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          access_token: 'old-token',
          refresh_token: 'old-refresh',
          expires_at: new Date(Date.now() + 1 * 86400_000).toISOString(),
          merchant_id: 'M',
        })
      )
      .mockResolvedValueOnce(jsonResponse(200, { locations: [] }))
    await connectSquareForOrg(orgId, 'code')

    // Next token access triggers a refresh
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        access_token: 'new-token',
        refresh_token: 'new-refresh',
        expires_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
        merchant_id: 'M',
      })
    )

    const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } })
    const token = await getValidAccessToken(org)
    expect(token).toBe('new-token')

    const updated = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } })
    expect(decryptSecret(updated.squareAccessToken!)).toBe('new-token')
    expect(decryptSecret(updated.squareRefreshToken!)).toBe('new-refresh')
  })

  it('returns the current token without refresh when far from expiry', async () => {
    const orgId = await ensureDefaultOrg()
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          access_token: 'stable-token',
          refresh_token: 'r',
          expires_at: new Date(Date.now() + 25 * 86400_000).toISOString(),
          merchant_id: 'M',
        })
      )
      .mockResolvedValueOnce(jsonResponse(200, { locations: [] }))
    await connectSquareForOrg(orgId, 'code')
    fetchMock.mockClear()

    const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } })
    expect(await getValidAccessToken(org)).toBe('stable-token')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('disconnectSquareForOrg', () => {
  it('revokes at Square and clears the connection', async () => {
    const orgId = await ensureDefaultOrg()
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(200, {
          access_token: 'tok',
          refresh_token: 'ref',
          expires_at: new Date(Date.now() + 30 * 86400_000).toISOString(),
          merchant_id: 'M_REVOKE',
        })
      )
      .mockResolvedValueOnce(jsonResponse(200, { locations: [] }))
    await connectSquareForOrg(orgId, 'code')

    fetchMock.mockResolvedValueOnce(jsonResponse(200, {})) // revoke call
    await disconnectSquareForOrg(orgId)

    const revokeCall = fetchMock.mock.calls.at(-1)!
    expect(String(revokeCall[0])).toContain('/oauth2/revoke')

    const org = await prisma.organization.findUniqueOrThrow({ where: { id: orgId } })
    expect(org.squareAccessToken).toBeNull()
    expect(org.squareRefreshToken).toBeNull()
    expect(org.squareMerchantId).toBeNull()
    expect(org.squareLocationId).toBeNull()
  })
})
