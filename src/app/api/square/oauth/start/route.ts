import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { config } from '@/lib/config'
import { resolveRequestOrgId, resolveRequestOrgSlug } from '@/lib/tenantRequest'
import { DEFAULT_ORG_ID, DEFAULT_ORG_SLUG } from '@/lib/tenantHost'
import { portalUrlFor } from '@/lib/tenantUrls'
import { createOAuthState, buildAuthorizeUrl } from '@/services/square/oauth'

// GET /api/square/oauth/start — kick off the Square connect flow for this org
export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!config.square.appId || !config.square.appSecret) {
    return NextResponse.json(
      { error: 'Square app credentials are not configured on the platform.' },
      { status: 500 }
    )
  }

  const orgId = (await resolveRequestOrgId()) ?? DEFAULT_ORG_ID
  const slug = (await resolveRequestOrgSlug()) ?? DEFAULT_ORG_SLUG
  const returnTo = `${portalUrlFor(slug)}/admin/settings/payments`

  const state = await createOAuthState({ orgId, userId: session.user.id, returnTo })
  return NextResponse.redirect(buildAuthorizeUrl(state))
}
