'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { Beer, ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

type Plan = { id: string; name: string; description: string | null; packsPerOrder: number; priceInCents: number }

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultPlanId = searchParams.get('plan') ?? ''
  const referralCode = searchParams.get('ref') ?? ''

  const [step, setStep] = useState(1)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [memberStatus, setMemberStatus] = useState<'ACTIVE' | 'WAITLIST'>('ACTIVE')

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

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
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
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              step >= s ? 'bg-brand-600 text-white' : 'bg-stone-200 text-stone-500'
            }`}>
              {s}
            </div>
            {s < 2 && <div className={`h-0.5 w-8 ${step > s ? 'bg-brand-600' : 'bg-stone-200'}`} />}
          </div>
        ))}
        <span className="ml-2 text-sm text-stone-500">
          {step === 1 ? 'Your info' : 'Choose your plan'}
        </span>
      </div>

      {error && <Alert type="error" message={error} className="mb-4" />}

      <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); setStep(2) }}>
        {step === 1 && (
          <div className="space-y-4">
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
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-2">
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <h2 className="text-lg font-semibold text-stone-900">Choose your plan</h2>

            <div className="space-y-3">
              {plans.filter((p) => true).map((plan) => (
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
                      {plan.packsPerOrder} bottles per quarter
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="rounded-xl bg-stone-50 border border-stone-200 p-4 text-sm text-stone-600">
              <p className="font-medium text-stone-800 mb-1">💳 Payment</p>
              <p>
                You won't be charged today. We'll charge your card when you pick up your quarterly
                order (or at the end of the pickup period). We'll collect your payment info at
                checkout.
              </p>
            </div>

            <Button type="submit" loading={loading} className="w-full" disabled={!form.planId}>
              Join the Club 🍺
            </Button>

            <p className="text-xs text-center text-stone-500">
              By joining, you agree to our quarterly pickup and billing policy. Cancel anytime.
            </p>
          </div>
        )}
      </form>
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
