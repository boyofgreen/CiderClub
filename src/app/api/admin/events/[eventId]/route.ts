import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const event = await prisma.clubEvent.findUnique({ where: { id: params.eventId } })
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ event })
}

export async function PUT(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { title, description, eventType, startsAt, endsAt, location, isPublic, imageUrl, notes } = body

  if (!title || !startsAt) {
    return NextResponse.json({ error: 'Title and start time are required' }, { status: 400 })
  }

  const event = await prisma.clubEvent.update({
    where: { id: params.eventId },
    data: {
      title,
      description: description || null,
      eventType: eventType || 'OTHER',
      startsAt: new Date(startsAt),
      endsAt: endsAt ? new Date(endsAt) : null,
      location: location || null,
      isPublic: isPublic !== false,
      imageUrl: imageUrl || null,
      notes: notes || null,
    },
  })

  return NextResponse.json({ event })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { eventId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.clubEvent.delete({ where: { id: params.eventId } })
  return NextResponse.json({ ok: true })
}
