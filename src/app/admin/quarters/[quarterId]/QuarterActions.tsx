'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Zap, Lock, DollarSign, ChevronDown } from 'lucide-react'

export function QuarterActions({
  quarterId,
  status,
}: {
  quarterId: string
  status: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [billModal, setBillModal] = useState(false)
  const [billingMethod, setBillingMethod] = useState<'CARD_ON_FILE' | 'PAYMENT_LINK'>('CARD_ON_FILE')

  async function generateOrders() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/quarters/${quarterId}/generate-orders`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setResult(`Created ${data.created} orders, sent ${data.emailsSent} emails. ${data.skipped} skipped.`)
      router.refresh()
    } else {
      setError(data.error ?? 'Failed to generate orders')
    }
    setLoading(false)
    setOpen(false)
  }

  async function lockOrders() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/quarters/${quarterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'LOCK' }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setResult(`Locked ${data.locked} orders.`)
      router.refresh()
    } else {
      setError(data.error ?? 'Failed to lock')
    }
    setLoading(false)
    setOpen(false)
  }

  async function billQuarter() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/quarters/${quarterId}/bill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: billingMethod }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setResult(`Billing complete: ${data.success} succeeded, ${data.failed} failed.`)
      router.refresh()
    } else {
      setError(data.error ?? 'Billing failed')
    }
    setLoading(false)
    setBillModal(false)
  }

  const canGenerate = ['UPCOMING', 'OPEN'].includes(status)
  const canLock = status === 'OPEN'
  const canBill = ['OPEN', 'LOCKED', 'BILLING'].includes(status)
  const hasActions = canGenerate || canLock || canBill

  return (
    <div className="relative flex flex-col items-end gap-2">
      {hasActions && (
        <button
          onClick={() => setOpen(!open)}
          className="btn-primary flex items-center gap-1.5"
        >
          Actions <ChevronDown className="h-4 w-4" />
        </button>
      )}

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-60 border bg-cream-paper shadow-lg py-1" style={{ borderColor: 'var(--rule)' }}>
          {canGenerate && (
            <button
              onClick={generateOrders}
              disabled={loading}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-cream-deep"
            >
              <Zap className="h-4 w-4 text-terracotta" /> Generate Orders
            </button>
          )}
          {canLock && (
            <button
              onClick={lockOrders}
              disabled={loading}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-cream-deep"
            >
              <Lock className="h-4 w-4 text-purple-500" /> Lock Quarter
            </button>
          )}
          {canBill && (
            <button
              onClick={() => { setBillModal(true); setOpen(false) }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-cream-deep"
            >
              <DollarSign className="h-4 w-4 text-green-500" /> Bill Quarter
            </button>
          )}
        </div>
      )}

      {result && (
        <Alert type="success" message={result} className="max-w-xs" />
      )}
      {error && (
        <Alert type="error" message={error} className="max-w-xs" />
      )}

      {/* Billing method modal */}
      {billModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-cream-paper p-6 shadow-xl">
            <h3 className="font-bold text-stone-900 mb-4">Bill Quarter</h3>
            <div className="space-y-2 mb-4">
              {(['CARD_ON_FILE', 'PAYMENT_LINK'] as const).map((m) => (
                <label key={m} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                  billingMethod === m ? 'border-terracotta' : 'border-stone-200'
                }`} style={billingMethod === m ? { backgroundColor: 'var(--cream-deep)' } : {}}>
                  <input
                    type="radio"
                    value={m}
                    checked={billingMethod === m}
                    onChange={() => setBillingMethod(m)}
                    className="accent-terracotta"
                  />
                  <div>
                    <p className="font-medium text-sm text-stone-800">
                      {m === 'CARD_ON_FILE' ? 'Charge Card on File' : 'Send Payment Links'}
                    </p>
                    <p className="text-xs text-stone-500">
                      {m === 'CARD_ON_FILE'
                        ? 'Charges saved Square cards automatically'
                        : 'Emails each member a Square payment link'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setBillModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={billQuarter} loading={loading} className="flex-1">
                Bill Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
