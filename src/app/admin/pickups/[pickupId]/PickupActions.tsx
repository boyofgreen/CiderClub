'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Edit2, Trash2, X } from 'lucide-react'

type PickupEvent = {
  id: string
  title: string
  location: string | null
  startsAt: string
  endsAt: string
  notes: string | null
  isPublic: boolean
  orderCount: number
}

function toLocalDatetime(iso: string) {
  return new Date(iso).toISOString().slice(0, 16)
}

export function PickupActions({ event }: { event: PickupEvent }) {
  const router = useRouter()
  const [editModal, setEditModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: event.title,
    location: event.location ?? '',
    startsAt: toLocalDatetime(event.startsAt),
    endsAt: toLocalDatetime(event.endsAt),
    notes: event.notes ?? '',
    isPublic: event.isPublic,
  })

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/pickups/${event.id}`, {
      method: 'PATCH',
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
    setError(null)
    const res = await fetch(`/api/pickups/${event.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      router.push('/admin/pickups')
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
              <h3 className="font-bold text-stone-900">Edit Pickup Event</h3>
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
                  label="End time"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  required
                />
              </div>
              <Input
                label="Notes (optional)"
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
                Show to members
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

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-cream-paper p-6 shadow-xl" style={{ border: '1px solid var(--rule)' }}>
            <h3 className="font-bold text-stone-900 mb-2">Delete Pickup Event?</h3>
            <p className="text-sm text-stone-600 mb-1">
              This will permanently delete <strong>{event.title}</strong>.
            </p>
            {event.orderCount > 0 && (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-4">
                {event.orderCount} order{event.orderCount !== 1 ? 's' : ''} assigned to this event will be
                unlinked but not deleted.
              </p>
            )}
            {!event.orderCount && <p className="text-sm text-stone-500 mb-4">This action cannot be undone.</p>}
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
