'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ArrowLeft } from 'lucide-react'
import { getCurrentQuarterLabel, nextQuarterLabel } from '@/lib/quarter'

export default function NewQuarterPage() {
  const router = useRouter()
  const nextQ = nextQuarterLabel(getCurrentQuarterLabel())
  const [form, setForm] = useState({
    label: nextQ,
    name: '',
    startsAt: '',
    endsAt: '',
    pickupStartsAt: '',
    pickupEndsAt: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const [year, q] = form.label.split('-Q').map(Number)
    if (!form.label.match(/^\d{4}-Q[1-4]$/)) {
      setError('Label must be in YYYY-Q# format (e.g. "2026-Q3").')
      return
    }
    if (!form.startsAt || !form.endsAt) {
      setError('Customization window open and close dates are required.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/quarters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, year, quarter: q }),
    })

    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      router.push(`/admin/quarters/${data.quarter.id}`)
    } else {
      setError(data.error ?? 'Failed to create quarter.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/quarters" className="text-stone-500 hover:text-stone-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(20px,3vw,28px)', color: 'var(--ink)' }}>New Quarter</h1>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="border bg-cream-paper p-6 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Quarter label"
              value={form.label}
              onChange={(e) => update('label', e.target.value)}
              placeholder="2025-Q2"
              required
              hint='Format: YYYY-Q# (e.g. "2025-Q2")'
            />
            <Input
              label="Friendly name (optional)"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Summer 2025"
            />
          </div>

          <div className="border-t border-stone-100 pt-4">
            <p className="text-sm font-medium text-stone-700 mb-3">Customization Window</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Opens"
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => update('startsAt', e.target.value)}
                required
              />
              <Input
                label="Closes"
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => update('endsAt', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="border-t border-stone-100 pt-4">
            <p className="text-sm font-medium text-stone-700 mb-3">Pickup Window (optional)</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Pickup opens"
                type="datetime-local"
                value={form.pickupStartsAt}
                onChange={(e) => update('pickupStartsAt', e.target.value)}
              />
              <Input
                label="Pickup closes / auto-bill date"
                type="datetime-local"
                value={form.pickupEndsAt}
                onChange={(e) => update('pickupEndsAt', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} className="flex-1">
              Create Quarter
            </Button>
            <Link href="/admin/quarters" className="btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
