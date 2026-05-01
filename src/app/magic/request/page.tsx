'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

const clubName = process.env.NEXT_PUBLIC_CLUB_NAME ?? 'Cider Club'

const errorMessages: Record<string, string> = {
  expired: 'Your access link has expired. Enter your email below to get a fresh one.',
  missing_token: 'That link appears to be incomplete. Enter your email below.',
  cancelled: 'Your membership has been cancelled. Contact us if you believe this is an error.',
}

export default function MagicRequestPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams()
  const urlError = searchParams.get('error')
  const errorMsg = urlError ? errorMessages[urlError] : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/magic/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      setSent(true)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="paper-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Wordmark */}
        <div className="text-center mb-8">
          <Link href="/" style={{ display: 'inline-block', textDecoration: 'none' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 22, color: 'var(--ink)', margin: 0 }}>
              {clubName}
            </p>
          </Link>
        </div>

        <div className="paper-card" style={{ padding: '40px 36px' }}>
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center" style={{ backgroundColor: 'var(--cream-deep)' }}>
                <CheckCircle className="h-6 w-6 text-terracotta" />
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 20, color: 'var(--ink)', margin: '0 0 12px' }}>
                Check your inbox
              </h2>
              <p className="text-sm text-stone-600">
                If <strong>{email}</strong> is registered as a member, we've sent you a link to access
                your portal. The link expires in 30 days.
              </p>
              <p className="mt-4 text-xs text-stone-400">
                Didn't get it? Check your spam folder or{' '}
                <button
                  onClick={() => { setSent(false); setEmail('') }}
                  className="text-terracotta underline hover:text-terracotta-deep"
                >
                  try again
                </button>.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center" style={{ backgroundColor: 'var(--cream-deep)' }}>
                  <Mail className="h-5 w-5 text-terracotta" />
                </div>
                <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 22, color: 'var(--ink)', margin: '0 0 8px' }}>
                  Access Your Member Portal
                </h1>
                <p className="text-sm text-stone-500">
                  Enter your email and we'll send you a link — no password needed.
                </p>
              </div>

              {errorMsg && <Alert type="warning" message={errorMsg} className="mb-4" />}
              {error && <Alert type="error" message={error} className="mb-4" />}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
                <Button variant="saloon" type="submit" loading={loading} className="w-full">
                  Send My Access Link
                </Button>
              </form>

              <p className="mt-5 text-center text-xs text-stone-400">
                Not a member yet?{' '}
                <Link href="/register" className="text-terracotta hover:text-terracotta-deep font-medium">
                  Join the club
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600">
            <ArrowLeft className="h-3 w-3" />
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
