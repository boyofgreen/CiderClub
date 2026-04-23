'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ArrowLeft, Send } from 'lucide-react'

export default function NewCampaignPage() {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [filter, setFilter] = useState({ status: 'ACTIVE' })
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)

  async function saveDraft() {
    setSaving(true)
    setError(null)
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, bodyHtml, recipientFilter: JSON.stringify(filter) }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      router.push(`/admin/campaigns/${data.campaign.id}`)
    } else {
      setError(data.error ?? 'Failed to save.')
    }
    setSaving(false)
  }

  const fullHtml = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:40px auto;padding:20px">${bodyHtml}</body></html>`

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/campaigns" className="text-stone-500 hover:text-stone-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">New Campaign</h1>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
        <Input
          label="Subject line"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Your Q2 orders are ready to customize!"
          required
        />

        <div className="space-y-1">
          <label className="label">Recipients</label>
          <div className="flex gap-2">
            {['ACTIVE', 'PAUSED', 'ALL'].map((s) => (
              <label key={s} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                filter.status === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-stone-200 text-stone-600'
              }`}>
                <input
                  type="radio"
                  name="recipientStatus"
                  value={s}
                  checked={filter.status === s}
                  onChange={() => setFilter({ ...filter, status: s })}
                  className="accent-brand-600"
                />
                {s === 'ALL' ? 'All members' : `${s} members`}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="label mb-0">Email body (HTML)</label>
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="text-xs text-brand-600 hover:text-brand-700"
            >
              {preview ? 'Edit' : 'Preview'}
            </button>
          </div>
          {preview ? (
            <div
              className="min-h-[300px] rounded-lg border border-stone-200 p-4 overflow-auto text-sm"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          ) : (
            <Textarea
              rows={14}
              placeholder={`<h2>Hello {{firstName}},</h2>\n<p>Your message here...</p>`}
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              className="font-mono text-xs"
            />
          )}
          <p className="text-xs text-stone-400">Write HTML email content. Use {{'{'}{'{'}}firstName{{'}'}{{'}'}}}} to personalize.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={saveDraft} loading={saving} disabled={!subject || !bodyHtml}>
            Save Draft
          </Button>
          <p className="text-xs text-stone-400 self-center">Save first, then send from the campaign detail page.</p>
        </div>
      </div>
    </div>
  )
}
