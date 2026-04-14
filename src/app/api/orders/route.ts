import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const quarterId = searchParams.get('quarterId')
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (quarterId) where.quarterId = quarterId
  if (status) where.status = status

  const orders = await prisma.order.findMany({
    where,
    include: {
      member: { select: { id: true, firstName: true, lastName: true, email: true } },
      quarter: { select: { id: true, label: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ orders })
}
