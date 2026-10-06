'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatEventDateTime } from '@/lib/eventTime'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { PartyPopper, Plus, X, ChevronRight, Ticket } from 'lucide-react'
import {
  EVENT_TYPES,
  EMPTY_EVENT_FORM,
  EventFormFields,
  type EventFormValues,
} from '@/components/admin/EventFormFields'
import { ImportPanel } from './ImportPanel'

type ClubEvent = {
  id: string
  title: string
  description: string | null
  eventType: string
  startsAt: string
  endsAt: string | null
  location: string | null
  isPublic: boolean
  ticketUrl: string | null
  source: string
  soldOut: boolean
  ticketStatus: string | null
}

const SOURCE_LABELS: Record<string, string> = { LINK: 'Imported from link', AI: 'Read from screenshot' }

export default function AdminEventsPage() {
  const [events, setEvents] = useState<ClubEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<EventFormValues>(EMPTY_EVENT_FORM)

  const refresh = () =>
    fetch('/api/admin/events')
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .finally(() => setLoading(false))

  useEffect(() => { refresh() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      await refresh()
      setModal(false)
      setForm(EMPTY_EVENT_FORM)
    } else {
      setError(data.error ?? 'Failed to create event')
    }
    setSaving(false)
  }

  const now = new Date()
  const upcoming = events.filter((e) => new Date(e.startsAt) >= now)
  const past = events.filter((e) => new Date(e.startsAt) < now)

  const typeLabel = (t: string) => EVENT_TYPES.find((x) => x.value === t)?.label ?? t

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,3vw,30px)', color: 'var(--ink)' }}>
          Club Events
        </h1>
        <Button variant="saloon" onClick={() => { setForm(EMPTY_EVENT_FORM); setError(null); setModal(true) }} size="sm">
          <Plus className="h-4 w-4" /> New Event
        </Button>
      </div>

      <ImportPanel
        onDraft={(draft) => {
          setForm({ ...EMPTY_EVENT_FORM, ...draft })
          setError(null)
          setModal(true)
        }}
      />

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
                    href={`/admin/events/${event.id}`}
                    className="flex items-center justify-between border bg-cream-paper p-5 hover:shadow-sm transition"
                    style={{ borderColor: 'var(--rule)' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center" style={{ backgroundColor: 'var(--cream-deep)' }}>
                        <PartyPopper className="h-5 w-5 text-terracotta" />
                      </div>
                      <div>
                        <p className="font-semibold text-stone-900">{event.title}</p>
                        <p className="text-sm text-stone-500">{typeLabel(event.eventType)} · {formatEventDateTime(event.startsAt)}</p>
                        {event.location && <p className="text-xs text-stone-400">{event.location}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {event.ticketUrl && (event.soldOut || event.ticketStatus === 'SOLD_OUT') ? (
                        <span className="text-xs font-semibold uppercase tracking-wide text-red-700">Sold out</span>
                      ) : event.ticketUrl ? (
                        <span className="flex items-center gap-1 text-xs text-stone-500"><Ticket className="h-3.5 w-3.5" /> Ticketed</span>
                      ) : null}
                      {!event.isPublic && (
                        <span className="text-xs text-stone-400 italic">hidden</span>
                      )}
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
                {past.slice(0, 10).map((event) => (
                  <Link
                    key={event.id}
                    href={`/admin/events/${event.id}`}
                    className="flex items-center justify-between border bg-cream-paper px-5 py-3 opacity-70 hover:opacity-100 transition"
                    style={{ borderColor: 'var(--rule)' }}
                  >
                    <div>
                      <span className="font-medium text-stone-700">{event.title}</span>
                      <span className="ml-2 text-sm text-stone-400">{typeLabel(event.eventType)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-stone-400">{formatEventDateTime(event.startsAt)}</span>
                      <ChevronRight className="h-4 w-4 text-stone-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div className="border border-dashed p-12 text-center" style={{ borderColor: 'var(--rule-strong)' }}>
              <PartyPopper className="mx-auto h-10 w-10 text-stone-300 mb-3" />
              <p className="text-stone-500">No club events yet.</p>
              <p className="text-xs text-stone-400 mt-1">Create release parties, tastings, farm visits, and more.</p>
            </div>
          )}
        </>
      )}

      {/* Create modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-cream-paper p-6 shadow-xl max-h-[90vh] overflow-y-auto" style={{ border: '1px solid var(--rule)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900">{form.source === 'MANUAL' ? 'New Club Event' : 'Review Imported Event'}</h3>
              <button onClick={() => setModal(false)}><X className="h-5 w-5 text-stone-400" /></button>
            </div>
            {error && <Alert type="error" message={error} className="mb-3" />}
            <form onSubmit={handleCreate} className="space-y-3">
              {form.source !== 'MANUAL' && (
                <Alert
                  type="info"
                  message={`${SOURCE_LABELS[form.source] ?? 'Imported'} — check the details below, especially the date and time, before saving.`}
                />
              )}
              <EventFormFields form={form} setForm={setForm} />
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" onClick={() => setModal(false)} className="flex-1" type="button">
                  Cancel
                </Button>
                <Button variant="saloon" type="submit" loading={saving} className="flex-1">
                  Create Event
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
