import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    include: { _count: { select: { members: true } } },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json({ plans })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { name, description, packsPerOrder, priceInCents, maxCapacity, sortOrder } = body

  if (!name || !packsPerOrder || !priceInCents) {
    return NextResponse.json({ error: 'name, packsPerOrder and priceInCents are required' }, { status: 400 })
  }

  const plan = await prisma.plan.create({
    data: {
      name,
      slug: slugify(name),
      description,
      packsPerOrder: parseInt(packsPerOrder),
      priceInCents: parseInt(priceInCents),
      maxCapacity: maxCapacity ? parseInt(maxCapacity) : null,
      sortOrder: sortOrder ?? 0,
    },
  })
  return NextResponse.json({ plan }, { status: 201 })
}
