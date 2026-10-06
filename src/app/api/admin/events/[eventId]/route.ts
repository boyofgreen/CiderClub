import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseEventBody } from '@/lib/eventForm'

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

  const parsed = parseEventBody(await req.json().catch(() => ({})))
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  // source/sourceUrl record where the event came from; editing doesn't change that.
  const event = await prisma.clubEvent.update({
    where: { id: params.eventId },
    data: parsed.data,
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
