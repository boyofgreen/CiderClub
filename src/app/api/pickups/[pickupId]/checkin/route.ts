import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { billOrder } from '@/services/billing'

// POST — check in a member at pickup; optionally bill in-person
export async function POST(
  req: Request,
  { params }: { params: { pickupId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { memberId, orderId, billNow } = await req.json()
  if (!memberId) return NextResponse.json({ error: 'memberId is required' }, { status: 400 })

  // Upsert attendance record
  const attendance = await prisma.pickupAttendance.upsert({
    where: { memberId_pickupEventId: { memberId, pickupEventId: params.pickupId } },
    create: { pickupEventId: params.pickupId, memberId, checkedInAt: new Date() },
    update: { checkedInAt: new Date() },
  })

  let billingResult = null
  if (billNow && orderId) {
    try {
      billingResult = await billOrder(orderId, 'IN_PERSON')
    } catch (err) {
      return NextResponse.json({ attendance, billingError: String(err) })
    }
  }

  return NextResponse.json({ attendance, billing: billingResult })
}
