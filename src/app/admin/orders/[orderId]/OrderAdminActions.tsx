'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { DollarSign, Package, ChevronDown, ExternalLink, AlertTriangle, Ban } from 'lucide-react'

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
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const canBill = !['BILLED', 'CANCELLED'].includes(status)
  const canMarkPickup = ['LOCKED', 'AWAITING_PICKUP', 'BILLED'].includes(status)
  const canCancel = status !== 'CANCELLED'
  const wasBilled = status === 'BILLED'

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

  async function cancelOrder() {
    setCancelling(true)
    setError(null)
    const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setCancelModal(false)
      setResult('Order cancelled.')
      router.refresh()
    } else {
      setError(data.error ?? 'Failed to cancel order')
    }
    setCancelling(false)
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
          <div className="absolute right-0 top-full mt-1 z-20 w-56 border bg-cream-paper shadow-lg py-1" style={{ borderColor: 'var(--rule)' }}>
            {canBill && (
              <>
                {memberHasCard && (
                  <button
                    onClick={() => bill('CARD_ON_FILE')}
                    disabled={loading}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-cream-deep"
                  >
                    <DollarSign className="h-4 w-4 text-green-500" /> Charge Card on File
                  </button>
                )}
                <button
                  onClick={() => bill('PAYMENT_LINK')}
                  disabled={loading}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-cream-deep"
                >
                  <ExternalLink className="h-4 w-4 text-blue-500" /> Send Payment Link
                </button>
                <button
                  onClick={() => bill('IN_PERSON')}
                  disabled={loading}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-cream-deep"
                >
                  <DollarSign className="h-4 w-4 text-amber-500" /> Mark Paid (In Person)
                </button>
              </>
            )}
            {canMarkPickup && (
              <button
                onClick={markPickedUp}
                disabled={loading}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-cream-deep"
              >
                <Package className="h-4 w-4 text-terracotta" /> Mark Picked Up
              </button>
            )}
            {canCancel && (canBill || canMarkPickup) && (
              <div className="my-1 border-t border-stone-100" />
            )}
            {canCancel && (
              <button
                onClick={() => { setOpen(false); setCancelModal(true); setError(null) }}
                disabled={loading}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
              >
                <Ban className="h-4 w-4" /> Cancel Order
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
          className="text-xs text-terracotta hover:text-terracotta-deep underline"
        >
          View payment link →
        </a>
      )}
      {result && <Alert type="success" message={result} className="max-w-xs text-xs" />}
      {error && !cancelModal && <Alert type="error" message={error} className="max-w-xs text-xs" />}

      {/* Cancel confirmation modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-cream-paper p-6 shadow-xl" style={{ border: '1px solid var(--rule)' }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <h3 className="font-bold text-stone-900">Cancel this order?</h3>
            </div>
            <p className="text-sm text-stone-600 mb-3">
              The order will be marked as <strong>Cancelled</strong>. The member's record is preserved.
            </p>
            {wasBilled && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-4">
                <strong>This order has been billed.</strong> Cancelling here only updates the order
                status — it does <em>not</em> refund the payment. Issue any refund directly in Square.
              </p>
            )}
            {error && <Alert type="error" message={error} className="mb-3 text-xs" />}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setCancelModal(false)} className="flex-1">
                Go Back
              </Button>
              <Button
                onClick={cancelOrder}
                loading={cancelling}
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
              >
                Cancel Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
