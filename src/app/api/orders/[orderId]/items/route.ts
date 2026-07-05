import { NextResponse } from 'next/server'
import { getAppSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getSalesTaxPercent } from '@/lib/settings'

// PUT /api/orders/[orderId]/items
// Replaces all order items. Body: { items: { productId: string; quantity: number }[] }
export async function PUT(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  const appSession = await getAppSession()
  if (!appSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { member: { include: { plan: true } } },
  })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isAdmin = appSession.role === 'ADMIN'

  if (!isAdmin && order.memberId !== appSession.memberId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!isAdmin && !['PENDING_CUSTOMIZATION', 'CUSTOMIZED'].includes(order.status)) {
    return NextResponse.json({ error: 'Order cannot be modified in its current state' }, { status: 409 })
  }

  const { items } = await req.json() as { items: { productId: string; quantity: number }[] }

  const total = items.reduce((sum, i) => sum + i.quantity, 0)
  const packsPerOrder = order.member.plan?.packsPerOrder ?? 0

  // Must include at least the plan's base bottle count
  if (total < packsPerOrder) {
    return NextResponse.json(
      { error: `Order must include at least ${packsPerOrder} bottles` },
      { status: 400 }
    )
  }

  // Members can only pick from quarter products; admins can use any active product.
  // (Ad-hoc orders have no quarter, but members can never edit those — they're
  // created past the customization statuses — so an empty allowlist is correct.)
  if (!isAdmin) {
    const quarterProducts = order.quarterId
      ? await prisma.quarterProduct.findMany({
          where: { quarterId: order.quarterId },
          select: { productId: true },
        })
      : []
    const allowedProductIds = new Set(quarterProducts.map((qp) => qp.productId))
    for (const item of items) {
      if (!allowedProductIds.has(item.productId)) {
        return NextResponse.json(
          { error: `Product ${item.productId} is not available this quarter` },
          { status: 400 }
        )
      }
    }
  }

  // Fetch product prices so we can persist unitPriceInCents and recalculate order total
  const productIds = items.map((i) => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, priceInCents: true },
  })
  const priceMap = new Map(products.map((p) => [p.id, p.priceInCents]))

  const itemsWithPrice = items
    .filter((i) => i.quantity > 0)
    .map((i) => ({
      orderId: params.orderId,
      productId: i.productId,
      quantity: i.quantity,
      unitPriceInCents: priceMap.get(i.productId) ?? 2100,
    }))

  const discount = Math.max(0, Math.min(100, order.member.plan?.discountPercent ?? 0))
  const subtotal = itemsWithPrice.reduce((sum, i) => sum + i.quantity * i.unitPriceInCents, 0)
  const afterDiscount = Math.round(subtotal * (1 - discount / 100))
  const taxRatePercent = await getSalesTaxPercent()
  const totalInCents = Math.round(afterDiscount * (1 + taxRatePercent / 100))

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { orderId: params.orderId } }),
    prisma.orderItem.createMany({ data: itemsWithPrice }),
    prisma.order.update({
      where: { id: params.orderId },
      data: {
        totalInCents,
        lastCustomizedAt: new Date(),
        ...(isAdmin ? {} : { status: 'CUSTOMIZED' }),
      },
    }),
  ])

  const updated = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: {
      member: { include: { plan: true } },
      quarter: true,
      items: { include: { product: true } },
      pickupEvent: true,
    },
  })
  return NextResponse.json({ order: updated })
}
