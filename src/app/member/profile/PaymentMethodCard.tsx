'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { CreditCard, Trash2 } from 'lucide-react'

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<{
        card: () => Promise<{
          attach: (selector: string) => Promise<void>
          tokenize: () => Promise<{ status: string; token?: string; errors?: { message: string }[] }>
          destroy: () => Promise<void>
        }>
      }>
    }
  }
}

const SQUARE_APP_ID = process.env.NEXT_PUBLIC_SQUARE_APP_ID ?? ''
const SQUARE_LOCATION_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? ''
const isSandbox = SQUARE_APP_ID.startsWith('sandbox-')
const SQUARE_SCRIPT_URL = isSandbox
  ? 'https://sandbox.web.squarecdn.com/v1/square.js'
  : 'https://web.squarecdn.com/v1/square.js'

export function PaymentMethodCard({ hasCard: initialHasCard }: { hasCard: boolean }) {
  const searchParams = useSearchParams()
  const autoOpen = searchParams.get('card') === '1'

  const [hasCard, setHasCard] = useState(initialHasCard)
  const [showForm, setShowForm] = useState(!initialHasCard || autoOpen)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const cardRef = useRef<Awaited<ReturnType<Awaited<ReturnType<NonNullable<Window['Square']>['payments']>>['card']>> | null>(null)
  const cardMounted = useRef(false)

  useEffect(() => {
    if (!showForm || !SQUARE_APP_ID || !SQUARE_LOCATION_ID) return
    let cancelled = false

    async function mountCard() {
      if (cardMounted.current) return
      if (!window.Square) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = SQUARE_SCRIPT_URL
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load Square'))
          document.head.appendChild(script)
        })
      }
      if (cancelled || !window.Square) return
      try {
        const payments = await window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID)
        const card = await payments.card()
        await card.attach('#profile-card-container')
        cardRef.current = card
        cardMounted.current = true
      } catch (err) {
        setError('Could not initialize the card form. Please refresh and try again.')
        console.error(err)
      }
    }
    mountCard()

    return () => {
      cancelled = true
      cardRef.current?.destroy().catch(() => {})
      cardRef.current = null
      cardMounted.current = false
    }
  }, [showForm])

  async function handleSave() {
    if (!cardRef.current) return
    setSaving(true)
    setError(null)
    setSuccess(null)

    const result = await cardRef.current.tokenize()
    if (result.status !== 'OK' || !result.token) {
      setError(result.errors?.map((e) => e.message).join(', ') ?? 'Card tokenization failed.')
      setSaving(false)
      return
    }

    const res = await fetch('/api/square/card-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceId: result.token }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setHasCard(true)
      setShowForm(false)
      setSuccess('Card saved successfully.')
    } else {
      setError(data.error ?? 'Failed to save card.')
    }
    setSaving(false)
  }

  async function handleRemove() {
    if (!confirm('Remove your saved card?')) return
    setRemoving(true)
    setError(null)
    const res = await fetch('/api/square/card-token', { method: 'DELETE' })
    if (res.ok) {
      setHasCard(false)
      setShowForm(true)
      setSuccess('Card removed.')
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to remove card.')
    }
    setRemoving(false)
  }

  const squareConfigured = !!SQUARE_APP_ID && !!SQUARE_LOCATION_ID

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" style={{ color: 'var(--ink-soft)' }} />
          <CardTitle>Payment Method</CardTitle>
        </div>
      </CardHeader>

      {success && <Alert type="success" message={success} className="mb-3" />}
      {error && <Alert type="error" message={error} className="mb-3" />}

      {hasCard && !showForm && (
        <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: 'var(--cream-deep)' }}>
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-stone-400" />
            <span className="text-sm font-medium text-stone-700">Card on file</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="text-xs font-medium text-terracotta hover:text-terracotta-deep"
            >
              Replace
            </button>
            <button
              onClick={handleRemove}
              disabled={removing}
              className="text-xs font-medium text-stone-400 hover:text-red-600 flex items-center gap-1"
              title="Remove card"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {removing ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <>
          {!squareConfigured ? (
            <Alert type="error" message="Card form is not configured. Please contact support." />
          ) : (
            <>
              <p className="text-sm text-stone-500 mb-3">
                {hasCard
                  ? 'Enter a new card to replace the one on file.'
                  : 'Save a card for seamless quarterly billing. Your card is handled by Square — it never touches our servers.'}
              </p>
              <div id="profile-card-container" className="mb-4" />
              <div className="flex gap-2">
                {hasCard && (
                  <Button variant="secondary" onClick={() => { setShowForm(false); setError(null) }}>
                    Cancel
                  </Button>
                )}
                <Button variant="saloon" onClick={handleSave} loading={saving}>
                  {hasCard ? 'Replace Card' : 'Save Card'}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </Card>
  )
}
