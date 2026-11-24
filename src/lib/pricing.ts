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

/**
 * Order total: subtotal → discount → shipping → sales tax. The discount never
 * applies to shipping; tax applies to it only when shippingTaxable.
 */
export function orderTotalInCents(
  subtotalInCents: number,
  discountPercent: number,
  taxRatePercent: number,
  shipping: { feeInCents: number; taxable: boolean } = { feeInCents: 0, taxable: false }
): number {
  const afterDiscount = Math.round(subtotalInCents * (1 - clampPercent(discountPercent) / 100))
  const taxableBase = afterDiscount + (shipping.taxable ? shipping.feeInCents : 0)
  const untaxed = shipping.taxable ? 0 : shipping.feeInCents
  return Math.round(taxableBase * (1 + taxRatePercent / 100)) + untaxed
}

/** Flat fee per started box: 1–3 bottles is one box, 4–6 is two, and so on. */
export function shippingFeeInCents(bottles: number, feePerBoxCents: number, bottlesPerBox: number): number {
  if (bottles <= 0) return 0
  return Math.ceil(bottles / Math.max(1, bottlesPerBox)) * feePerBoxCents
}
