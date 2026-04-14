import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const entries = await prisma.waitlistEntry.findMany({
    where: { convertedAt: null },
    orderBy: { position: 'asc' },
    include: { plan: { select: { id: true, name: true } } },
  })
  return NextResponse.json({ entries })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { email, name, planId } = body

  if (!email || !planId) {
    return NextResponse.json({ error: 'email and planId are required' }, { status: 400 })
  }

  // Check if already on waitlist (not yet converted)
  const existing = await prisma.waitlistEntry.findFirst({
    where: { email, planId, convertedAt: null },
  })
  if (existing) {
    return NextResponse.json({ ok: true, alreadyWaiting: true })
  }

  // Determine position (last in queue)
  const last = await prisma.waitlistEntry.findFirst({
    where: { planId, convertedAt: null },
    orderBy: { position: 'desc' },
  })
  const position = (last?.position ?? 0) + 1

  const entry = await prisma.waitlistEntry.create({
    data: { email, name, planId, position },
  })
  return NextResponse.json({ entry }, { status: 201 })
}
