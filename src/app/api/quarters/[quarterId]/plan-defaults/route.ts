import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — list all per-plan defaults for a quarter (grouped by plan on the client)
export async function GET(
  _req: Request,
  { params }: { params: { quarterId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const defaults = await prisma.quarterPlanDefault.findMany({
    where: { quarterId: params.quarterId },
    include: { product: true, plan: true },
    orderBy: [{ planId: 'asc' }, { sortOrder: 'asc' }],
  })
  return NextResponse.json({ defaults })
}

// PUT — replace the full set of defaults for a single (quarter, plan).
// Body: { planId: string, items: [{ productId: string, quantity: number }] }
export async function PUT(
  req: Request,
  { params }: { params: { quarterId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { planId, items } = await req.json() as {
    planId: string
    items: { productId: string; quantity: number }[]
  }
  if (!planId || !Array.isArray(items)) {
    return NextResponse.json({ error: 'planId and items[] are required' }, { status: 400 })
  }

  // Validate plan and quarter
  const [plan, quarter] = await Promise.all([
    prisma.plan.findUnique({ where: { id: planId } }),
    prisma.quarter.findUnique({ where: { id: params.quarterId } }),
  ])
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  if (!quarter) return NextResponse.json({ error: 'Quarter not found' }, { status: 404 })

  // Enforce that total quantity matches the plan's packsPerOrder (or 0 to clear)
  const total = items.reduce((s, i) => s + (i.quantity || 0), 0)
  if (total > 0 && total !== plan.packsPerOrder) {
    return NextResponse.json(
      { error: `Total quantity (${total}) must equal the plan's packsPerOrder (${plan.packsPerOrder})` },
      { status: 400 }
    )
  }

  // Validate that every product is on the quarter's available list
  const available = await prisma.quarterProduct.findMany({
    where: { quarterId: params.quarterId },
    select: { productId: true },
  })
  const allowed = new Set(available.map((qp) => qp.productId))
  for (const item of items) {
    if (item.quantity > 0 && !allowed.has(item.productId)) {
      return NextResponse.json(
        { error: `Product ${item.productId} is not available for this quarter` },
        { status: 400 }
      )
    }
  }

  await prisma.$transaction([
    prisma.quarterPlanDefault.deleteMany({
      where: { quarterId: params.quarterId, planId },
    }),
    prisma.quarterPlanDefault.createMany({
      data: items
        .filter((i) => i.quantity > 0)
        .map((i, idx) => ({
          quarterId: params.quarterId,
          planId,
          productId: i.productId,
          quantity: i.quantity,
          sortOrder: idx,
        })),
    }),
  ])

  const updated = await prisma.quarterPlanDefault.findMany({
    where: { quarterId: params.quarterId, planId },
    include: { product: true, plan: true },
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json({ defaults: updated })
}
