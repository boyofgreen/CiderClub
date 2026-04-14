import { NextResponse } from 'next/server'
import { getAppSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

// GET /api/members/me — returns current member's profile
export async function GET() {
  const session = await getAppSession()
  if (!session?.memberId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    include: { plan: true },
  })

  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ member })
}

// PATCH /api/members/me — update own profile
export async function PATCH(req: Request) {
  const session = await getAppSession()
  if (!session?.memberId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const allowed = ['firstName', 'lastName', 'phone', 'address1', 'address2', 'city', 'state', 'zip']
  const data = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  const member = await prisma.member.update({
    where: { id: session.memberId },
    data,
    include: { plan: true },
  })

  return NextResponse.json({ member })
}
