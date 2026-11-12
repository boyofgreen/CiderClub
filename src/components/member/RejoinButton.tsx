'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/** Lets a legacy member switch back to a full membership on the tier they left. */
export function RejoinButton({ planName, onRejoined }: { planName: string; onRejoined?: () => void }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function rejoin() {
    if (!window.confirm(
      `Rejoin the club as a ${planName} member? Your quarterly orders start again with the next release, ` +
      'and your card on file is charged each quarter.'
    )) return
    setBusy(true)
    setError(null)
    const res = await fetch('/api/members/me/rejoin', { method: 'POST' })
    if (res.ok) {
      if (onRejoined) onRejoined()
      else router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Something went wrong. Please try again.')
    }
    setBusy(false)
  }

  return (
    <span>
      <button
        onClick={rejoin}
        disabled={busy}
        className="btn-saloon disabled:opacity-60"
        style={{ fontSize: 10, padding: '10px 18px' }}
      >
        {busy ? 'Switching…' : 'Rejoin the Club'}
      </button>
      {error && <span className="ml-3 text-xs text-red-600">{error}</span>}
    </span>
  )
}
