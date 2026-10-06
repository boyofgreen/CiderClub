'use client'

import { useRef, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { compressImage } from '@/lib/imageClient'
import { Upload, X } from 'lucide-react'

export const EVENT_TYPES = [
  { value: 'RELEASE_PARTY', label: 'Release Party' },
  { value: 'TASTING', label: 'Tasting' },
  { value: 'FARM_VISIT', label: 'Farm Visit' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'OTHER', label: 'Other' },
]

export type EventFormValues = {
  title: string
  description: string
  eventType: string
  startsAt: string // venue wall clock, "YYYY-MM-DDTHH:mm"
  endsAt: string
  location: string
  isPublic: boolean
  notes: string
  imageUrl: string
  ticketUrl: string
  priceText: string
  soldOut: boolean
  source: string
  sourceUrl: string
}

export const EMPTY_EVENT_FORM: EventFormValues = {
  title: '',
  description: '',
  eventType: 'OTHER',
  startsAt: '',
  endsAt: '',
  location: '',
  isPublic: true,
  notes: '',
  imageUrl: '',
  ticketUrl: '',
  priceText: '',
  soldOut: false,
  source: 'MANUAL',
  sourceUrl: '',
}

const STATUS_TEXT: Record<string, string> = {
  SOLD_OUT: 'The ticket page currently shows this as sold out.',
  AVAILABLE: 'The ticket page currently shows tickets available.',
}

export function EventFormFields({
  form,
  setForm,
  ticketStatus,
}: {
  form: EventFormValues
  setForm: (next: EventFormValues) => void
  /** Last status read from the ticket page, shown as a hint under the checkbox. */
  ticketStatus?: string | null
}) {
  const set = (patch: Partial<EventFormValues>) => setForm({ ...form, ...patch })
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function upload(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('Choose an image file (JPEG or PNG).')
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      const { base64 } = await compressImage(file)
      const res = await fetch('/api/admin/event-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) set({ imageUrl: data.url })
      else setUploadError(data.error ?? 'Upload failed.')
    } catch {
      setUploadError("Couldn't read that image. Try a JPEG or PNG.")
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <Input
        label="Event title"
        value={form.title}
        onChange={(e) => set({ title: e.target.value })}
        placeholder="Spring Release Party"
        required
      />
      <div className="space-y-1">
        <label className="label">Event type</label>
        <select className="input" value={form.eventType} onChange={(e) => set({ eventType: e.target.value })}>
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="label">Description (shown on the website)</label>
        <textarea
          className="input"
          rows={3}
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Join us to taste our newest batch…"
        />
      </div>
      <Input
        label="Location"
        value={form.location}
        onChange={(e) => set({ location: e.target.value })}
        placeholder="Hill Country Cider House, 405 HWY 90 West"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Start time (Texas time)"
          type="datetime-local"
          value={form.startsAt}
          onChange={(e) => set({ startsAt: e.target.value })}
          required
        />
        <Input
          label="End time (optional)"
          type="datetime-local"
          value={form.endsAt}
          onChange={(e) => set({ endsAt: e.target.value })}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <Input
          label="Ticket link (optional)"
          value={form.ticketUrl}
          onChange={(e) => set({ ticketUrl: e.target.value })}
          placeholder="https://ticketscandy.com/e/…"
        />
        <Input
          label="Price"
          value={form.priceText}
          onChange={(e) => set({ priceText: e.target.value })}
          placeholder="$25 / Free"
        />
      </div>
      <div className="space-y-1">
        <label className="label">Event photo (optional)</label>
        {form.imageUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.imageUrl}
              alt=""
              className="h-40 w-full object-cover border"
              style={{ borderColor: 'var(--rule)' }}
            />
            <div className="absolute right-2 top-2 flex gap-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="bg-white/90 px-2 py-1 text-xs font-medium text-stone-700 hover:text-terracotta"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => set({ imageUrl: '' })}
                className="bg-white/90 p-1 text-stone-500 hover:text-terracotta"
                aria-label="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              upload(e.dataTransfer.files[0])
            }}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 border border-dashed py-6 text-sm text-stone-500 hover:text-terracotta disabled:opacity-60"
            style={{ borderColor: 'var(--rule-strong)' }}
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading…' : 'Upload a photo (or drag one here)'}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => upload(e.target.files?.[0])}
        />
        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        {uploading && form.imageUrl && <p className="text-xs text-stone-500">Uploading…</p>}
      </div>
      <Input
        label="Internal notes (admin only)"
        value={form.notes}
        onChange={(e) => set({ notes: e.target.value })}
        placeholder="Setup details, vendor contact, etc."
      />
      {form.ticketUrl && (
        <div>
          <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.soldOut}
              onChange={(e) => set({ soldOut: e.target.checked })}
              className="accent-terracotta"
            />
            Sold out (shows a grayed-out &ldquo;Sold Out&rdquo; button instead of &ldquo;Get Tickets&rdquo;)
          </label>
          {ticketStatus && STATUS_TEXT[ticketStatus] && (
            <p className="mt-1 ml-6 text-xs text-stone-500">
              {STATUS_TEXT[ticketStatus]}
              {ticketStatus === 'SOLD_OUT' && !form.soldOut && ' The website will show it as sold out either way.'}
            </p>
          )}
        </div>
      )}
      <label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isPublic}
          onChange={(e) => set({ isPublic: e.target.checked })}
          className="accent-terracotta"
        />
        Show on the website and in the member portal
      </label>
    </>
  )
}
