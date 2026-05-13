import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Session } from 'next-auth'

function adminOnly(session: Session | null) {
  return session?.user.role === 'ADMIN'
}

export async function GET(
  _req: Request,
  { params }: { params: { memberId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!adminOnly(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const member = await prisma.member.findUnique({
    where: { id: params.memberId },
    include: { plan: true, orders: { include: { quarter: true } }, emailLogs: { take: 20, orderBy: { createdAt: 'desc' } } },
  })
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ member })
}

export async function PATCH(
  req: Request,
  { params }: { params: { memberId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!adminOnly(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const allowed = ['firstName', 'lastName', 'phone', 'address1', 'address2', 'city', 'state', 'zip', 'notes', 'planId']
  const data = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const member = await prisma.member.update({ where: { id: params.memberId }, data })
  return NextResponse.json({ member })
}
