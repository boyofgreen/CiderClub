import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [
    totalMembers,
    activeMembers,
    pausedMembers,
    cancelledMembers,
    waitlistCount,
    recentOrders,
    planBreakdown,
    revenueThisQuarter,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({ where: { status: 'ACTIVE' } }),
    prisma.member.count({ where: { status: 'PAUSED' } }),
    prisma.member.count({ where: { status: 'CANCELLED' } }),
    prisma.waitlistEntry.count({ where: { status: 'WAITING' } }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        member: { select: { firstName: true, lastName: true } },
        quarter: { select: { label: true } },
      },
    }),
    prisma.member.groupBy({
      by: ['planId'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
    }),
    prisma.order.aggregate({
      where: {
        status: 'BILLED',
        billedAt: { gte: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1) },
      },
      _sum: { totalInCents: true },
    }),
  ])

  // Enrich plan breakdown with plan names
  const plans = await prisma.plan.findMany({ select: { id: true, name: true } })
  const planMap = new Map(plans.map((p) => [p.id, p.name]))
  const planStats = planBreakdown.map((p) => ({
    planId: p.planId,
    planName: p.planId ? (planMap.get(p.planId) ?? 'Unknown') : 'No Plan',
    count: p._count.id,
  }))

  return NextResponse.json({
    members: {
      total: totalMembers,
      active: activeMembers,
      paused: pausedMembers,
      cancelled: cancelledMembers,
    },
    waitlistCount,
    revenueThisQuarterCents: revenueThisQuarter._sum.totalInCents ?? 0,
    planBreakdown: planStats,
    recentOrders,
  })
}
