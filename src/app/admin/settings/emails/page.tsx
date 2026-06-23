'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { ArrowLeft, Mail, RotateCcw, Eye } from 'lucide-react'

type TemplateVar = { name: string; description: string }
type Template = {
  key: string
  label: string
  description: string
  vars: TemplateVar[]
  defaultSubject: string
  defaultBody: string
  subject: string
  bodyHtml: string
  isCustomized: boolean
  updatedAt: string | null
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const active = templates.find((t) => t.key === activeKey) ?? null

  async function load() {
    const r = await fetch('/api/admin/email-templates')
    const d = await r.json()
    setTemplates(d.templates ?? [])
    setLoading(false)
    return d.templates as Template[]
  }

  useEffect(() => {
    load().then((tpls) => {
      if (tpls?.length) select(tpls[0])
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function select(t: Template) {
    setActiveKey(t.key)
    setSubject(t.subject)
    setBodyHtml(t.bodyHtml)
    setMsg(null)
    setPreviewHtml('')
  }

  const refreshPreview = useCallback(async () => {
    if (!activeKey) return
    const r = await fetch('/api/admin/email-templates/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: activeKey, subject, bodyHtml }),
    })
    const d = await r.json()
    if (r.ok) setPreviewHtml(d.html)
  }, [activeKey, subject, bodyHtml])

  // Debounced live preview
  useEffect(() => {
    if (!activeKey) return
    const t = setTimeout(refreshPreview, 400)
    return () => clearTimeout(t)
  }, [activeKey, subject, bodyHtml, refreshPreview])

  async function save() {
    if (!activeKey) return
    setSaving(true)
    setMsg(null)
    const r = await fetch(`/api/admin/email-templates/${activeKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, bodyHtml }),
    })
    const d = await r.json().catch(() => ({}))
    if (r.ok) {
      setMsg({ type: 'success', text: 'Saved. New emails of this type will use your copy.' })
      await load()
    } else {
      setMsg({ type: 'error', text: d.error ?? 'Failed to save.' })
    }
    setSaving(false)
  }

  async function resetToDefault() {
    if (!activeKey || !active) return
    if (!confirm('Reset this email to the original default copy? Your changes will be lost.')) return
    setSaving(true)
    setMsg(null)
    const r = await fetch(`/api/admin/email-templates/${activeKey}`, { method: 'DELETE' })
    if (r.ok) {
      const tpls = await load()
      const fresh = tpls.find((t) => t.key === activeKey)
      if (fresh) select(fresh)
      setMsg({ type: 'success', text: 'Reset to default copy.' })
    }
    setSaving(false)
  }

  function insertVar(name: string) {
    setBodyHtml((b) => `${b}{{${name}}}`)
  }

  if (loading) return <div className="py-12 text-center"><Spinner className="mx-auto" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/settings" className="text-stone-500 hover:text-stone-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(20px,3vw,28px)', color: 'var(--ink)' }}>
            Email Messages
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Edit the wording of every automated email. Use <code className="text-terracotta">{'{{variables}}'}</code> for personalized bits.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Template list */}
        <div className="space-y-1">
          {templates.map((t) => {
            const isActive = t.key === activeKey
            return (
              <button
                key={t.key}
                onClick={() => select(t)}
                className="w-full text-left px-3 py-2.5 border transition flex items-start gap-2"
                style={{
                  borderColor: isActive ? 'var(--terracotta)' : 'var(--rule)',
                  backgroundColor: isActive ? 'var(--cream-deep)' : 'transparent',
                }}
              >
                <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0 text-stone-400" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-stone-800 leading-snug">{t.label}</span>
                  {t.isCustomized && (
                    <span className="text-[10px] uppercase tracking-wide text-terracotta">Customized</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>

        {/* Editor */}
        {active && (
          <div className="space-y-4">
            <div className="border bg-cream-paper p-4 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
              <p className="text-sm text-stone-500 mb-4">{active.description}</p>

              {msg && <Alert type={msg.type} message={msg.text} className="mb-4" />}

              <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1.5">
                Subject line
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border px-3 py-2 text-sm bg-white"
                style={{ borderColor: 'var(--rule)' }}
              />

              <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500 mt-4 mb-1.5">
                Body (HTML)
              </label>
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                rows={16}
                spellCheck={false}
                className="w-full border px-3 py-2 text-xs font-mono leading-relaxed bg-white"
                style={{ borderColor: 'var(--rule)' }}
              />

              {/* Variable chips */}
              <div className="mt-3">
                <p className="text-xs text-stone-500 mb-1.5">
                  Available variables (click to insert):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {active.vars.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => insertVar(v.name)}
                      title={v.description}
                      className="px-2 py-1 text-[11px] font-mono border hover:bg-cream-deep transition"
                      style={{ borderColor: 'var(--rule)', color: 'var(--terracotta)' }}
                    >
                      {`{{${v.name}}}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  onClick={resetToDefault}
                  disabled={!active.isCustomized || saving}
                  className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-terracotta disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="h-3 w-3" /> Reset to default
                </button>
                <Button variant="saloon" onClick={save} loading={saving}>
                  Save Message
                </Button>
              </div>
            </div>

            {/* Live preview */}
            <div className="border bg-cream-paper shadow-sm overflow-hidden" style={{ borderColor: 'var(--rule)' }}>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-stone-100">
                <Eye className="h-3.5 w-3.5 text-stone-400" />
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">Live Preview</span>
                <span className="text-xs text-stone-400 ml-auto truncate">Subject: {subject}</span>
              </div>
              {previewHtml ? (
                <iframe
                  title="Email preview"
                  srcDoc={previewHtml}
                  className="w-full"
                  style={{ height: 560, border: 'none', background: '#efe6cf' }}
                />
              ) : (
                <div className="py-12 text-center text-stone-400 text-sm">Rendering preview…</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
