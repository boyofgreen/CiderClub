'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Calendar, Plus, X, ChevronRight } from 'lucide-react'

type PickupEvent = {
  id: string; title: string; location: string | null; startsAt: string; endsAt: string
  notes: string | null; isPublic: boolean; quarterId: string
  quarter: { label: string }
  _count: { orders: number; attendances: number }
}
type Quarter = { id: string; label: string }

export default function AdminPickupsPage() {
  const [events, setEvents] = useState<PickupEvent[]>([])
  const [quarters, setQuarters] = useState<Quarter[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    quarterId: '', title: '', location: '', startsAt: '', endsAt: '', notes: '', isPublic: true,
  })

  const refresh = () =>
    fetch('/api/pickups').then((r) => r.json()).then((d) => setEvents(d.events ?? [])).finally(() => setLoading(false))

  useEffect(() => {
    refresh()
    fetch('/api/quarters').then((r) => r.json()).then((d) => setQuarters(d.quarters ?? []))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/pickups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      await refresh()
      setModal(false)
      setForm({ quarterId: '', title: '', location: '', startsAt: '', endsAt: '', notes: '', isPublic: true })
    } else {
      setError(data.error ?? 'Failed to create event')
    }
    setSaving(false)
  }

  const upcoming = events.filter((e) => new Date(e.endsAt) >= new Date())
  const past = events.filter((e) => new Date(e.endsAt) < new Date())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,3vw,30px)', color: 'var(--ink)' }}>
          Pickup Events
        </h1>
        <Button variant="saloon" onClick={() => setModal(true)} size="sm">
          <Plus className="h-4 w-4" /> New Pickup
        </Button>
      </div>

      {loading ? (
        <p className="text-stone-500">Loading…</p>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <p className="smallcaps mb-3" style={{ color: 'var(--ink-soft)' }}>Upcoming</p>
              <div className="space-y-3">
                {upcoming.map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/pickups/${event.id}`}
                    className="flex items-center justify-between border bg-cream-paper p-5 hover:shadow-sm transition"
                    style={{ borderColor: 'var(--rule)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center" style={{ backgroundColor: 'var(--cream-deep)' }}>
                        <Calendar className="h-5 w-5 text-terracotta" />
                      </div>
                      <div>
                        <p className="font-semibold text-stone-900">{event.title}</p>
                        <p className="text-sm text-stone-500">{event.quarter.label} · {formatDateTime(event.startsAt)}</p>
                        {event.location && <p className="text-xs text-stone-400">{event.location}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-xs text-stone-500">
                        <p>{event._count.orders} orders</p>
                        <p>{event._count.attendances} RSVPs</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-stone-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <p className="smallcaps mb-3" style={{ color: 'var(--ink-soft)' }}>Past</p>
              <div className="space-y-2">
                {past.slice(0, 6).map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/pickups/${event.id}`}
                    className="flex items-center justify-between border bg-cream-paper px-5 py-3 opacity-70 hover:opacity-100 transition"
                    style={{ borderColor: 'var(--rule)' }}
                  >
                    <div>
                      <span className="font-medium text-stone-700">{event.title}</span>
                      <span className="ml-2 text-sm text-stone-400">{event.quarter.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-stone-400">{formatDateTime(event.startsAt)}</span>
                      <ChevronRight className="h-4 w-4 text-stone-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div className="border border-dashed p-12 text-center" style={{ borderColor: 'var(--rule-strong)' }}>
              <Calendar className="mx-auto h-10 w-10 text-stone-300 mb-3" />
              <p className="text-stone-500">No pickup events yet.</p>
            </div>
          )}
        </>
      )}

      {/* Create modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-cream-paper p-6 shadow-xl max-h-[90vh] overflow-y-auto" style={{ border: '1px solid var(--rule)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900">New Pickup Event</h3>
              <button onClick={() => setModal(false)}><X className="h-5 w-5 text-stone-400" /></button>
            </div>
            {error && <Alert type="error" message={error} className="mb-3" />}
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <label className="label">Quarter</label>
                <select className="input" value={form.quarterId} onChange={(e) => setForm({ ...form, quarterId: e.target.value })} required>
                  <option value="">Select a quarter…</option>
                  {quarters.map((q) => <option key={q.id} value={q.id}>{q.label}</option>)}
                </select>
              </div>
              <Input label="Event title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Q2 2025 Pickup Day" required />
              <Input label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="123 Cidery Lane, Portland OR" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Start time" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required />
                <Input label="End time" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} required />
              </div>
              <Input label="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} className="accent-terracotta" />
                Show to members
              </label>
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" onClick={() => setModal(false)} className="flex-1" type="button">Cancel</Button>
                <Button variant="saloon" type="submit" loading={saving} className="flex-1">Create Event</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
