import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from 'prisma-generated'
import { parseEventBody } from '@/lib/eventForm'

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

  const parsed = parseEventBody(await req.json().catch(() => ({})))
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  try {
    const event = await prisma.clubEvent.create({
      data: {
        ...parsed.data,
        source: parsed.source,
        sourceUrl: parsed.sourceUrl,
        ...(parsed.sourceUrl && parsed.ticketStatus
          ? { ticketStatus: parsed.ticketStatus, ticketStatusCheckedAt: new Date() }
          : {}),
      },
    })
    return NextResponse.json({ event }, { status: 201 })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json({ error: 'That event has already been imported.' }, { status: 409 })
    }
    throw err
  }
}
