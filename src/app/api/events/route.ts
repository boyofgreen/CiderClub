import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — list upcoming public club events for the member portal
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const events = await prisma.clubEvent.findMany({
    where: { isPublic: true },
    orderBy: { startsAt: 'asc' },
  })

  return NextResponse.json({ events })
}
