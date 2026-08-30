'use client'

import { useState } from 'react'

const LABEL: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'rgba(245,238,227,0.55)',
  fontWeight: 600,
}

const FIELD_WRAP: React.CSSProperties = { display: 'grid', gap: 10 }

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
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <p
          className="hc-display"
          style={{ fontWeight: 500, fontSize: 30, margin: '0 0 12px', letterSpacing: '-0.03em' }}
        >
          Much obliged.
        </p>
        <p
          style={{
            fontSize: 16.5,
            lineHeight: 1.7,
            color: 'rgba(245,238,227,0.66)',
            fontWeight: 300,
            margin: 0,
          }}
        >
          Your message is on its way — we&rsquo;ll be in touch shortly.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 24 }}>
      {error && (
        <p
          role="alert"
          style={{
            margin: 0,
            padding: '12px 16px',
            fontSize: 15,
            color: 'var(--hc-accent)',
            border: '1px solid rgba(185,162,106,0.4)',
            background: 'rgba(185,162,106,0.07)',
          }}
        >
          {error}
        </p>
      )}

      <label style={FIELD_WRAP}>
        <span style={LABEL}>Name</span>
        <input
          className="hc-field"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Your name"
        />
      </label>

      <label style={FIELD_WRAP}>
        <span style={LABEL}>Email</span>
        <input
          className="hc-field"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@example.com"
        />
      </label>

      <label style={FIELD_WRAP}>
        <span style={LABEL}>Phone (optional)</span>
        <input
          className="hc-field"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="(000) 000-0000"
        />
      </label>

      {/* Honeypot — hidden from humans */}
      <input
        style={{ position: 'absolute', left: -9999, opacity: 0, height: 0, width: 0 }}
        tabIndex={-1}
        autoComplete="off"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
        aria-hidden="true"
      />

      <label style={FIELD_WRAP}>
        <span style={LABEL}>Message</span>
        <textarea
          className="hc-field"
          rows={4}
          required
          style={{ resize: 'vertical' }}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          placeholder="Tell us what you're after"
        />
      </label>

      <button
        type="submit"
        disabled={sending}
        className="hc-btn hc-btn--accent"
        style={{ marginTop: 8 }}
      >
        {sending ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
