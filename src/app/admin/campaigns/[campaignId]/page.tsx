'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { ArrowLeft, Send, Users } from 'lucide-react'

type Campaign = {
  id: string; subject: string; bodyHtml: string; bodyMarkdown: string | null; status: string
  sentAt: string | null; sentCount: number; recipientFilter: string | null
  createdAt: string
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

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}`)
      .then((r) => r.json())
      .then((d) => setCampaign(d.campaign))
      .finally(() => setLoading(false))
  }, [campaignId])

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

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/campaigns" className="text-stone-500 hover:text-stone-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(20px,3vw,28px)', color: 'var(--ink)' }}>{campaign.subject}</h1>
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
        {campaign.status === 'DRAFT' && (
          <Button onClick={() => setConfirmSend(true)}>
            <Send className="h-4 w-4" /> Send Now
          </Button>
        )}
      </div>

      {result && <Alert type="success" message={result} />}
      {error && <Alert type="error" message={error} />}

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
    </div>
  )
}
