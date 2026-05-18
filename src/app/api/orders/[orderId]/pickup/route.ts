import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST — mark an order as picked up (no body), or assign it to a pickup event ({ pickupEventId })
export async function POST(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const { pickupEventId } = body as { pickupEventId?: string }

  const data: Record<string, unknown> = pickupEventId !== undefined
    ? { pickupEventId: pickupEventId ?? null }
    : { pickedUpAt: new Date(), status: 'PICKED_UP' }

  const order = await prisma.order.update({
    where: { id: params.orderId },
    data,
  })
  return NextResponse.json({ order })
}
