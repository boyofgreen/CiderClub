'use client'

import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'
import { Alert } from '@/components/ui/Alert'
import { UserPlus, Mail, Phone, Check, Undo2, Trash2 } from 'lucide-react'

type Lead = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  planName: string | null
  status: string // NEW | FOLLOWED_UP | CONVERTED | DISMISSED
  followedUpAt: string | null
  notes: string | null
  createdAt: string
}

const FILTERS = [
  { key: 'OPEN', label: 'Needs Follow-up' },
  { key: 'FOLLOWED_UP', label: 'Followed Up' },
  { key: 'CONVERTED', label: 'Converted' },
  { key: 'ALL', label: 'All' },
]

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-amber-100 text-amber-800',
  FOLLOWED_UP: 'bg-blue-100 text-blue-700',
  CONVERTED: 'bg-green-100 text-green-700',
  DISMISSED: 'bg-stone-100 text-stone-500',
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  FOLLOWED_UP: 'Followed up',
  CONVERTED: 'Converted',
  DISMISSED: 'Dismissed',
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('OPEN')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const refresh = () =>
    fetch('/api/admin/leads')
      .then((r) => r.json())
      .then((d) => setLeads(d.leads ?? []))
      .finally(() => setLoading(false))

  useEffect(() => { refresh() }, [])

  async function setStatus(lead: Lead, status: string) {
    setBusy(lead.id)
    setError(null)
    const res = await fetch(`/api/admin/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) await refresh()
    else setError('Failed to update lead.')
    setBusy(null)
  }

  async function removeLead(lead: Lead) {
    if (!window.confirm(`Delete lead ${lead.email}? This cannot be undone.`)) return
    setBusy(lead.id)
    const res = await fetch(`/api/admin/leads/${lead.id}`, { method: 'DELETE' })
    if (res.ok) await refresh()
    else setError('Failed to delete lead.')
    setBusy(null)
  }

  const filtered = leads.filter((l) => {
    if (filter === 'ALL') return true
    if (filter === 'OPEN') return l.status === 'NEW'
    return l.status === filter
  })

  const openCount = leads.filter((l) => l.status === 'NEW').length

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,3vw,30px)', color: 'var(--ink)' }}>
          Leads
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Folks who started signing up but didn't finish. Reach out and see if they'd like to join.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 border-b" style={{ borderColor: 'var(--rule)' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 text-xs font-semibold tracking-wide -mb-px border-b-2 transition ${
              filter === f.key
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            {f.label}
            {f.key === 'OPEN' && openCount > 0 && (
              <span className="ml-1.5 bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[10px] font-bold">
                {openCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-stone-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed p-12 text-center" style={{ borderColor: 'var(--rule-strong)' }}>
          <UserPlus className="mx-auto h-10 w-10 text-stone-300 mb-3" />
          <p className="text-stone-500">
            {filter === 'OPEN' ? 'No leads waiting on follow-up. Nice work!' : 'No leads here yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => {
            const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || '—'
            return (
              <div
                key={lead.id}
                className="flex flex-wrap items-center justify-between gap-3 border bg-cream-paper px-4 py-3"
                style={{ borderColor: 'var(--rule)' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-stone-900">{name}</p>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[lead.status] ?? ''}`}>
                      {STATUS_LABELS[lead.status] ?? lead.status}
                    </span>
                    {lead.planName && (
                      <span className="bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">
                        interested in {lead.planName}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-4 text-xs text-stone-500">
                    <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-terracotta">
                      <Mail className="h-3 w-3" />{lead.email}
                    </a>
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-terracotta">
                        <Phone className="h-3 w-3" />{lead.phone}
                      </a>
                    )}
                    <span>started {formatDate(lead.createdAt)}</span>
                    {lead.followedUpAt && <span>followed up {formatDate(lead.followedUpAt)}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {lead.status === 'NEW' && (
                    <button
                      onClick={() => setStatus(lead, 'FOLLOWED_UP')}
                      disabled={busy === lead.id}
                      className="flex items-center gap-1.5 border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" /> Mark followed up
                    </button>
                  )}
                  {lead.status === 'FOLLOWED_UP' && (
                    <button
                      onClick={() => setStatus(lead, 'NEW')}
                      disabled={busy === lead.id}
                      className="flex items-center gap-1.5 border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-50 disabled:opacity-50"
                    >
                      <Undo2 className="h-3 w-3" /> Undo
                    </button>
                  )}
                  {lead.status !== 'CONVERTED' && lead.status !== 'DISMISSED' && (
                    <button
                      onClick={() => setStatus(lead, 'DISMISSED')}
                      disabled={busy === lead.id}
                      className="px-2 py-1.5 text-xs text-stone-400 hover:text-stone-600 disabled:opacity-50"
                      title="Dismiss — not interested"
                    >
                      Dismiss
                    </button>
                  )}
                  <button
                    onClick={() => removeLead(lead)}
                    disabled={busy === lead.id}
                    className="p-1.5 text-stone-300 hover:text-red-500 disabled:opacity-50"
                    title="Delete lead"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
