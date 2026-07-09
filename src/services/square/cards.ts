import { getSquareForOrg } from '@/lib/square'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

/** Save a card tokenized by Square Web Payments SDK to a customer's profile */
export async function saveCardOnFile(params: {
  memberId: string
  squareCustomerId: string
  cardNonce: string
  cardholderName?: string
}): Promise<{ cardId: string; last4: string; brand: string }> {
  const { client: squareClient } = await getSquareForOrg()
  const response = await squareClient.cards.create({
    idempotencyKey: randomUUID(),
    sourceId: params.cardNonce,
    card: {
      customerId: params.squareCustomerId,
      cardholderName: params.cardholderName,
    },
  })

  if (!response.card?.id) throw new Error('Failed to save card')

  const cardId = response.card.id
  const last4 = response.card.last4 ?? '****'
  const brand = response.card.cardBrand ?? 'UNKNOWN'

  await prisma.member.update({
    where: { id: params.memberId },
    data: { squareCardId: cardId },
  })

  return { cardId, last4, brand }
}

/** Retrieve card details for display (last4, brand, expiry) */
export async function getCardDetails(cardId: string) {
  try {
    const { client: squareClient } = await getSquareForOrg()
    const response = await squareClient.cards.get({ cardId })
    const card = response.card
    if (!card) return null
    return {
      cardId: card.id!,
      last4: card.last4 ?? '****',
      brand: card.cardBrand ?? 'UNKNOWN',
      expMonth: card.expMonth,
      expYear: card.expYear,
    }
  } catch {
    return null
  }
}

/** Remove a card from Square and clear from member record */
export async function removeCardOnFile(memberId: string, cardId: string): Promise<void> {
  const { client: squareClient } = await getSquareForOrg()
  await squareClient.cards.disable({ cardId }).catch(() => {})
  await prisma.member.update({
    where: { id: memberId },
    data: { squareCardId: null },
  })
}
