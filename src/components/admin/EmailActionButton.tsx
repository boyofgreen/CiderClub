'use client'

import { useState } from 'react'
import { Send, Check } from 'lucide-react'

interface Props {
  endpoint: string
  label: string
  confirm: string
  /** Builds the success message from the API's `sent` count */
  successText?: (sent: number) => string
}

/** Small admin button that POSTs to an email-sending endpoint and reports the result. */
export function EmailActionButton({ endpoint, label, confirm, successText }: Props) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    if (!window.confirm(confirm)) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const r = await fetch(endpoint, { method: 'POST' })
      const d = await r.json().catch(() => ({}))
      if (r.ok) {
        const sent = typeof d.sent === 'number' ? d.sent : 0
        setResult(successText ? successText(sent) : `Sent ${sent} email${sent !== 1 ? 's' : ''}.`)
      } else {
        setError(d.error ?? 'Failed to send.')
      }
    } catch (e) {
      setError(String(e))
    }
    setBusy(false)
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        onClick={run}
        disabled={busy}
        className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 disabled:opacity-50"
      >
        {result ? <Check className="h-3 w-3" /> : <Send className="h-3 w-3" />}
        {busy ? 'Sending…' : label}
      </button>
      {result && <span className="text-[11px] text-green-600">{result}</span>}
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  )
}
