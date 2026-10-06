'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Edit2, Trash2, X } from 'lucide-react'
import { dateToWallClock } from '@/lib/eventTime'
import { EventFormFields, type EventFormValues } from '@/components/admin/EventFormFields'

type ClubEvent = {
  id: string
  title: string
  description: string | null
  eventType: string
  startsAt: string
  endsAt: string | null
  location: string | null
  isPublic: boolean
  notes: string | null
  imageUrl: string | null
  ticketUrl: string | null
  priceText: string | null
  source: string
  sourceUrl: string | null
}

export function EventActions({ event }: { event: ClubEvent }) {
  const router = useRouter()
  const [editModal, setEditModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<EventFormValues>({
    title: event.title,
    description: event.description ?? '',
    eventType: event.eventType,
    startsAt: dateToWallClock(event.startsAt),
    endsAt: event.endsAt ? dateToWallClock(event.endsAt) : '',
    location: event.location ?? '',
    isPublic: event.isPublic,
    notes: event.notes ?? '',
    imageUrl: event.imageUrl ?? '',
    ticketUrl: event.ticketUrl ?? '',
    priceText: event.priceText ?? '',
    source: event.source,
    sourceUrl: event.sourceUrl ?? '',
  })


  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/admin/events/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setEditModal(false)
      router.refresh()
    } else {
      setError(data.error ?? 'Failed to save changes')
    }
    setSaving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    const res = await fetch(`/api/admin/events/${event.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      router.push('/admin/events')
    } else {
      setError(data.error ?? 'Failed to delete event')
      setDeleting(false)
      setDeleteModal(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => { setError(null); setEditModal(true) }}>
          <Edit2 className="h-3.5 w-3.5" /> Edit
        </Button>
        <Button
          size="sm"
          onClick={() => { setError(null); setDeleteModal(true) }}
          className="border border-red-200 bg-white text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>

      {error && !editModal && !deleteModal && (
        <Alert type="error" message={error} className="mt-2" />
      )}

      {/* Edit modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-cream-paper p-6 shadow-xl max-h-[90vh] overflow-y-auto" style={{ border: '1px solid var(--rule)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900">Edit Club Event</h3>
              <button onClick={() => setEditModal(false)}><X className="h-5 w-5 text-stone-400" /></button>
            </div>
            {error && <Alert type="error" message={error} className="mb-3" />}
            <form onSubmit={handleEdit} className="space-y-3">
              <EventFormFields form={form} setForm={setForm} />
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" onClick={() => setEditModal(false)} className="flex-1" type="button">
                  Cancel
                </Button>
                <Button variant="saloon" type="submit" loading={saving} className="flex-1">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-cream-paper p-6 shadow-xl" style={{ border: '1px solid var(--rule)' }}>
            <h3 className="font-bold text-stone-900 mb-2">Delete this event?</h3>
            <p className="text-sm text-stone-600 mb-4">
              <strong>{event.title}</strong> will be permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setDeleteModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                loading={deleting}
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
