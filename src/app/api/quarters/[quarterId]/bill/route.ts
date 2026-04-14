import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { billQuarter } from '@/services/billing'

export async function POST(
  req: Request,
  { params }: { params: { quarterId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { method } = await req.json()
  if (!['CARD_ON_FILE', 'PAYMENT_LINK', 'IN_PERSON'].includes(method)) {
    return NextResponse.json({ error: 'Invalid billing method' }, { status: 400 })
  }

  try {
    const result = await billQuarter(params.quarterId, method)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
