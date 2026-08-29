'use client'

import { useState } from 'react'

const FIELD: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--rule-strong)',
  backgroundColor: 'var(--paper)',
  padding: '11px 14px',
  fontSize: 14,
  color: 'var(--ink)',
  fontFamily: 'var(--font-sans)',
}

const LABEL: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  letterSpacing: '0.22em',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--ink-soft)',
  marginBottom: 6,
}

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', website: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setSent(true)
    } else {
      setError(data.error ?? 'Something went wrong — please email us directly.')
    }
    setSending(false)
  }

  if (sent) {
    return (
      <div className="border p-8 text-center" style={{ borderColor: 'var(--gold)', backgroundColor: 'var(--cream-deep)' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--ink)' }}>
          Much obliged!
        </p>
        <p className="mt-2 text-sm" style={{ color: 'var(--ink-soft)' }}>
          Your message is on its way — we&apos;ll be in touch shortly.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div style={{ backgroundColor: 'rgba(182,90,60,0.08)', border: '1px solid rgba(182,90,60,0.3)', color: 'var(--terracotta-deep)', padding: '12px 16px', fontSize: 14 }}>
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label style={LABEL}>Name *</label>
          <input style={FIELD} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
        </div>
        <div>
          <label style={LABEL}>Email *</label>
          <input style={FIELD} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" />
        </div>
      </div>
      <div>
        <label style={LABEL}>Phone (optional)</label>
        <input style={FIELD} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(830) 555-0123" />
      </div>
      {/* Honeypot — hidden from humans */}
      <input
        style={{ position: 'absolute', left: -9999, opacity: 0, height: 0, width: 0 }}
        tabIndex={-1}
        autoComplete="off"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
        aria-hidden="true"
      />
      <div>
        <label style={LABEL}>Message *</label>
        <textarea style={{ ...FIELD, resize: 'vertical' }} rows={5} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us what's on your mind…" />
      </div>
      <button type="submit" disabled={sending} className="btn-saloon" style={{ opacity: sending ? 0.6 : 1 }}>
        {sending ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
