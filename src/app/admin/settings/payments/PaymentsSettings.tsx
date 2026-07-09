'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'

interface Location {
  id: string
  name: string
  status: string
}

export function PaymentsSettings(props: {
  oauthConnected: boolean
  legacyEnvFallback: boolean
  merchantId: string | null
  locationId: string | null
  tokenExpiresAt: string | null
  locations: Location[]
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationId, setLocationId] = useState(props.locationId ?? '')

  const flash = params.get('square')

  async function saveLocation() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/square/oauth/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to save location')
        return
      }
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function disconnect() {
    if (!confirm('Disconnect Square? Billing and card saving will stop working until you reconnect.')) return
    setBusy(true)
    try {
      await fetch('/api/square/oauth/disconnect', { method: 'POST' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {flash === 'connected' && <Alert type="success" message="Square connected! Pick your location below if it wasn't detected automatically." />}
      {flash === 'denied' && <Alert type="warning" message="Square connection was cancelled." />}
      {flash === 'error' && (
        <Alert type="error" message={params.get('message') ?? 'Square connection failed — please try again.'} />
      )}
      {error && <Alert type="error" message={error} />}

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-stone-900">Square account</h2>
          {props.oauthConnected ? (
            <Badge color="green">Connected</Badge>
          ) : props.legacyEnvFallback ? (
            <Badge color="amber">Using platform credentials (legacy)</Badge>
          ) : (
            <Badge color="gray">Not connected</Badge>
          )}
        </div>

        {props.oauthConnected ? (
          <>
            <dl className="text-sm space-y-1">
              <div className="flex gap-2">
                <dt className="text-stone-500 w-32">Merchant</dt>
                <dd className="font-mono text-stone-800">{props.merchantId ?? '—'}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-stone-500 w-32">Token renews</dt>
                <dd className="text-stone-800">
                  {props.tokenExpiresAt ? new Date(props.tokenExpiresAt).toLocaleDateString() : 'automatically'}
                  <span className="text-stone-500"> (refreshed automatically)</span>
                </dd>
              </div>
            </dl>

            <div className="space-y-1">
              <label className="label" htmlFor="square-location">Selling location</label>
              <div className="flex gap-2">
                <select
                  id="square-location"
                  className="input flex-1"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                >
                  <option value="" disabled>Choose a location…</option>
                  {props.locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} {l.status !== 'ACTIVE' ? `(${l.status.toLowerCase()})` : ''}
                    </option>
                  ))}
                </select>
                <Button onClick={saveLocation} loading={busy} disabled={!locationId || locationId === props.locationId}>
                  Save
                </Button>
              </div>
              {!props.locationId && (
                <p className="text-xs text-amber-700">
                  Billing is disabled until a location is selected.
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-stone-100">
              <Button variant="danger" size="sm" onClick={disconnect} loading={busy}>
                Disconnect Square
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-stone-600">
              {props.legacyEnvFallback
                ? 'This club is running on the platform’s legacy Square credentials. Connect its own Square account to switch over — nothing changes until the connection succeeds.'
                : 'Connect the Square account this club charges members with. You’ll be sent to Square to approve access, then brought right back here.'}
            </p>
            <a href="/api/square/oauth/start">
              <Button>Connect Square</Button>
            </a>
          </>
        )}
      </div>
    </div>
  )
}
