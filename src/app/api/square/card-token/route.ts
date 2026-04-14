import { NextResponse } from 'next/server'
import { getAppSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { squareClient } from '@/lib/square'

// POST — save a card token (from Square Web Payments SDK) to a member's Square customer
export async function POST(req: Request) {
  const appSession = await getAppSession()
  if (!appSession?.memberId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sourceId } = await req.json()
  if (!sourceId) return NextResponse.json({ error: 'sourceId is required' }, { status: 400 })

  const member = await prisma.member.findUnique({ where: { id: appSession.memberId } })
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (!member.squareCustomerId) {
    return NextResponse.json({ error: 'No Square customer linked to this member' }, { status: 400 })
  }

  try {
    const { result } = await squareClient.cardsApi.createCard({
      idempotencyKey: `card-${member.id}-${Date.now()}`,
      sourceId,
      card: {
        customerId: member.squareCustomerId,
      },
    })

    if (!result.card?.id) throw new Error('No card ID returned from Square')

    await prisma.member.update({
      where: { id: member.id },
      data: { squareCardId: result.card.id },
    })

    return NextResponse.json({ ok: true, cardBrand: result.card.cardBrand, last4: result.card.last4 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
