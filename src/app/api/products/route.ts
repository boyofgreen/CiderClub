import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ products })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { name, description, style, abv, squareItemId, sortOrder } = body

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      name,
      slug: slugify(name),
      description,
      style,
      abv: abv ? parseFloat(String(abv)) : null,
      squareItemId,
      sortOrder: sortOrder ?? 0,
    },
  })
  return NextResponse.json({ product }, { status: 201 })
}
