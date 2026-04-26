import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const quarters = await prisma.quarter.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
  })
  return NextResponse.json({ quarters })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { label, name, year, quarter, startsAt, endsAt, pickupStartsAt, pickupEndsAt } = body

  if (!label || !year || !quarter || !startsAt || !endsAt) {
    return NextResponse.json(
      { error: 'label, year, quarter, startsAt, endsAt are required' },
      { status: 400 }
    )
  }

  try {
    const q = await prisma.quarter.create({
      data: {
        label,
        name: name || null,
        year: parseInt(String(year)),
        quarter: parseInt(String(quarter)),
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        pickupStartsAt: pickupStartsAt ? new Date(pickupStartsAt) : null,
        pickupEndsAt: pickupEndsAt ? new Date(pickupEndsAt) : null,
        status: 'UPCOMING',
      },
    })
    return NextResponse.json({ quarter: q }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: `A quarter with label "${label}" already exists.` }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
