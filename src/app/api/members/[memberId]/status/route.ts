import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pauseMember, cancelMember, reactivateMember } from '@/services/members'

export async function POST(
  req: Request,
  { params }: { params: { memberId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { action, pausedUntilQuarter, cancellationReason } = await req.json()

  try {
    if (action === 'PAUSE') {
      await pauseMember(params.memberId, pausedUntilQuarter)
    } else if (action === 'CANCEL') {
      await cancelMember(params.memberId, cancellationReason)
    } else if (action === 'REACTIVATE') {
      await reactivateMember(params.memberId)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
