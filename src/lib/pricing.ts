/**
 * Shared order pricing: subtotal → discount → sales tax.
 *
 * An order normally takes its discount and bottle count from the member's plan.
 * Legacy opt-in orders carry their own terms (Order.discountPercent / minBottles),
 * captured when the order was created, and those win when present.
 */

type PlanTerms = { discountPercent?: number | null; packsPerOrder?: number | null } | null | undefined
type OrderTerms = { discountPercent?: number | null; minBottles?: number | null }

const clampPercent = (n: number) => Math.max(0, Math.min(100, n))

/** Discount to apply to an order: its own terms if set, otherwise the plan's. */
export function orderDiscountPercent(order: OrderTerms, plan: PlanTerms): number {
  return clampPercent(order.discountPercent ?? plan?.discountPercent ?? 0)
}

/** Fewest bottles an order may hold: its own terms if set, otherwise the plan's box size. */
export function orderMinBottles(order: OrderTerms, plan: PlanTerms): number {
  return order.minBottles ?? plan?.packsPerOrder ?? 0
}

export function orderTotalInCents(subtotalInCents: number, discountPercent: number, taxRatePercent: number): number {
  const afterDiscount = Math.round(subtotalInCents * (1 - clampPercent(discountPercent) / 100))
  return Math.round(afterDiscount * (1 + taxRatePercent / 100))
}
