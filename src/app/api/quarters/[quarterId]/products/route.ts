import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAppSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: Request,
  { params }: { params: { quarterId: string } }
) {
  const appSession = await getAppSession()
  if (!appSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const quarterProducts = await prisma.quarterProduct.findMany({
    where: { quarterId: params.quarterId },
    include: { product: true },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json({ products: quarterProducts, quarterProducts })
}

export async function POST(
  req: Request,
  { params }: { params: { quarterId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { productId, isDefault, sortOrder } = await req.json()
  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 })
  }

  const quarterProduct = await prisma.quarterProduct.create({
    data: {
      quarterId: params.quarterId,
      productId,
      isDefault: isDefault ?? false,
      sortOrder: sortOrder ?? 0,
    },
    include: { product: true },
  })
  return NextResponse.json({ quarterProduct }, { status: 201 })
}

export async function PATCH(
  req: Request,
  { params }: { params: { quarterId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { quarterProductId, isDefault, sortOrder } = await req.json()
  if (!quarterProductId) {
    return NextResponse.json({ error: 'quarterProductId is required' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (isDefault !== undefined) data.isDefault = isDefault
  if (sortOrder !== undefined) data.sortOrder = parseInt(String(sortOrder))

  const quarterProduct = await prisma.quarterProduct.update({
    where: { id: quarterProductId },
    data,
    include: { product: true },
  })
  return NextResponse.json({ quarterProduct })
}

export async function DELETE(
  req: Request,
  { params }: { params: { quarterId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const quarterProductId = searchParams.get('quarterProductId')
  if (!quarterProductId) {
    return NextResponse.json({ error: 'quarterProductId query param required' }, { status: 400 })
  }

  await prisma.quarterProduct.delete({ where: { id: quarterProductId } })
  return NextResponse.json({ ok: true })
}
