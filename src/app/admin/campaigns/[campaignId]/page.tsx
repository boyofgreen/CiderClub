'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { Input, Textarea } from '@/components/ui/Input'
import { markdownToHtml } from '@/lib/markdown'
import { ArrowLeft, Send, Users, Pencil, Trash2, X } from 'lucide-react'

type Campaign = {
  id: string; subject: string; bodyHtml: string; bodyMarkdown: string | null; status: string
  sentAt: string | null; sentCount: number; recipientFilter: string | null
  createdAt: string
}

function parseRecipientStatus(filter: string | null): string {
  if (!filter) return 'ACTIVE'
  try {
    const parsed = JSON.parse(filter) as { status?: string }
    return parsed.status ?? 'ACTIVE'
  } catch {
    return 'ACTIVE'
  }
}

export default function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const [confirmSend, setConfirmSend] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [editPreview, setEditPreview] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editForm, setEditForm] = useState({ subject: '', bodyMarkdown: '', recipientStatus: 'ACTIVE' })

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}`)
      .then((r) => r.json())
      .then((d) => setCampaign(d.campaign))
      .finally(() => setLoading(false))
  }, [campaignId])

  function startEditing() {
    if (!campaign) return
    setEditForm({
      subject: campaign.subject,
      bodyMarkdown: campaign.bodyMarkdown ?? campaign.bodyHtml,
      recipientStatus: parseRecipientStatus(campaign.recipientFilter),
    })
    setEditPreview(false)
    setEditing(true)
    setResult(null)
    setError(null)
  }

  async function handleSaveEdit() {
    setSavingEdit(true)
    setError(null)
    const res = await fetch(`/api/campaigns/${campaignId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: editForm.subject,
        bodyMarkdown: editForm.bodyMarkdown,
        recipientFilter: { status: editForm.recipientStatus },
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setCampaign(data.campaign)
      setEditing(false)
      setResult('Draft updated.')
    } else {
      setError(data.error ?? 'Failed to save changes')
    }
    setSavingEdit(false)
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    const res = await fetch(`/api/campaigns/${campaignId}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      router.push('/admin/campaigns')
    } else {
      setError(data.error ?? 'Failed to delete campaign')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function handleSend() {
    setSending(true)
    setError(null)
    const res = await fetch(`/api/campaigns/${campaignId}/send`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setResult(`Sent to ${data.sent} members!`)
      setConfirmSend(false)
      const updated = await fetch(`/api/campaigns/${campaignId}`).then((r) => r.json())
      setCampaign(updated.campaign)
    } else {
      setError(data.error ?? 'Send failed')
    }
    setSending(false)
  }

  if (loading) return <div className="py-12 text-center"><Spinner className="mx-auto" /></div>
  if (!campaign) return <Alert type="error" message="Campaign not found" />

  const isDraft = campaign.status === 'DRAFT'

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/campaigns" className="text-stone-500 hover:text-stone-700 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(20px,3vw,28px)', color: 'var(--ink)' }}>{campaign.subject}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={campaign.status} />
              {campaign.sentAt && (
                <span className="text-xs text-stone-400">
                  Sent {formatDateTime(campaign.sentAt)} · {campaign.sentCount} recipients
                </span>
              )}
            </div>
          </div>
        </div>
        {isDraft && !editing && (
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={startEditing}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="border border-red-200 bg-white text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
            <Button size="sm" onClick={() => setConfirmSend(true)}>
              <Send className="h-4 w-4" /> Send Now
            </Button>
          </div>
        )}
      </div>

      {result && <Alert type="success" message={result} />}
      {error && <Alert type="error" message={error} />}

      {editing ? (
        /* ── Edit mode ─────────────────────────────────────────────── */
        <div className="border bg-cream-paper p-6 shadow-sm space-y-4" style={{ borderColor: 'var(--rule)' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">Edit Draft</h2>
            <button onClick={() => setEditing(false)} className="text-stone-400 hover:text-stone-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <Input
            label="Subject line"
            value={editForm.subject}
            onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
            required
          />

          <div className="space-y-1">
            <label className="label">Recipients</label>
            <div className="flex gap-2">
              {['ACTIVE', 'PAUSED', 'ALL'].map((s) => (
                <label key={s} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  editForm.recipientStatus === s ? 'border-terracotta text-terracotta' : 'border-stone-200 text-stone-600'
                }`} style={editForm.recipientStatus === s ? { backgroundColor: 'var(--cream-deep)' } : {}}>
                  <input
                    type="radio"
                    name="editRecipientStatus"
                    value={s}
                    checked={editForm.recipientStatus === s}
                    onChange={() => setEditForm({ ...editForm, recipientStatus: s })}
                    className="accent-terracotta"
                  />
                  {s === 'ALL' ? 'All members' : `${s} members`}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="label mb-0">Email body (Markdown)</label>
              <button
                type="button"
                onClick={() => setEditPreview(!editPreview)}
                className="text-xs text-terracotta hover:text-terracotta-deep"
              >
                {editPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
            {editPreview ? (
              <div
                className="campaign-preview min-h-[300px] rounded-lg border border-stone-200 p-6 overflow-auto text-sm"
                style={{ backgroundColor: '#fbf6e9' }}
                dangerouslySetInnerHTML={{ __html: markdownToHtml(editForm.bodyMarkdown) }}
              />
            ) : (
              <Textarea
                rows={16}
                value={editForm.bodyMarkdown}
                onChange={(e) => setEditForm({ ...editForm, bodyMarkdown: e.target.value })}
                className="font-mono text-xs"
              />
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={() => setEditing(false)} className="flex-1" type="button">
              Cancel
            </Button>
            <Button
              variant="saloon"
              onClick={handleSaveEdit}
              loading={savingEdit}
              disabled={!editForm.subject || !editForm.bodyMarkdown}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        /* ── Read-only preview ─────────────────────────────────────── */
        <div className="border bg-cream-paper p-6 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-stone-900">Email Preview</h2>
            <button
              onClick={() => setPreview(!preview)}
              className="text-xs text-terracotta hover:text-terracotta-deep"
            >
              {preview ? 'Show Markdown' : 'Preview'}
            </button>
          </div>
          {preview ? (
            <div
              className="campaign-preview rounded-lg border border-stone-200 p-6 text-sm overflow-auto"
              style={{ backgroundColor: '#fbf6e9' }}
              dangerouslySetInnerHTML={{ __html: campaign.bodyHtml }}
            />
          ) : (
            <pre className="text-xs text-stone-600 overflow-auto whitespace-pre-wrap">
              {campaign.bodyMarkdown ?? campaign.bodyHtml}
            </pre>
          )}
        </div>
      )}

      {/* Confirm send modal */}
      {confirmSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-cream-paper p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-terracotta" style={{ backgroundColor: 'var(--cream-deep)' }}>
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900">Send Campaign?</h3>
                <p className="text-sm text-stone-500">This will email all matching members.</p>
              </div>
            </div>
            <p className="text-sm text-stone-600 mb-4 rounded-lg p-3" style={{ backgroundColor: 'var(--cream-deep)' }}>
              <strong>Subject:</strong> {campaign.subject}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setConfirmSend(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSend} loading={sending} className="flex-1">
                <Send className="h-4 w-4" /> Send
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-cream-paper p-6 shadow-xl" style={{ border: '1px solid var(--rule)' }}>
            <h3 className="font-bold text-stone-900 mb-2">Delete this draft?</h3>
            <p className="text-sm text-stone-600 mb-4">
              <strong>{campaign.subject}</strong> will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setConfirmDelete(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                loading={deleting}
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
