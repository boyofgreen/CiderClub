import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { changeMemberPlanInSquare } from '@/services/square/customers'

export async function POST(
  req: Request,
  { params }: { params: { memberId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { planId } = await req.json()
  if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 })

  const member = await prisma.member.findUnique({
    where: { id: params.memberId },
    include: { plan: true },
  })
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const newPlan = await prisma.plan.findUnique({ where: { id: planId } })
  if (!newPlan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  if (member.planId === planId) {
    return NextResponse.json({ error: 'Member is already on that plan' }, { status: 400 })
  }

  await prisma.member.update({
    where: { id: params.memberId },
    data: { planId },
  })

  if (member.squareCustomerId) {
    try {
      await changeMemberPlanInSquare(member.squareCustomerId, member.plan.name, newPlan.name)
    } catch (err) {
      console.error('[Square] Plan change sync failed:', err)
    }
  }

  return NextResponse.json({ ok: true })
}
