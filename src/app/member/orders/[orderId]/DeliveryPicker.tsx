'use client'

import { Truck, Store } from 'lucide-react'
import { formatCents } from '@/lib/utils'

export type ShipTo = {
  shipName: string
  shipPhone: string
  shipAddress1: string
  shipAddress2: string
  shipCity: string
  shipState: string
  shipZip: string
}

export type ShippingTerms = {
  enabled: boolean
  feePerBoxCents: number
  bottlesPerBox: number
  taxable: boolean
  states: string[]
}

/** Same rule as the server: a flat fee for every started box. */
export function shippingFee(bottles: number, terms: ShippingTerms): number {
  if (bottles <= 0) return 0
  return Math.ceil(bottles / Math.max(1, terms.bottlesPerBox)) * terms.feePerBoxCents
}

const STATE_NAMES: Record<string, string> = { TX: 'Texas' }

/** Pickup vs. ship-to-my-door choice, with the address form when shipping. */
export function DeliveryPicker({
  fulfillment,
  onFulfillment,
  shipTo,
  onShipTo,
  terms,
  bottles,
}: {
  fulfillment: 'PICKUP' | 'SHIP'
  onFulfillment: (f: 'PICKUP' | 'SHIP') => void
  shipTo: ShipTo
  onShipTo: (s: ShipTo) => void
  terms: ShippingTerms
  bottles: number
}) {
  const set = (patch: Partial<ShipTo>) => onShipTo({ ...shipTo, ...patch })
  const boxes = Math.max(1, Math.ceil(bottles / Math.max(1, terms.bottlesPerBox)))
  const where =
    terms.states.length === 1 ? `within ${STATE_NAMES[terms.states[0]] ?? terms.states[0]}` : `to ${terms.states.join(', ')}`

  const option = (value: 'PICKUP' | 'SHIP', icon: React.ReactNode, title: string, sub: string) => (
    <label
      className="flex flex-1 cursor-pointer items-start gap-3 border p-3 transition"
      style={{
        borderColor: fulfillment === value ? 'var(--terracotta)' : 'var(--rule)',
        backgroundColor: fulfillment === value ? 'var(--cream-deep)' : undefined,
      }}
    >
      <input
        type="radio"
        name="fulfillment"
        value={value}
        checked={fulfillment === value}
        onChange={() => onFulfillment(value)}
        className="accent-terracotta mt-1"
      />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-stone-900">
          {icon} {title}
        </span>
        <span className="block text-xs text-stone-500 mt-0.5">{sub}</span>
      </span>
    </label>
  )

  return (
    <div className="mt-6" style={{ borderTop: '1px solid var(--rule)', paddingTop: 16 }}>
      <p style={{ fontSize: 10, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
        Delivery
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        {option('PICKUP', <Store className="h-4 w-4 text-terracotta" />, 'Pick up', 'At the cider house. No charge.')}
        {option(
          'SHIP',
          <Truck className="h-4 w-4 text-terracotta" />,
          'Ship to my door',
          `${formatCents(terms.feePerBoxCents)} per ${terms.bottlesPerBox} bottles` +
            (bottles > 0 ? ` · ${formatCents(shippingFee(bottles, terms))} for ${boxes} box${boxes === 1 ? '' : 'es'}` : '')
        )}
      </div>

      {fulfillment === 'SHIP' && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={shipTo.shipName} onChange={(v) => set({ shipName: v })} autoComplete="name" />
            <Field label="Phone (for the carrier)" value={shipTo.shipPhone} onChange={(v) => set({ shipPhone: v })} autoComplete="tel" />
          </div>
          <Field label="Street address" value={shipTo.shipAddress1} onChange={(v) => set({ shipAddress1: v })} autoComplete="address-line1" />
          <Field label="Apt, suite, etc. (optional)" value={shipTo.shipAddress2} onChange={(v) => set({ shipAddress2: v })} autoComplete="address-line2" />
          <div className="grid gap-3 grid-cols-[1fr_5rem_7rem]">
            <Field label="City" value={shipTo.shipCity} onChange={(v) => set({ shipCity: v })} autoComplete="address-level2" />
            <Field
              label="State"
              value={shipTo.shipState}
              onChange={(v) => set({ shipState: v.toUpperCase().slice(0, 2) })}
              autoComplete="address-level1"
            />
            <Field label="ZIP" value={shipTo.shipZip} onChange={(v) => set({ shipZip: v })} autoComplete="postal-code" inputMode="numeric" />
          </div>
          <p className="text-xs text-stone-500">
            We ship {where}. Someone 21 or older has to sign for the delivery. We&apos;ll email you a tracking
            number when it&apos;s on its way.
          </p>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  autoComplete,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  inputMode?: 'numeric'
}) {
  return (
    <label className="block space-y-1">
      <span className="label">{label}</span>
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
      />
    </label>
  )
}
