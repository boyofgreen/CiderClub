import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const events = await prisma.clubEvent.findMany({
    orderBy: { startsAt: 'asc' },
  })

  return NextResponse.json({ events })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { title, description, eventType, startsAt, endsAt, location, isPublic, imageUrl, notes } = body

  if (!title || !startsAt) {
    return NextResponse.json({ error: 'Title and start time are required' }, { status: 400 })
  }

  const event = await prisma.clubEvent.create({
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

  return NextResponse.json({ event }, { status: 201 })
}
