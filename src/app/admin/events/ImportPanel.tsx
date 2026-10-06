'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Link2, ImagePlus, X } from 'lucide-react'
import type { EventFormValues } from '@/components/admin/EventFormFields'
import { compressImage } from '@/lib/imageClient'

type Draft = Omit<EventFormValues, 'isPublic' | 'notes' | 'soldOut'>

export function ImportPanel({ onDraft }: { onDraft: (draft: Draft) => void }) {
  const [tab, setTab] = useState<'link' | 'shot'>('link')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [image, setImage] = useState<{ base64: string; type: string; preview: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [aiReady, setAiReady] = useState<boolean | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/events/extract')
      .then((r) => r.json())
      .then((d) => setAiReady(!!d.configured))
      .catch(() => setAiReady(false))
  }, [])

  async function takeFile(file: File | undefined | null) {
    if (!file || !file.type.startsWith('image/')) return
    setError(null)
    try {
      const { base64, type, dataUrl } = await compressImage(file, 1600)
      setImage({ base64, type, preview: dataUrl })
    } catch {
      setError("Couldn't read that image. Try a PNG or JPEG screenshot.")
    }
  }

  async function run(endpoint: string, body: object) {
    setBusy(true)
    setError(null)
    setWarning(null)
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(data.error ?? 'Import failed.')
      return
    }
    if (data.existing) {
      setWarning(`Already imported as: ${data.existing.title}. Edit that one instead of creating a duplicate.`)
      return
    }
    onDraft(data.draft)
    setUrl('')
    setText('')
    setImage(null)
  }

  const tabClass = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition ${
      active ? 'border-terracotta text-terracotta' : 'border-transparent text-stone-500 hover:text-stone-700'
    }`

  return (
    <div className="border bg-cream-paper p-5" style={{ borderColor: 'var(--rule)' }}>
      <p className="font-semibold text-stone-900">Quick add</p>
      <p className="text-xs text-stone-500 mb-3">
        Fill the event form from a ticket page or a Facebook post. You&apos;ll review everything before it saves.
      </p>

      <div className="flex gap-2 border-b mb-4" style={{ borderColor: 'var(--rule)' }}>
        <button type="button" className={tabClass(tab === 'link')} onClick={() => { setTab('link'); setError(null); setWarning(null) }}>
          <Link2 className="h-3.5 w-3.5" /> Ticket link
        </button>
        <button type="button" className={tabClass(tab === 'shot')} onClick={() => { setTab('shot'); setError(null); setWarning(null) }}>
          <ImagePlus className="h-3.5 w-3.5" /> Screenshot or post
        </button>
      </div>

      {error && <Alert type="error" message={error} className="mb-3" />}
      {warning && <Alert type="warning" message={warning} className="mb-3" />}

      {tab === 'link' ? (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault()
            if (url.trim()) run('/api/admin/events/import-link', { url })
          }}
        >
          <input
            className="input flex-1"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://ticketscandy.com/e/…"
          />
          <Button variant="saloon" type="submit" loading={busy} disabled={!url.trim()}>
            Import
          </Button>
        </form>
      ) : aiReady === false ? (
        <p className="text-sm text-stone-600">
          Screenshot import needs an <code>ANTHROPIC_API_KEY</code> setting in Azure. Ticket links work without it.
        </p>
      ) : (
        <div className="space-y-3">
          <div
            tabIndex={0}
            onPaste={(e) => takeFile(Array.from(e.clipboardData.files)[0])}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              takeFile(e.dataTransfer.files[0])
            }}
            onClick={() => !image && fileRef.current?.click()}
            className="relative flex min-h-[120px] cursor-pointer items-center justify-center border border-dashed p-4 text-center text-sm text-stone-500 outline-none focus:border-terracotta"
            style={{ borderColor: 'var(--rule-strong)' }}
          >
            {image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.preview} alt="Screenshot to import" className="max-h-64 object-contain" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setImage(null)
                  }}
                  className="absolute right-2 top-2 bg-white/90 p-1 text-stone-500 hover:text-terracotta"
                  aria-label="Remove screenshot"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <span>
                <strong>Click here and paste</strong> a screenshot (⌘V / Ctrl+V), drag one in, or click to choose a file
              </span>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => takeFile(e.target.files?.[0])}
            />
          </div>
          <textarea
            className="input"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="…or paste the text of the Facebook post here (or both)"
          />
          <Button
            variant="saloon"
            loading={busy}
            disabled={!image && !text.trim()}
            onClick={() =>
              run('/api/admin/events/extract', {
                imageBase64: image?.base64,
                imageType: image?.type,
                text,
              })
            }
          >
            {busy ? 'Reading…' : 'Read event'}
          </Button>
        </div>
      )}
    </div>
  )
}
