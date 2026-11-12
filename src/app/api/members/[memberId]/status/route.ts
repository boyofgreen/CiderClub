import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { pauseMember, cancelMember, reactivateMember } from '@/services/members'
import { moveToLegacy, rejoinFromLegacy, LegacyError } from '@/services/legacy'

export async function POST(
  req: Request,
  { params }: { params: { memberId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { action, pausedUntilQuarter, cancellationReason, cancelOpenOrders } = await req.json()

  try {
    if (action === 'PAUSE') {
      await pauseMember(params.memberId, pausedUntilQuarter)
    } else if (action === 'CANCEL') {
      await cancelMember(params.memberId, cancellationReason)
    } else if (action === 'LEGACY') {
      const result = await moveToLegacy(params.memberId, { cancelOpenOrders: cancelOpenOrders === true })
      return NextResponse.json({ ok: true, ...result })
    } else if (action === 'REACTIVATE') {
      const current = await prisma.member.findUnique({ where: { id: params.memberId }, select: { status: true } })
      // Coming back from legacy also restores their Square tier group and emails them.
      if (current?.status === 'LEGACY') await rejoinFromLegacy(params.memberId)
      else await reactivateMember(params.memberId)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof LegacyError) return NextResponse.json({ error: err.message }, { status: err.status })
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
