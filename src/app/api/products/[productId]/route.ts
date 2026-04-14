import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function PATCH(
  req: Request,
  { params }: { params: { productId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const allowed = ['name', 'description', 'style', 'abv', 'squareItemId', 'isActive', 'sortOrder', 'imageUrl']
  const raw = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const data: Record<string, unknown> = { ...raw }
  if (raw.name) data.slug = slugify(raw.name as string)
  if (raw.abv !== undefined) data.abv = raw.abv ? parseFloat(String(raw.abv)) : null
  if (raw.sortOrder !== undefined) data.sortOrder = parseInt(String(raw.sortOrder))

  const product = await prisma.product.update({ where: { id: params.productId }, data })
  return NextResponse.json({ product })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { productId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const product = await prisma.product.update({
    where: { id: params.productId },
    data: { isActive: false },
  })
  return NextResponse.json({ product })
}
