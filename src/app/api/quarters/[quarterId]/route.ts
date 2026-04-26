import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { quarterId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const quarter = await prisma.quarter.findUnique({
    where: { id: params.quarterId },
    include: {
      products: { include: { product: true } },
      orders: {
        include: {
          member: { select: { id: true, firstName: true, lastName: true, email: true } },
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: { select: { orders: true } },
    },
  })
  if (!quarter) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ quarter })
}

export async function PATCH(
  req: Request,
  { params }: { params: { quarterId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  // Support action-based transitions
  if (body.action === 'LOCK') {
    const { lockQuarterOrders } = await import('@/services/orders')
    await lockQuarterOrders(params.quarterId)
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'ACTIVATE') {
    const quarter = await prisma.quarter.update({
      where: { id: params.quarterId },
      data: { status: 'ACTIVE' },
    })
    return NextResponse.json({ quarter })
  }

  if (body.action === 'COMPLETE') {
    const quarter = await prisma.quarter.update({
      where: { id: params.quarterId },
      data: { status: 'COMPLETED' },
    })
    return NextResponse.json({ quarter })
  }

  // Generic field update
  const allowed = ['label', 'startsAt', 'endsAt', 'pickupStartsAt', 'pickupEndsAt', 'status']
  const raw = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))
  const data: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (['startsAt', 'endsAt', 'pickupStartsAt', 'pickupEndsAt'].includes(k)) {
      data[k] = v ? new Date(v as string) : null
    } else {
      data[k] = v
    }
  }

  const quarter = await prisma.quarter.update({ where: { id: params.quarterId }, data })
  return NextResponse.json({ quarter })
}
