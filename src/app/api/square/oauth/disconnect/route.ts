import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resolveRequestOrgId } from '@/lib/tenantRequest'
import { DEFAULT_ORG_ID } from '@/lib/tenantHost'
import { disconnectSquareForOrg } from '@/services/square/oauth'

// POST /api/square/oauth/disconnect — revoke and clear this org's connection
export async function POST() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orgId = (await resolveRequestOrgId()) ?? DEFAULT_ORG_ID
  await disconnectSquareForOrg(orgId)
  return NextResponse.json({ ok: true })
}
