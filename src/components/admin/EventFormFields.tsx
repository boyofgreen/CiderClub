'use client'

import { Input } from '@/components/ui/Input'

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
  source: 'MANUAL',
  sourceUrl: '',
}

export function EventFormFields({
  form,
  setForm,
}: {
  form: EventFormValues
  setForm: (next: EventFormValues) => void
}) {
  const set = (patch: Partial<EventFormValues>) => setForm({ ...form, ...patch })

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
      <Input
        label="Image URL (optional)"
        value={form.imageUrl}
        onChange={(e) => set({ imageUrl: e.target.value })}
        placeholder="https://…"
      />
      {form.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={form.imageUrl}
          alt=""
          className="h-28 w-full object-cover border"
          style={{ borderColor: 'var(--rule)' }}
        />
      )}
      <Input
        label="Internal notes (admin only)"
        value={form.notes}
        onChange={(e) => set({ notes: e.target.value })}
        placeholder="Setup details, vendor contact, etc."
      />
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
