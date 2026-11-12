import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateQuarterOrders } from '@/services/orders'
import { inviteLegacyMembers } from '@/services/legacy'

export async function POST(
  _req: Request,
  { params }: { params: { quarterId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const result = await generateQuarterOrders(params.quarterId)

    // Legacy members get no order — just an invitation to build one. A failure
    // here shouldn't hide the fact that the orders above were created.
    let legacyInvited = 0
    try {
      const quarter = await prisma.quarter.findUniqueOrThrow({ where: { id: params.quarterId } })
      legacyInvited = (await inviteLegacyMembers(quarter)).invited
    } catch (err) {
      console.error('[generate-orders] legacy invitations failed:', err)
    }

    return NextResponse.json({ ok: true, ...result, legacyInvited })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
