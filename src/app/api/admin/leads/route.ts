import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/leads — every captured lead, newest first, with plan names resolved
export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } })

  const planIds = Array.from(new Set(leads.map((l) => l.planId).filter(Boolean))) as string[]
  const plans = planIds.length
    ? await prisma.plan.findMany({ where: { id: { in: planIds } }, select: { id: true, name: true } })
    : []
  const planMap = Object.fromEntries(plans.map((p) => [p.id, p.name]))

  return NextResponse.json({
    leads: leads.map((l) => ({ ...l, planName: l.planId ? planMap[l.planId] ?? null : null })),
  })
}
