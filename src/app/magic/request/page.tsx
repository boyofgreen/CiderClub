'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Beer, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
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

  // Read error from URL (set by the magic link handler on invalid token)
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
    <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-stone-700 hover:text-stone-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
              <Beer className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">{clubName}</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-7 w-7 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-stone-900">Check your inbox!</h2>
              <p className="mt-3 text-stone-600">
                If <strong>{email}</strong> is registered as a member, we've sent you a link to access
                your portal. The link expires in 30 days.
              </p>
              <p className="mt-4 text-sm text-stone-500">
                Didn't get it? Check your spam folder or{' '}
                <button
                  onClick={() => { setSent(false); setEmail('') }}
                  className="text-brand-600 underline hover:text-brand-700"
                >
                  try again
                </button>.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
                  <Mail className="h-6 w-6 text-brand-600" />
                </div>
                <h1 className="text-xl font-bold text-stone-900">Access Your Member Portal</h1>
                <p className="mt-2 text-sm text-stone-600">
                  Enter your email and we'll send you a link — no password needed.
                </p>
              </div>

              {errorMsg && (
                <Alert type="warning" message={errorMsg} className="mb-4" />
              )}

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
                <Button type="submit" loading={loading} className="w-full">
                  Send My Access Link
                </Button>
              </form>

              <p className="mt-4 text-center text-sm text-stone-500">
                Not a member yet?{' '}
                <Link href="/register" className="text-brand-600 font-medium hover:text-brand-700">
                  Join the club
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
