'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { formatCents, formatDate } from '@/lib/utils'
import { Truck, Store } from 'lucide-react'

type ShipTo = {
  shipName: string
  shipPhone: string
  shipAddress1: string
  shipAddress2: string
  shipCity: string
  shipState: string
  shipZip: string
}

const FIELDS: Array<[keyof ShipTo, string]> = [
  ['shipName', 'Name'],
  ['shipPhone', 'Phone'],
  ['shipAddress1', 'Street'],
  ['shipAddress2', 'Apt / suite'],
  ['shipCity', 'City'],
  ['shipState', 'State'],
  ['shipZip', 'ZIP'],
]

/** Admin view of how an order gets to the member, with controls to change it or mark it shipped. */
export function DeliveryAdmin({
  orderId,
  status,
  fulfillment,
  shippingInCents,
  shipTo: savedShipTo,
  defaultShipTo,
  shippedAt,
  trackingNumber,
}: {
  orderId: string
  status: string
  fulfillment: string
  shippingInCents: number
  shipTo: ShipTo
  defaultShipTo: ShipTo
  shippedAt: string | null
  trackingNumber: string | null
}) {
  const router = useRouter()
  const isShip = fulfillment === 'SHIP'
  const editable = !['BILLED', 'CANCELLED'].includes(status)
  const [editing, setEditing] = useState(false)
  const [mode, setMode] = useState<'PICKUP' | 'SHIP'>(isShip ? 'SHIP' : 'PICKUP')
  const [shipTo, setShipTo] = useState<ShipTo>(savedShipTo.shipAddress1 ? savedShipTo : defaultShipTo)
  const [tracking, setTracking] = useState(trackingNumber ?? '')
  const [notify, setNotify] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function call(method: string, path: string, body?: unknown) {
    setBusy(true)
    setError(null)
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
      return false
    }
    router.refresh()
    return true
  }

  const saveDelivery = async () => {
    if (await call('PUT', `/api/orders/${orderId}/delivery`, { fulfillment: mode, shipTo })) setEditing(false)
  }
  const markShipped = () => call('POST', `/api/orders/${orderId}/delivery`, { trackingNumber: tracking, notify })
  const undoShipped = () => call('DELETE', `/api/orders/${orderId}/delivery`)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 font-semibold text-stone-900">
          {isShip ? <Truck className="h-4 w-4 text-terracotta" /> : <Store className="h-4 w-4 text-terracotta" />}
          {isShip ? 'Ship to member' : 'Pickup'}
        </h2>
        {editable && !editing && (
          <button onClick={() => setEditing(true)} className="text-xs text-terracotta hover:text-terracotta-deep">
            Change
          </button>
        )}
      </div>

      {error && <Alert type="error" message={error} className="mb-3 text-xs" />}

      {editing ? (
        <div className="space-y-3 text-sm">
          <div className="flex gap-4">
            {(['PICKUP', 'SHIP'] as const).map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={mode === m} onChange={() => setMode(m)} className="accent-terracotta" />
                {m === 'SHIP' ? 'Ship' : 'Pickup'}
              </label>
            ))}
          </div>
          {mode === 'SHIP' && (
            <div className="grid gap-2 sm:grid-cols-2">
              {FIELDS.map(([key, label]) => (
                <label key={key} className="block space-y-0.5">
                  <span className="text-xs text-stone-500">{label}</span>
                  <input
                    className="input"
                    value={shipTo[key]}
                    onChange={(e) => setShipTo({ ...shipTo, [key]: e.target.value })}
                  />
                </label>
              ))}
            </div>
          )}
          <p className="text-xs text-stone-400">
            The shipping fee and order total are recalculated when you save. Admin changes aren&apos;t limited to the
            ship-to states in Settings.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" onClick={saveDelivery} loading={busy}>Save</Button>
          </div>
        </div>
      ) : isShip ? (
        <div className="space-y-3 text-sm">
          <div className="text-stone-600 space-y-0.5">
            <p className="font-medium text-stone-800">{savedShipTo.shipName}</p>
            <p>{savedShipTo.shipAddress1}{savedShipTo.shipAddress2 ? `, ${savedShipTo.shipAddress2}` : ''}</p>
            <p>{savedShipTo.shipCity}, {savedShipTo.shipState} {savedShipTo.shipZip}</p>
            {savedShipTo.shipPhone && <p>{savedShipTo.shipPhone}</p>}
            <p className="pt-1">Shipping charge: <strong>{formatCents(shippingInCents)}</strong></p>
          </div>

          {shippedAt ? (
            <div className="flex items-center justify-between gap-3 border-t pt-3" style={{ borderColor: 'var(--rule)' }}>
              <p className="text-green-700">
                ✓ Shipped {formatDate(shippedAt)}
                {trackingNumber ? ` · ${trackingNumber}` : ''}
              </p>
              <button onClick={undoShipped} disabled={busy} className="text-xs text-stone-400 underline hover:text-terracotta">
                Undo
              </button>
            </div>
          ) : (
            <div className="space-y-2 border-t pt-3" style={{ borderColor: 'var(--rule)' }}>
              <input
                className="input"
                placeholder="Tracking number (optional)"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
              />
              <label className="flex items-center gap-2 text-xs text-stone-600 cursor-pointer">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="accent-terracotta" />
                Email the member that it&apos;s on its way
              </label>
              <Button size="sm" variant="saloon" onClick={markShipped} loading={busy}>
                <Truck className="h-3.5 w-3.5" /> Mark Shipped
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-stone-500">Member is picking this order up.</p>
      )}
    </div>
  )
}
