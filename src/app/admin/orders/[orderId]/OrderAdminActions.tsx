'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { DollarSign, Package, ChevronDown, ExternalLink } from 'lucide-react'

export function OrderAdminActions({
  orderId,
  status,
  memberHasCard,
  paymentLinkUrl,
}: {
  orderId: string
  status: string
  memberHasCard: boolean
  paymentLinkUrl: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const canBill = !['BILLED', 'CANCELLED'].includes(status)
  const canMarkPickup = ['LOCKED', 'AWAITING_PICKUP', 'BILLED'].includes(status)

  async function bill(method: 'CARD_ON_FILE' | 'PAYMENT_LINK' | 'IN_PERSON') {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/orders/${orderId}/bill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.success !== false) {
      setResult(data.paymentLinkUrl ? `Payment link created` : 'Billed successfully!')
      router.refresh()
    } else {
      setError(data.error ?? 'Billing failed')
    }
    setLoading(false)
    setOpen(false)
  }

  async function markPickedUp() {
    setLoading(true)
    const res = await fetch(`/api/orders/${orderId}/pickup`, { method: 'POST' })
    if (res.ok) router.refresh()
    else setError('Failed to mark pickup')
    setLoading(false)
    setOpen(false)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="btn-secondary flex items-center gap-1.5"
        >
          Actions <ChevronDown className="h-4 w-4" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-xl border border-stone-200 bg-white shadow-lg py-1">
            {canBill && (
              <>
                {memberHasCard && (
                  <button
                    onClick={() => bill('CARD_ON_FILE')}
                    disabled={loading}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                  >
                    <DollarSign className="h-4 w-4 text-green-500" /> Charge Card on File
                  </button>
                )}
                <button
                  onClick={() => bill('PAYMENT_LINK')}
                  disabled={loading}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                >
                  <ExternalLink className="h-4 w-4 text-blue-500" /> Send Payment Link
                </button>
                <button
                  onClick={() => bill('IN_PERSON')}
                  disabled={loading}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                >
                  <DollarSign className="h-4 w-4 text-amber-500" /> Mark Paid (In Person)
                </button>
              </>
            )}
            {canMarkPickup && (
              <button
                onClick={markPickedUp}
                disabled={loading}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
              >
                <Package className="h-4 w-4 text-brand-500" /> Mark Picked Up
              </button>
            )}
          </div>
        )}
      </div>

      {paymentLinkUrl && (
        <a
          href={paymentLinkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-brand-600 hover:text-brand-700 underline"
        >
          View payment link →
        </a>
      )}
      {result && <Alert type="success" message={result} className="max-w-xs text-xs" />}
      {error && <Alert type="error" message={error} className="max-w-xs text-xs" />}
    </div>
  )
}
