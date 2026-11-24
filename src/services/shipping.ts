/**
 * Shipping a club order to the member's door instead of picking it up.
 *
 * The fee is flat per box (default $25 per 3 bottles, so 4 bottles is two
 * boxes). It depends on the bottle count, so every change to an order's items
 * or delivery choice goes through recalcOrderTotal().
 */
import { prisma } from '@/lib/prisma'
import { getSalesTaxPercent, getShippingSettings, type ShippingSettings } from '@/lib/settings'
import { orderDiscountPercent, orderTotalInCents, shippingFeeInCents } from '@/lib/pricing'

export type Fulfillment = 'PICKUP' | 'SHIP'

export interface ShipTo {
  shipName: string
  shipPhone: string | null
  shipAddress1: string
  shipAddress2: string | null
  shipCity: string
  shipState: string
  shipZip: string
}

export class ShippingError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

const clean = (v: unknown, max = 120) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/**
 * Turn a delivery choice from a form into the Order fields to save.
 * Throws ShippingError with a member-friendly message when it can't be used.
 */
export function fulfillmentData(
  input: { fulfillment?: unknown; shipTo?: Record<string, unknown> | null },
  settings: ShippingSettings
): { fulfillment: Fulfillment } & Partial<ShipTo> {
  if (input.fulfillment !== 'SHIP') return { fulfillment: 'PICKUP' }
  if (!settings.enabled) throw new ShippingError("We're not shipping orders right now. Please choose pickup.")

  const a = input.shipTo ?? {}
  const shipTo: ShipTo = {
    shipName: clean(a.shipName),
    shipPhone: clean(a.shipPhone, 30) || null,
    shipAddress1: clean(a.shipAddress1),
    shipAddress2: clean(a.shipAddress2) || null,
    shipCity: clean(a.shipCity, 60),
    shipState: clean(a.shipState, 20).toUpperCase(),
    shipZip: clean(a.shipZip, 10),
  }
  if (!shipTo.shipName || !shipTo.shipAddress1 || !shipTo.shipCity || !shipTo.shipState || !shipTo.shipZip) {
    throw new ShippingError('Please fill in the name, street, city, state and ZIP to ship your order.')
  }
  if (!/^\d{5}(-\d{4})?$/.test(shipTo.shipZip)) throw new ShippingError('Please enter a 5-digit ZIP code.')
  if (settings.states.length > 0 && !settings.states.includes(shipTo.shipState)) {
    throw new ShippingError(`Sorry, we can only ship to ${listStates(settings.states)}. Please choose pickup.`)
  }
  return { fulfillment: 'SHIP', ...shipTo }
}

function listStates(states: string[]): string {
  const names: Record<string, string> = { TX: 'Texas' }
  const named = states.map((s) => names[s] ?? s)
  return named.length === 1 ? `addresses in ${named[0]}` : `these states: ${named.join(', ')}`
}

/**
 * Recompute an order's shipping fee and total from its current items, discount
 * and delivery choice, and save them. Returns the new total.
 */
export async function recalcOrderTotal(orderId: string): Promise<number> {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true, member: { include: { plan: true } } },
  })
  const [settings, taxRatePercent] = await Promise.all([getShippingSettings(), getSalesTaxPercent()])

  const bottles = order.items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = order.items.reduce((sum, i) => sum + i.quantity * (i.unitPriceInCents || 2100), 0)
  const shippingInCents =
    order.fulfillment === 'SHIP' ? shippingFeeInCents(bottles, settings.feePerBoxCents, settings.bottlesPerBox) : 0
  const totalInCents = orderTotalInCents(subtotal, orderDiscountPercent(order, order.member.plan), taxRatePercent, {
    feeInCents: shippingInCents,
    taxable: settings.taxable,
  })

  await prisma.order.update({ where: { id: orderId }, data: { shippingInCents, totalInCents } })
  return totalInCents
}

/** The member's profile address, used to prefill the shipping form. */
export function shipToFromMember(m: {
  firstName: string
  lastName: string
  phone: string | null
  address1: string | null
  address2: string | null
  city: string | null
  state: string | null
  zip: string | null
}) {
  return {
    shipName: `${m.firstName} ${m.lastName}`.trim(),
    shipPhone: m.phone ?? '',
    shipAddress1: m.address1 ?? '',
    shipAddress2: m.address2 ?? '',
    shipCity: m.city ?? '',
    shipState: (m.state ?? '').toUpperCase(),
    shipZip: m.zip ?? '',
  }
}

/** One-line address for emails and admin lists. */
export function formatShipTo(o: { [K in keyof ShipTo]?: string | null }): string {
  return [o.shipName, o.shipAddress1, o.shipAddress2, `${o.shipCity ?? ''}, ${o.shipState ?? ''} ${o.shipZip ?? ''}`.trim()]
    .filter(Boolean)
    .join(', ')
}
