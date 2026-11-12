import { NextResponse } from 'next/server'
import { getAppSession } from '@/lib/session'
import { rejoinFromLegacy, LegacyError } from '@/services/legacy'

// POST /api/members/me/rejoin — a legacy member switches back to a full
// membership on the tier they left. Orders resume with the next generation.
export async function POST() {
  const session = await getAppSession()
  if (!session?.memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await rejoinFromLegacy(session.memberId, { selfServe: true })
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof LegacyError) return NextResponse.json({ error: err.message }, { status: err.status })
    console.error('[rejoin]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
