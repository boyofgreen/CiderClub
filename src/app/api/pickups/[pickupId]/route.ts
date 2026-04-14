import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { pickupId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const pickup = await prisma.pickupEvent.findUnique({
    where: { id: params.pickupId },
    include: {
      quarter: { select: { id: true, label: true } },
      orders: {
        include: {
          member: { select: { id: true, firstName: true, lastName: true, email: true } },
          items: { include: { product: true } },
        },
      },
      attendances: {
        include: {
          member: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  })
  if (!pickup) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ pickup })
}

export async function PATCH(
  req: Request,
  { params }: { params: { pickupId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const allowed = ['title', 'startsAt', 'endsAt', 'location', 'notes', 'isPublic', 'maxSlots']
  const raw = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))
  const data: Record<string, unknown> = {}

  for (const [k, v] of Object.entries(raw)) {
    if (['startsAt', 'endsAt'].includes(k)) {
      data[k] = v ? new Date(v as string) : null
    } else if (k === 'maxSlots') {
      data[k] = v ? parseInt(String(v)) : null
    } else {
      data[k] = v
    }
  }

  const pickup = await prisma.pickupEvent.update({ where: { id: params.pickupId }, data })
  return NextResponse.json({ pickup })
}
