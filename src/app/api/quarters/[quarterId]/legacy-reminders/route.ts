import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { remindLegacyMembers } from '@/services/legacy'

// POST — "last call" to legacy members who haven't built an order for this quarter
export async function POST(
  _req: Request,
  { params }: { params: { quarterId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const quarter = await prisma.quarter.findUniqueOrThrow({ where: { id: params.quarterId } })
    if (quarter.status !== 'OPEN') {
      return NextResponse.json({ error: 'Legacy members can only order while the quarter is open.' }, { status: 409 })
    }
    const result = await remindLegacyMembers(quarter)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
