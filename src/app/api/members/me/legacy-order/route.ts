import { NextResponse } from 'next/server'
import { getAppSession } from '@/lib/session'
import { getLegacyOffer, createLegacyOrder, cancelLegacyOrder, LegacyError } from '@/services/legacy'

function fail(err: unknown) {
  if (err instanceof LegacyError) return NextResponse.json({ error: err.message }, { status: err.status })
  console.error('[legacy-order]', err)
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
}

// GET — what this legacy member can order right now (open quarter, lineup, terms)
export async function GET() {
  const session = await getAppSession()
  if (!session?.memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return NextResponse.json({ offer: await getLegacyOffer(session.memberId) })
  } catch (err) {
    return fail(err)
  }
}

// POST — opt in: create the order from the bottles they picked.
// Body: { items: { productId: string; quantity: number }[] }
export async function POST(req: Request) {
  const session = await getAppSession()
  if (!session?.memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  if (!Array.isArray(body.items)) return NextResponse.json({ error: 'items is required' }, { status: 400 })
  try {
    return NextResponse.json(await createLegacyOrder(session.memberId, body.items), { status: 201 })
  } catch (err) {
    return fail(err)
  }
}

// DELETE ?orderId= — back out of an opt-in order while the window is open
export async function DELETE(req: Request) {
  const session = await getAppSession()
  if (!session?.memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orderId = new URL(req.url).searchParams.get('orderId')
  if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
  try {
    await cancelLegacyOrder(session.memberId, orderId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return fail(err)
  }
}
