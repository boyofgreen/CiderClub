import { NextResponse } from 'next/server'
import { getAppSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

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

  // Members can only edit their own order
  if (appSession.role === 'MEMBER' && order.memberId !== appSession.memberId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!['PENDING_CUSTOMIZATION', 'CUSTOMIZED'].includes(order.status)) {
    return NextResponse.json({ error: 'Order cannot be modified in its current state' }, { status: 409 })
  }

  const { items } = await req.json() as { items: { productId: string; quantity: number }[] }

  // Validate total quantity matches plan
  const total = items.reduce((sum, i) => sum + i.quantity, 0)
  const packsPerOrder = order.member.plan?.packsPerOrder ?? 0
  if (total !== packsPerOrder) {
    return NextResponse.json(
      { error: `Total must equal ${packsPerOrder} packs` },
      { status: 400 }
    )
  }

  // Validate all products are available for this quarter
  const quarterProducts = await prisma.quarterProduct.findMany({
    where: { quarterId: order.quarterId },
    select: { productId: true },
  })
  const allowedProductIds = new Set(quarterProducts.map((qp) => qp.productId))

  for (const item of items) {
    if (!allowedProductIds.has(item.productId)) {
      return NextResponse.json(
        { error: `Product ${item.productId} is not available this quarter` },
        { status: 400 }
      )
    }
  }

  // Replace items in a transaction
  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { orderId: params.orderId } }),
    prisma.orderItem.createMany({
      data: items
        .filter((i) => i.quantity > 0)
        .map((i) => ({
          orderId: params.orderId,
          productId: i.productId,
          quantity: i.quantity,
        })),
    }),
    prisma.order.update({
      where: { id: params.orderId },
      data: { status: 'CUSTOMIZED', lastCustomizedAt: new Date() },
    }),
  ])

  const updated = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { items: { include: { product: true } } },
  })
  return NextResponse.json({ order: updated })
}
