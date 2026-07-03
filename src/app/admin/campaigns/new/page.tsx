'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { ArrowLeft } from 'lucide-react'
import { markdownToHtml } from '@/lib/markdown'

const PLACEHOLDER = `## Hello {{firstName}},

We've got something new pouring at the cider house this season.

- **Fresh pressed** and ready for pickup
- Tasting notes and pairing ideas inside
- [See what's new](https://club.hillcountryciderhouse.com)

Cheers,
The Hill Country Cider House team`

export default function NewCampaignPage() {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [bodyMarkdown, setBodyMarkdown] = useState('')
  const [filter, setFilter] = useState({ status: 'ACTIVE' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)

  async function saveDraft() {
    setSaving(true)
    setError(null)
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, bodyMarkdown, recipientFilter: JSON.stringify(filter) }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      router.push(`/admin/campaigns/${data.campaign.id}`)
    } else {
      setError(data.error ?? 'Failed to save.')
    }
    setSaving(false)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/campaigns" className="text-stone-500 hover:text-stone-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(20px,3vw,28px)', color: 'var(--ink)' }}>New Campaign</h1>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="border bg-cream-paper p-6 shadow-sm space-y-4" style={{ borderColor: 'var(--rule)' }}>
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
                filter.status === s ? 'border-terracotta text-terracotta' : 'border-stone-200 text-stone-600'
              }`} style={filter.status === s ? { backgroundColor: 'var(--cream-deep)' } : {}}>
                <input
                  type="radio"
                  name="recipientStatus"
                  value={s}
                  checked={filter.status === s}
                  onChange={() => setFilter({ ...filter, status: s })}
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
              onClick={() => setPreview(!preview)}
              className="text-xs text-terracotta hover:text-terracotta-deep"
            >
              {preview ? 'Edit' : 'Preview'}
            </button>
          </div>
          {preview ? (
            <div
              className="campaign-preview min-h-[300px] rounded-lg border border-stone-200 p-6 overflow-auto text-sm"
              style={{ backgroundColor: '#fbf6e9' }}
              dangerouslySetInnerHTML={{ __html: markdownToHtml(bodyMarkdown) }}
            />
          ) : (
            <Textarea
              rows={16}
              placeholder={PLACEHOLDER}
              value={bodyMarkdown}
              onChange={(e) => setBodyMarkdown(e.target.value)}
              className="font-mono text-xs"
            />
          )}
          <p className="text-xs text-stone-400">
            Write in Markdown — <code>## Heading</code>, <code>**bold**</code>, <code>*italic*</code>,{' '}
            <code>- bullet</code>, <code>[link](url)</code>. Use <code>{'{{firstName}}'}</code>,{' '}
            <code>{'{{lastName}}'}</code>, or <code>{'{{email}}'}</code> to personalize. Your message is
            automatically wrapped in the club letterhead.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={saveDraft} loading={saving} disabled={!subject || !bodyMarkdown}>
            Save Draft
          </Button>
          <p className="text-xs text-stone-400 self-center">Save first, then send from the campaign detail page.</p>
        </div>
      </div>
    </div>
  )
}
