import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const pickups = await prisma.pickupEvent.findMany({
    include: {
      quarter: { select: { id: true, label: true } },
      _count: { select: { orders: true, attendances: true } },
    },
    orderBy: { startsAt: 'desc' },
  })
  return NextResponse.json({ pickups })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { title, quarterId, startsAt, endsAt, location, notes, isPublic, maxSlots } = body

  if (!title || !quarterId || !startsAt || !endsAt) {
    return NextResponse.json({ error: 'title, quarterId, startsAt, and endsAt are required' }, { status: 400 })
  }

  const pickup = await prisma.pickupEvent.create({
    data: {
      title,
      quarterId,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      location,
      notes,
      isPublic: isPublic ?? true,
      maxSlots: maxSlots ? parseInt(String(maxSlots)) : null,
    },
  })
  return NextResponse.json({ pickup }, { status: 201 })
}
