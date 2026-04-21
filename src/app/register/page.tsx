'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { Beer, ChevronRight, CheckCircle, ArrowLeft, CreditCard } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

type Plan = { id: string; name: string; description: string | null; packsPerOrder: number; priceInCents: number }

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<{
        card: () => Promise<{
          attach: (selector: string) => Promise<void>
          tokenize: () => Promise<{ status: string; token?: string; errors?: { message: string }[] }>
          destroy: () => Promise<void>
        }>
      }>
    }
  }
}

const SQUARE_APP_ID = process.env.NEXT_PUBLIC_SQUARE_APP_ID ?? ''
const SQUARE_LOCATION_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? ''
const isSandbox = SQUARE_APP_ID.startsWith('sandbox-')
const SQUARE_SCRIPT_URL = isSandbox
  ? 'https://sandbox.web.squarecdn.com/v1/square.js'
  : 'https://web.squarecdn.com/v1/square.js'

function RegisterContent() {
  const searchParams = useSearchParams()
  const defaultPlanId = searchParams.get('plan') ?? ''
  const referralCode = searchParams.get('ref') ?? ''

  const [step, setStep] = useState(1)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [memberStatus, setMemberStatus] = useState<'ACTIVE' | 'WAITLIST'>('ACTIVE')

  // Square card widget refs
  const cardRef = useRef<Awaited<ReturnType<Awaited<ReturnType<NonNullable<Window['Square']>['payments']>>['card']>> | null>(null)
  const cardMounted = useRef(false)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address1: '',
    city: '',
    state: '',
    zip: '',
    planId: defaultPlanId,
    referralCode,
  })

  useEffect(() => {
    fetch('/api/plans')
      .then((r) => r.json())
      .then((data) => {
        setPlans(data.plans ?? [])
        if (!form.planId && data.plans?.length > 0) {
          setForm((f) => ({ ...f, planId: data.plans[0].id }))
        }
      })
      .catch(() => {})
  }, [])

  // Load Square script and mount card widget when on step 3
  useEffect(() => {
    if (step !== 3 || !SQUARE_APP_ID || !SQUARE_LOCATION_ID) return

    async function mountCard() {
      if (cardMounted.current) return

      // Load Square script if not already loaded
      if (!window.Square) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = SQUARE_SCRIPT_URL
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load Square'))
          document.head.appendChild(script)
        })
      }

      if (!window.Square) {
        setError('Square payments could not be loaded. Please refresh and try again.')
        return
      }

      try {
        const payments = await window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID)
        const card = await payments.card()
        await card.attach('#square-card-container')
        cardRef.current = card
        cardMounted.current = true
      } catch (err) {
        setError('Could not initialize payment form. Please refresh and try again.')
        console.error(err)
      }
    }

    mountCard()

    return () => {
      cardRef.current?.destroy().catch(() => {})
      cardRef.current = null
      cardMounted.current = false
    }
  }, [step])

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function goToStep2(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStep(2)
  }

  function goToStep3(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setStep(3)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Tokenize card
    let cardNonce: string | undefined
    if (cardRef.current) {
      const result = await cardRef.current.tokenize()
      if (result.status !== 'OK' || !result.token) {
        const msg = result.errors?.map((e) => e.message).join(', ') ?? 'Card tokenization failed.'
        setError(msg)
        setLoading(false)
        return
      }
      cardNonce = result.token
    }

    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, cardNonce }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setMemberStatus(data.status)
    setDone(true)
    setLoading(false)
  }

  async function skipCard(e: React.MouseEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setMemberStatus(data.status)
    setDone(true)
    setLoading(false)
  }

  const selectedPlan = plans.find((p) => p.id === form.planId)
  const totalSteps = SQUARE_APP_ID ? 3 : 2

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        {memberStatus === 'ACTIVE' ? (
          <>
            <h2 className="text-2xl font-bold text-stone-900">Welcome to the club! 🎉</h2>
            <p className="mt-3 text-stone-600">
              We've sent a welcome email to <strong>{form.email}</strong> with your personal
              portal link. Check your inbox!
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-stone-900">You're on the waitlist!</h2>
            <p className="mt-3 text-stone-600">
              The <strong>{selectedPlan?.name}</strong> plan is currently full. We've added you to
              the waitlist and will notify you at <strong>{form.email}</strong> when a spot opens.
            </p>
          </>
        )}
        <Link href="/" className="mt-6 inline-block text-sm text-brand-600 hover:text-brand-700">
          ← Back to home
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-6">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              step >= s ? 'bg-brand-600 text-white' : 'bg-stone-200 text-stone-500'
            }`}>
              {s}
            </div>
            {s < totalSteps && <div className={`h-0.5 w-8 ${step > s ? 'bg-brand-600' : 'bg-stone-200'}`} />}
          </div>
        ))}
        <span className="ml-2 text-sm text-stone-500">
          {step === 1 ? 'Your info' : step === 2 ? 'Choose your plan' : 'Payment info'}
        </span>
      </div>

      {error && <Alert type="error" message={error} className="mb-4" />}

      {/* Step 1 — Personal info */}
      {step === 1 && (
        <form onSubmit={goToStep2} className="space-y-4">
          <h2 className="text-lg font-semibold text-stone-900">Your information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="First name" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
            <Input label="Last name" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
          </div>
          <Input label="Email address" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          <Input label="Phone number" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} hint="Optional — for pickup reminders" />
          <Input label="Street address" value={form.address1} onChange={(e) => update('address1', e.target.value)} hint="Optional" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="City" value={form.city} onChange={(e) => update('city', e.target.value)} />
            <Input label="State" value={form.state} onChange={(e) => update('state', e.target.value)} maxLength={2} placeholder="WA" />
            <Input label="ZIP" value={form.zip} onChange={(e) => update('zip', e.target.value)} />
          </div>
          {referralCode && (
            <Input label="Referral code" value={form.referralCode} onChange={(e) => update('referralCode', e.target.value)} />
          )}
          <Button type="submit" className="w-full mt-2" disabled={!form.firstName || !form.lastName || !form.email}>
            Next: Choose Plan <ChevronRight className="h-4 w-4" />
          </Button>
        </form>
      )}

      {/* Step 2 — Plan selection */}
      {step === 2 && (
        <form onSubmit={SQUARE_APP_ID ? goToStep3 : handleSubmit} className="space-y-4">
          <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <h2 className="text-lg font-semibold text-stone-900">Choose your plan</h2>

          <div className="space-y-3">
            {plans.map((plan) => (
              <label
                key={plan.id}
                className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition ${
                  form.planId === plan.id
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="planId"
                  value={plan.id}
                  checked={form.planId === plan.id}
                  onChange={() => update('planId', plan.id)}
                  className="mt-1 accent-brand-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-900">{plan.name}</span>
                    <span className="font-bold text-brand-700">
                      ${(plan.priceInCents / 100).toFixed(0)}/qtr
                    </span>
                  </div>
                  {plan.description && (
                    <p className="mt-0.5 text-sm text-stone-500">{plan.description}</p>
                  )}
                  <p className="mt-1 text-xs text-stone-400">
                    {plan.packsPerOrder} cans per quarter
                  </p>
                </div>
              </label>
            ))}
          </div>

          <Button type="submit" loading={loading} className="w-full" disabled={!form.planId}>
            {SQUARE_APP_ID ? (
              <><CreditCard className="h-4 w-4" /> Next: Add Payment Info</>
            ) : (
              'Join the Club 🍺'
            )}
          </Button>
          <p className="text-xs text-center text-stone-500">
            By joining, you agree to our quarterly pickup and billing policy. Cancel anytime.
          </p>
        </form>
      )}

      {/* Step 3 — Payment */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <button type="button" onClick={() => setStep(2)} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <h2 className="text-lg font-semibold text-stone-900">Payment information</h2>
          <p className="text-sm text-stone-500">
            Your card won't be charged today. We'll bill you when you pick up your quarterly order
            (or at the end of the pickup period if you don't pick up).
          </p>

          <div className="rounded-xl border border-stone-200 p-4 bg-white">
            <div id="square-card-container" className="min-h-[90px]" />
          </div>

          {selectedPlan && (
            <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-sm">
              <div className="flex justify-between text-stone-700">
                <span>{selectedPlan.name}</span>
                <span className="font-semibold">${(selectedPlan.priceInCents / 100).toFixed(2)}/quarter</span>
              </div>
              <p className="text-xs text-stone-400 mt-1">Billed at pickup each quarter</p>
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Join the Club 🍺
          </Button>

          <button
            type="button"
            onClick={skipCard}
            disabled={loading}
            className="w-full text-sm text-stone-400 hover:text-stone-600 py-1"
          >
            Skip for now — add payment info later
          </button>

          <p className="text-xs text-center text-stone-500">
            Card info is securely stored by Square. We never see your full card number.
          </p>
        </form>
      )}
    </>
  )
}

export default function RegisterPage() {
  const clubName = process.env.NEXT_PUBLIC_CLUB_NAME ?? 'Cider Club'

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
              <Beer className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-900">{clubName}</span>
          </Link>
          <p className="mt-2 text-sm text-stone-500">Join the quarterly craft cider club</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <Suspense>
            <RegisterContent />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
