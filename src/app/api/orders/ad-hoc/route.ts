import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSalesTaxPercent } from '@/lib/settings'

// POST /api/orders/ad-hoc — admin composes a one-off order outside the
// quarterly cycle. Items are priced at the product's real per-bottle price
// (no plan bundle math); the order starts at AWAITING_PICKUP and flows
// through the existing check-in + billing machinery.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const memberId = typeof body.memberId === 'string' ? body.memberId : ''
  const rawItems = Array.isArray(body.items) ? body.items : []
  const adminNotes = typeof body.adminNotes === 'string' ? body.adminNotes.trim() || null : null

  if (!memberId) return NextResponse.json({ error: 'memberId is required' }, { status: 400 })

  const items = rawItems
    .map((i: { productId?: unknown; quantity?: unknown }) => ({
      productId: typeof i.productId === 'string' ? i.productId : '',
      quantity: Number(i.quantity),
    }))
    .filter((i: { productId: string; quantity: number }) => i.productId && Number.isInteger(i.quantity) && i.quantity > 0)

  if (items.length === 0) {
    return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
  }

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { plan: true },
  })
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i: { productId: string }) => i.productId) } },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))
  for (const item of items) {
    if (!productMap.has(item.productId)) {
      return NextResponse.json({ error: 'One or more products not found' }, { status: 400 })
    }
  }

  // Same math as the order-items editor: subtotal → member tier discount → sales tax
  const subtotal = items.reduce(
    (sum: number, i: { productId: string; quantity: number }) =>
      sum + i.quantity * (productMap.get(i.productId)!.priceInCents ?? 2100),
    0
  )
  const discount = Math.max(0, Math.min(100, member.plan?.discountPercent ?? 0))
  const afterDiscount = Math.round(subtotal * (1 - discount / 100))
  const taxRatePercent = await getSalesTaxPercent()
  const totalInCents = Math.round(afterDiscount * (1 + taxRatePercent / 100))

  const order = await prisma.order.create({
    data: {
      memberId,
      quarterId: null,
      status: 'AWAITING_PICKUP',
      totalInCents,
      adminNotes,
      lastCustomizedAt: new Date(),
      items: {
        create: items.map((i: { productId: string; quantity: number }) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPriceInCents: productMap.get(i.productId)!.priceInCents ?? 2100,
        })),
      },
    },
    include: { items: { include: { product: true } }, member: true },
  })

  return NextResponse.json({ order }, { status: 201 })
}
