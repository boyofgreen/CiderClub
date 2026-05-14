'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Zap, Lock, DollarSign, ChevronDown, Edit2, X, AlertTriangle } from 'lucide-react'

type QuarterData = {
  label: string
  name: string | null
  startsAt: string
  endsAt: string
  pickupStartsAt: string | null
  pickupEndsAt: string | null
}

type OrderStats = {
  total: number
  billed: number
  failed: number
}

function toLocalDatetime(iso: string | null) {
  return iso ? new Date(iso).toISOString().slice(0, 16) : ''
}

export function QuarterActions({
  quarterId,
  status,
  initialData,
  orderStats,
}: {
  quarterId: string
  status: string
  initialData: QuarterData
  orderStats: OrderStats
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [billModal, setBillModal] = useState(false)
  const [billingMethod, setBillingMethod] = useState<'CARD_ON_FILE' | 'PAYMENT_LINK'>('CARD_ON_FILE')
  const [editModal, setEditModal] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const [form, setForm] = useState({
    label: initialData.label,
    name: initialData.name ?? '',
    startsAt: toLocalDatetime(initialData.startsAt),
    endsAt: toLocalDatetime(initialData.endsAt),
    pickupStartsAt: toLocalDatetime(initialData.pickupStartsAt),
    pickupEndsAt: toLocalDatetime(initialData.pickupEndsAt),
  })

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

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const body: Record<string, unknown> = {
      label: form.label,
      name: form.name || null,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      pickupStartsAt: form.pickupStartsAt || null,
      pickupEndsAt: form.pickupEndsAt || null,
    }
    const res = await fetch(`/api/quarters/${quarterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setEditModal(false)
      router.refresh()
    } else {
      setError(data.error ?? 'Failed to save changes')
    }
    setLoading(false)
  }

  async function handleCancel() {
    setCancelling(true)
    setError(null)
    const res = await fetch(`/api/quarters/${quarterId}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setCancelModal(false)
      router.refresh()
    } else {
      setError(data.error ?? 'Failed to cancel quarter')
      setCancelling(false)
    }
  }

  const canGenerate = ['UPCOMING', 'OPEN'].includes(status)
  const canLock = status === 'OPEN'
  const canBill = ['OPEN', 'LOCKED', 'BILLING'].includes(status)
  const canCancel = status !== 'CANCELLED' && status !== 'COMPLETED'
  const hasActions = canGenerate || canLock || canBill || canCancel

  const cancellableOrders = orderStats.total - orderStats.billed - orderStats.failed

  return (
    <div className="relative flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { setError(null); setEditModal(true) }}
        >
          <Edit2 className="h-3.5 w-3.5" /> Edit
        </Button>

        {hasActions && (
          <button
            onClick={() => setOpen(!open)}
            className="btn-primary flex items-center gap-1.5"
          >
            Actions <ChevronDown className="h-4 w-4" />
          </button>
        )}
      </div>

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
          {canCancel && (hasActions && (canGenerate || canLock || canBill)) && (
            <div className="my-1 border-t border-stone-100" />
          )}
          {canCancel && (
            <button
              onClick={() => { setOpen(false); setCancelModal(true) }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <AlertTriangle className="h-4 w-4" /> Cancel Quarter
            </button>
          )}
        </div>
      )}

      {result && <Alert type="success" message={result} className="max-w-xs" />}
      {error && !editModal && !billModal && <Alert type="error" message={error} className="max-w-xs" />}

      {/* Edit modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-cream-paper p-6 shadow-xl max-h-[90vh] overflow-y-auto" style={{ border: '1px solid var(--rule)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900">Edit Quarter</h3>
              <button onClick={() => setEditModal(false)}><X className="h-5 w-5 text-stone-400" /></button>
            </div>
            {error && <Alert type="error" message={error} className="mb-3" />}
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Label (e.g. Q1 2025)"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  required
                />
                <Input
                  label="Name (optional)"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Spring Harvest"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Customization opens"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  required
                />
                <Input
                  label="Customization closes"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Pickup window opens"
                  type="datetime-local"
                  value={form.pickupStartsAt}
                  onChange={(e) => setForm({ ...form, pickupStartsAt: e.target.value })}
                />
                <Input
                  label="Pickup window closes"
                  type="datetime-local"
                  value={form.pickupEndsAt}
                  onChange={(e) => setForm({ ...form, pickupEndsAt: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" onClick={() => setEditModal(false)} className="flex-1" type="button">
                  Cancel
                </Button>
                <Button variant="saloon" type="submit" loading={loading} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
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

      {/* Cancel quarter confirmation */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-cream-paper p-6 shadow-xl" style={{ border: '1px solid var(--rule)' }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <h3 className="font-bold text-stone-900">Cancel Quarter?</h3>
            </div>
            {orderStats.billed + orderStats.failed > 0 ? (
              <Alert
                type="error"
                message={`Cannot cancel: ${orderStats.billed + orderStats.failed} order(s) have already been billed or had payment attempted.`}
                className="mb-4"
              />
            ) : (
              <>
                <p className="text-sm text-stone-600 mb-2">
                  This quarter will be marked as <strong>Cancelled</strong>.
                </p>
                {cancellableOrders > 0 && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-4">
                    {cancellableOrders} open order{cancellableOrders !== 1 ? 's' : ''} will be cancelled.
                  </p>
                )}
                {cancellableOrders === 0 && (
                  <p className="text-sm text-stone-500 mb-4">No orders will be affected.</p>
                )}
              </>
            )}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setCancelModal(false)} className="flex-1">
                Go Back
              </Button>
              {orderStats.billed + orderStats.failed === 0 && (
                <Button
                  onClick={handleCancel}
                  loading={cancelling}
                  className="flex-1 bg-red-600 text-white hover:bg-red-700"
                >
                  Cancel Quarter
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
