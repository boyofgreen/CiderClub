import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { resolveRequestOrgId } from '@/lib/tenantRequest'
import { DEFAULT_ORG_ID } from '@/lib/tenantHost'
import { setOrgSquareLocation, listLocationsForOrg } from '@/services/square/oauth'

// POST /api/square/oauth/location — choose which Square location this club sells from
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = z.object({ locationId: z.string().min(1) }).safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'locationId is required' }, { status: 400 })
  }

  const orgId = (await resolveRequestOrgId()) ?? DEFAULT_ORG_ID

  // Only allow locations that actually belong to the connected merchant
  const locations = await listLocationsForOrg(orgId).catch(() => [])
  if (!locations.some((l) => l.id === parsed.data.locationId)) {
    return NextResponse.json({ error: 'Unknown location for this Square account' }, { status: 400 })
  }

  await setOrgSquareLocation(orgId, parsed.data.locationId)
  return NextResponse.json({ ok: true })
}
