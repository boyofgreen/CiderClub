import { squareClient } from '@/lib/square'

interface OrderItem {
  squareVariationId: string | null
  quantity: number
}

/**
 * Decrement Square inventory for each item in a billed order.
 * Uses the IN_STOCK → SOLD transition so Square tracks it as a sale, not just a removal.
 * Silently skips items that have no squareVariationId (manually-added products).
 * Logs a warning but does NOT throw if SQUARE_LOCATION_ID is missing — billing already succeeded.
 */
export async function adjustInventoryForOrder(
  orderId: string,
  items: OrderItem[]
): Promise<void> {
  const locationId = process.env.SQUARE_LOCATION_ID
  if (!locationId) {
    console.warn(`[inventory] SQUARE_LOCATION_ID not set — skipping inventory adjustment for order ${orderId}`)
    return
  }

  const changes = items
    .filter((i) => i.squareVariationId && i.quantity > 0)
    .map((i) => ({
      type: 'ADJUSTMENT' as const,
      adjustment: {
        catalogObjectId: i.squareVariationId!,
        fromState: 'IN_STOCK' as const,
        toState: 'SOLD' as const,
        quantity: String(i.quantity),
        locationId,
        occurredAt: new Date().toISOString(),
      },
    }))

  if (changes.length === 0) return

  await squareClient.inventory.batchCreateChanges({
    idempotencyKey: `order-billed-${orderId}`,
    changes,
  })
}
