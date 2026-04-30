'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Input, Select } from '@/components/ui/Input'
import { Pause, UserX, UserCheck, RefreshCw, ChevronDown } from 'lucide-react'

export function MemberActions({
  memberId,
  status,
  squareCustomerId,
}: {
  memberId: string
  status: string
  squareCustomerId: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<'PAUSE' | 'CANCEL' | 'REACTIVATE' | null>(null)
  const [pauseUntil, setPauseUntil] = useState('')
  const [cancelReason, setCancelReason] = useState('')

  async function handleAction() {
    if (!action) return
    setLoading(true)
    setError(null)
    const body: Record<string, string> = { action }
    if (action === 'PAUSE' && pauseUntil) body.pausedUntilQuarter = pauseUntil
    if (action === 'CANCEL' && cancelReason) body.cancellationReason = cancelReason

    const res = await fetch(`/api/members/${memberId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setOpen(false)
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Action failed')
    }
    setLoading(false)
  }

  async function handleSquareSync() {
    setLoading(true)
    await fetch(`/api/members/${memberId}/square-sync`, { method: 'POST' })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-secondary flex items-center gap-1.5"
      >
        Actions <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-56 border bg-cream-paper shadow-lg py-1" style={{ borderColor: 'var(--rule)' }}>
          {status !== 'PAUSED' && status !== 'CANCELLED' && (
            <button
              onClick={() => { setAction('PAUSE'); setOpen(false) }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-cream-deep"
            >
              <Pause className="h-4 w-4 text-yellow-500" /> Pause Membership
            </button>
          )}
          {status !== 'CANCELLED' && (
            <button
              onClick={() => { setAction('CANCEL'); setOpen(false) }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-cream-deep"
            >
              <UserX className="h-4 w-4 text-red-500" /> Cancel Membership
            </button>
          )}
          {(status === 'PAUSED' || status === 'CANCELLED') && (
            <button
              onClick={() => { setAction('REACTIVATE'); setOpen(false) }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-cream-deep"
            >
              <UserCheck className="h-4 w-4 text-green-500" /> Reactivate
            </button>
          )}
          <button
            onClick={() => { handleSquareSync(); setOpen(false) }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-cream-deep"
          >
            <RefreshCw className="h-4 w-4 text-blue-500" /> Sync to Square
          </button>
        </div>
      )}

      {/* Confirmation modal */}
      {action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-cream-paper p-6 shadow-xl">
            <h3 className="font-bold text-stone-900 mb-3">
              {action === 'PAUSE' ? 'Pause Membership' :
               action === 'CANCEL' ? 'Cancel Membership' :
               'Reactivate Membership'}
            </h3>

            {error && <Alert type="error" message={error} className="mb-3" />}

            {action === 'PAUSE' && (
              <Input
                label="Pause until quarter (optional)"
                placeholder="e.g. 2025-Q3"
                value={pauseUntil}
                onChange={(e) => setPauseUntil(e.target.value)}
                hint="Leave blank to pause indefinitely"
              />
            )}
            {action === 'CANCEL' && (
              <Input
                label="Cancellation reason (optional)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            )}
            {action === 'REACTIVATE' && (
              <p className="text-sm text-stone-600 mb-4">
                This will reactivate the membership and clear the pause/cancellation.
              </p>
            )}

            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setAction(null)}>Cancel</Button>
              <Button
                variant={action === 'CANCEL' ? 'danger' : 'primary'}
                onClick={handleAction}
                loading={loading}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
