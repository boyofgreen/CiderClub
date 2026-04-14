import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST — admin assigns an order to a pickup event
export async function POST(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { pickupEventId } = await req.json()

  const order = await prisma.order.update({
    where: { id: params.orderId },
    data: { pickupEventId: pickupEventId ?? null },
  })
  return NextResponse.json({ order })
}
