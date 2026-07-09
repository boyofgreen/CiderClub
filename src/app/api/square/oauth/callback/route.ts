import { NextResponse } from 'next/server'
import { verifyOAuthState, connectSquareForOrg } from '@/services/square/oauth'

/**
 * GET /api/square/oauth/callback — the single redirect URL registered with
 * Square. Runs on the platform host; the signed state JWT (15-min expiry,
 * minted for an authenticated org admin by /start) identifies the org and
 * where to bounce back, so no session is required here.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const stateToken = url.searchParams.get('state') ?? ''
  const oauthError = url.searchParams.get('error')

  const state = await verifyOAuthState(stateToken)
  if (!state) {
    return NextResponse.json({ error: 'Invalid or expired state' }, { status: 400 })
  }

  const back = (params: string) => NextResponse.redirect(`${state.returnTo}?${params}`)

  if (oauthError || !code) {
    // Seller clicked Deny (or Square returned an error)
    return back(`square=denied`)
  }

  try {
    const result = await connectSquareForOrg(state.orgId, code)
    const needsLocation = result.autoSelectedLocationId ? '' : '&square_pick_location=1'
    return back(`square=connected${needsLocation}`)
  } catch (err) {
    console.error('[square-oauth] Connect failed:', err)
    const message = err instanceof Error ? err.message : 'Connection failed'
    return back(`square=error&message=${encodeURIComponent(message)}`)
  }
}
