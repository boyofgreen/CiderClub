import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function PATCH(
  req: Request,
  { params }: { params: { planId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const allowed = ['name', 'description', 'packsPerOrder', 'priceInCents', 'maxCapacity', 'sortOrder', 'isActive']
  const raw = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const data: Record<string, unknown> = { ...raw }
  if (raw.name) data.slug = slugify(raw.name as string)
  if (raw.packsPerOrder !== undefined) data.packsPerOrder = parseInt(String(raw.packsPerOrder))
  if (raw.priceInCents !== undefined) data.priceInCents = parseInt(String(raw.priceInCents))
  if (raw.maxCapacity !== undefined) data.maxCapacity = raw.maxCapacity ? parseInt(String(raw.maxCapacity)) : null

  const plan = await prisma.plan.update({ where: { id: params.planId }, data })
  return NextResponse.json({ plan })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { planId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Soft delete: set isActive = false rather than destroying data
  const plan = await prisma.plan.update({
    where: { id: params.planId },
    data: { isActive: false },
  })
  return NextResponse.json({ plan })
}
