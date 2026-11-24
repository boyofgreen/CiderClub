import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getShippingSettings } from '@/lib/settings'
import { fulfillmentData, recalcOrderTotal, ShippingError } from '@/services/shipping'
import { sendShippedEmail } from '@/services/billing'

// Admin delivery controls for an order.
// PUT  { fulfillment, shipTo }            — switch pickup/ship or fix the address (until billed)
// POST { trackingNumber?, notify? }       — mark shipped, optionally emailing the member
// DELETE                                  — undo "shipped"
async function requireAdmin() {
  const session = await getServerSession(authOptions)
  return session?.user.role === 'ADMIN'
}

export async function PUT(req: Request, { params }: { params: { orderId: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const order = await prisma.order.findUnique({ where: { id: params.orderId }, select: { status: true } })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (['BILLED', 'CANCELLED'].includes(order.status)) {
    return NextResponse.json(
      { error: "This order is already billed or cancelled, so the shipping charge can't change. Adjust it in Square." },
      { status: 409 }
    )
  }

  try {
    // Admins aren't held to the "shipping is on" switch or the state list —
    // that's for member self-service. The address still has to be complete.
    const settings = { ...(await getShippingSettings()), enabled: true, states: [] }
    const data = fulfillmentData(await req.json().catch(() => ({})), settings)
    await prisma.order.update({ where: { id: params.orderId }, data })
    const totalInCents = await recalcOrderTotal(params.orderId)
    return NextResponse.json({ ok: true, totalInCents })
  } catch (err) {
    if (err instanceof ShippingError) return NextResponse.json({ error: err.message }, { status: err.status })
    throw err
  }
}

export async function POST(req: Request, { params }: { params: { orderId: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const trackingNumber = typeof body.trackingNumber === 'string' ? body.trackingNumber.trim().slice(0, 100) : ''

  const order = await prisma.order.findUnique({ where: { id: params.orderId }, select: { fulfillment: true } })
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (order.fulfillment !== 'SHIP') return NextResponse.json({ error: 'This order is set for pickup.' }, { status: 409 })

  await prisma.order.update({
    where: { id: params.orderId },
    data: { shippedAt: new Date(), trackingNumber: trackingNumber || null },
  })
  if (body.notify !== false) await sendShippedEmail(params.orderId)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { orderId: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.order.update({ where: { id: params.orderId }, data: { shippedAt: null, trackingNumber: null } })
  return NextResponse.json({ ok: true })
}
