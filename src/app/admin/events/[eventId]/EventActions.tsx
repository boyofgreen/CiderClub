'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Edit2, Trash2, X } from 'lucide-react'

const EVENT_TYPES = [
  { value: 'RELEASE_PARTY', label: 'Release Party' },
  { value: 'TASTING', label: 'Tasting' },
  { value: 'FARM_VISIT', label: 'Farm Visit' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'OTHER', label: 'Other' },
]

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
}

function toLocal(iso: string) {
  return new Date(iso).toISOString().slice(0, 16)
}

export function EventActions({ event }: { event: ClubEvent }) {
  const router = useRouter()
  const [editModal, setEditModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: event.title,
    description: event.description ?? '',
    eventType: event.eventType,
    startsAt: toLocal(event.startsAt),
    endsAt: event.endsAt ? toLocal(event.endsAt) : '',
    location: event.location ?? '',
    isPublic: event.isPublic,
    notes: event.notes ?? '',
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
              <Input
                label="Event title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <div className="space-y-1">
                <label className="label">Event type</label>
                <select
                  className="input"
                  value={form.eventType}
                  onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="label">Description (shown to members)</label>
                <textarea
                  className="input"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <Input
                label="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Start time"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  required
                />
                <Input
                  label="End time (optional)"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                />
              </div>
              <Input
                label="Internal notes (admin only)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                  className="accent-terracotta"
                />
                Show to members in their portal
              </label>
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
