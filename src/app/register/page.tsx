'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import Image from 'next/image'

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

const TIER_NAMES = ['The Pickers', 'The Pressers', 'Cellar Crew']
const TIER_LEVELS = ['LEVEL I', 'LEVEL II', 'LEVEL III']
const TIER_BOTTLES = [3, 6, 9]
const TIER_PERKS = [
  [
    '10% off club purchase bottles',
    '5% off every day',
    'One free pour each visit',
    'Open-bar pickup party',
  ],
  [
    '15% off club purchase bottles',
    '5% off every day',
    'Free pour for you + a guest',
    'Open-bar pickup party',
    'Early access to new releases',
  ],
  [
    '20% off club purchase bottles',
    '10% off every day',
    'Free pour for you + a guest',
    'Open-bar pickup party',
    'First access to limited releases',
    'Free barrel-room reservation',
  ],
]

// ─── Progress Rail ───────────────────────────────────────────────────────────
function ProgressRail({ step, totalSteps }: { step: number; totalSteps: number }) {
  const labels = ['YOUR DETAILS', 'PICK YOUR TIER', 'CARD ON FILE'].slice(0, totalSteps)
  return (
    <div style={{ maxWidth: 560, width: '100%', margin: '0 auto 28px' }}>
      <div className="flex items-start">
        {labels.map((label, i) => (
          <Fragment key={label}>
            <div className="flex flex-col items-center" style={{ flexShrink: 0 }}>
              <div style={{
                width: 24, height: 24, transform: 'rotate(45deg)',
                border: step > i + 1 ? 'none' : `2px solid ${step === i + 1 ? 'var(--terracotta)' : 'var(--rule-strong)'}`,
                backgroundColor: step > i + 1 ? 'var(--terracotta)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ transform: 'rotate(-45deg)', fontSize: 9, fontWeight: 700, color: step > i + 1 ? 'var(--cream)' : step === i + 1 ? 'var(--terracotta)' : 'var(--ink-soft)' }}>
                  {step > i + 1 ? '✓' : i + 1}
                </span>
              </div>
              <div style={{ marginTop: 8, fontSize: 9, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', color: step === i + 1 ? 'var(--terracotta)' : 'var(--ink-soft)', opacity: step < i + 1 ? 0.45 : 1, whiteSpace: 'nowrap' }}>
                {label}
              </div>
            </div>
            {i < labels.length - 1 && (
              <div style={{ flex: 1, marginTop: 11, position: 'relative', height: 1, backgroundColor: 'var(--rule-strong)' }}>
                <span style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', fontSize: 8, color: 'var(--gold)', backgroundColor: 'var(--paper)', padding: '0 3px' }}>✦</span>
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

// ─── Field ───────────────────────────────────────────────────────────────────
function Field({ label, required, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean; hint?: string }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.22em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 6 }}>
        {label}{required && <span style={{ color: 'var(--terracotta)', marginLeft: 3 }}>*</span>}
      </label>
      <input className="field-saloon" required={required} {...props} />
      {hint && <span style={{ display: 'block', fontSize: 11, fontStyle: 'italic', color: 'var(--ink-soft)', opacity: 0.7, marginTop: 4 }}>{hint}</span>}
    </div>
  )
}

// ─── Register Content ────────────────────────────────────────────────────────
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

  const cardRef = useRef<Awaited<ReturnType<Awaited<ReturnType<NonNullable<Window['Square']>['payments']>>['card']>> | null>(null)
  const cardMounted = useRef(false)

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address1: '', city: '', state: '', zip: '',
    planId: defaultPlanId, referralCode,
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

  useEffect(() => {
    if (step !== 3 || !SQUARE_APP_ID || !SQUARE_LOCATION_ID) return
    async function mountCard() {
      if (cardMounted.current) return
      if (!window.Square) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = SQUARE_SCRIPT_URL
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Failed to load Square'))
          document.head.appendChild(script)
        })
      }
      if (!window.Square) { setError('Square payments could not be loaded. Please refresh and try again.'); return }
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
    return () => { cardRef.current?.destroy().catch(() => {}); cardRef.current = null; cardMounted.current = false }
  }, [step])

  function update(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })) }

  function goToStep2(e: React.FormEvent) { e.preventDefault(); setError(null); setStep(2) }
  function goToStep3(e: React.FormEvent) { e.preventDefault(); setError(null); setStep(3) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null)
    let cardNonce: string | undefined
    if (cardRef.current) {
      const result = await cardRef.current.tokenize()
      if (result.status !== 'OK' || !result.token) {
        setError(result.errors?.map((e) => e.message).join(', ') ?? 'Card tokenization failed.')
        setLoading(false); return
      }
      cardNonce = result.token
    }
    const res = await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, cardNonce }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setError(data.error ?? 'Something went wrong. Please try again.'); setLoading(false); return }
    setMemberStatus(data.status); setDone(true); setLoading(false)
  }

  const selectedPlan = plans.find((p) => p.id === form.planId)
  const selectedPlanIdx = plans.findIndex((p) => p.id === form.planId)
  const totalSteps = SQUARE_APP_ID ? 3 : 2

  // ─── Confirmation ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }} className="paper-bg">
        <div className="paper-card" style={{ maxWidth: 560, width: '100%' }}>
          {/* Ticket header */}
          <div style={{ padding: '36px 40px 28px', textAlign: 'center' }}>
            <Image src="/brand/logo.png" alt="Hill Country Cider House" width={66} height={77} style={{ objectFit: 'contain', width: 66, height: 'auto', margin: '0 auto 16px' }} />
          </div>

          {/* Perforation */}
          <div style={{ position: 'relative', borderTop: '1px dashed var(--rule-strong)', margin: '0 0 0' }}>
            <div style={{ position: 'absolute', top: -14, left: -14, width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--paper)' }} />
            <div style={{ position: 'absolute', top: -14, right: -14, width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--paper)' }} />
          </div>

          <div style={{ padding: '40px 40px 48px', textAlign: 'center' }}>
            {/* ✦ circle */}
            <div style={{ width: 80, height: 80, border: '2px solid var(--gold)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 40, color: 'var(--gold-deep)', lineHeight: 1 }}>✦</span>
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 36, fontWeight: 400, color: 'var(--ink)', margin: '0 0 16px' }}>
              {memberStatus === 'ACTIVE' ? "You're in, partner." : "You're on the list."}
            </h2>

            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-soft)', maxWidth: 400, margin: '0 auto 32px' }}>
              {memberStatus === 'ACTIVE'
                ? <>We just sent a welcome note to <strong>{form.email}</strong> with your member portal link. Check your inbox.</>
                : <>{selectedPlan?.name} is currently full. We added you to the waitlist at <strong>{form.email}</strong> and will holler when a spot opens.</>
              }
            </p>

            {memberStatus === 'ACTIVE' && selectedPlan && (
              <>
                {/* Stat strip */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', margin: '0 0 32px' }}>
                  {[
                    { label: 'TIER', value: TIER_NAMES[selectedPlanIdx] ?? selectedPlan.name },
                    { label: 'STATUS', value: 'Active Member' },
                  ].map(({ label, value }, i) => (
                    <div key={label} style={{ padding: '16px 20px', textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--rule)' : 'none' }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.22em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 6 }}>{label}</div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--ink)' }}>{value}</div>
                    </div>
                  ))}
                </div>
                <Link href="/member/dashboard" className="btn-saloon" style={{ display: 'inline-flex' }}>
                  Open Member Portal →
                </Link>
              </>
            )}
          </div>
        </div>
        <Link href="/" style={{ marginTop: 24, fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', textDecoration: 'none', opacity: 0.6 }}>
          ← Back to Hill Country Cider House
        </Link>
      </div>
    )
  }

  // ─── Registration Steps ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 16px' }} className="paper-bg">
      <ProgressRail step={step} totalSteps={totalSteps} />

      {/* Card */}
      <div className="paper-card" style={{ maxWidth: 640, width: '100%' }}>
        {/* Ticket Header */}
        <div style={{ padding: '36px 40px 28px', textAlign: 'center' }}>
          <Image src="/brand/logo.png" alt="Hill Country Cider House" width={66} height={77} style={{ objectFit: 'contain', width: 66, height: 'auto', margin: '0 auto 16px' }} />
          <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 32, fontWeight: 400, color: 'var(--ink)', margin: '0 0 8px' }}>
            Welcome to the Club
          </h1>
          <div style={{ fontSize: 10, letterSpacing: '0.22em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--terracotta)' }}>
            HILL COUNTRY CIDER HOUSE · EST. 2020
          </div>
        </div>

        {/* Perforation */}
        <div style={{ position: 'relative', borderTop: '1px dashed var(--rule-strong)' }}>
          <div style={{ position: 'absolute', top: -14, left: -14, width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--paper)' }} />
          <div style={{ position: 'absolute', top: -14, right: -14, width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--paper)' }} />
        </div>

        {/* Step content */}
        <div style={{ padding: '32px 40px 40px' }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(182,90,60,0.08)', border: '1px solid rgba(182,90,60,0.3)', color: 'var(--terracotta-deep)', padding: '12px 16px', marginBottom: 24, fontSize: 14 }}>
              {error}
            </div>
          )}

          {/* ── Step 1: Your Details ─────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={goToStep2}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 26, fontWeight: 400, color: 'var(--ink)', margin: '0 0 6px' }}>
                Tell us who you are
              </h2>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 28px' }}>
                We'll send a magic link — no passwords to forget.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="First Name" required value={form.firstName} onChange={(e) => update('firstName', e.target.value)} placeholder="Jane" />
                  <Field label="Last Name" required value={form.lastName} onChange={(e) => update('lastName', e.target.value)} placeholder="Doe" />
                </div>
                <Field label="Email" required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="jane@example.com" hint="Pickup reminders and your magic link land here." />
                <Field label="Phone" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="(512) 555-0100" hint="Optional — text reminders for pickup parties." />
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                  <Field label="City" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Comfort" />
                  <Field label="State" value={form.state} onChange={(e) => update('state', e.target.value)} placeholder="TX" maxLength={2} />
                  <Field label="ZIP" value={form.zip} onChange={(e) => update('zip', e.target.value)} placeholder="78013" />
                </div>
              </div>

              <button type="submit" className="btn-saloon" disabled={!form.firstName || !form.lastName || !form.email}
                style={{ width: '100%', marginTop: 32, justifyContent: 'center', opacity: (!form.firstName || !form.lastName || !form.email) ? 0.45 : 1 }}>
                Next: Pick Your Tier →
              </button>
            </form>
          )}

          {/* ── Step 2: Pick Your Tier ──────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={SQUARE_APP_ID ? goToStep3 : handleSubmit}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 26, fontWeight: 400, color: 'var(--ink)', margin: '0 0 6px' }}>
                Pick your tier
              </h2>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 24px' }}>
                Billed each quarter at pickup. Pause anytime.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {plans.map((plan, i) => {
                  const selected = form.planId === plan.id
                  const featured = i === 1
                  return (
                    <div key={plan.id} onClick={() => update('planId', plan.id)}
                      style={{
                        display: 'flex', gap: 16, padding: '20px', cursor: 'pointer',
                        border: `1px solid ${selected ? 'var(--terracotta)' : 'var(--rule)'}`,
                        backgroundColor: selected ? 'rgba(182,90,60,0.04)' : 'transparent',
                        transition: 'border-color 0.15s',
                      }}>
                      {/* Diamond checkbox */}
                      <div style={{ paddingTop: 4, flexShrink: 0 }}>
                        <div style={{
                          width: 18, height: 18, transform: 'rotate(45deg)',
                          border: `2px solid ${selected ? 'var(--terracotta)' : 'var(--rule-strong)'}`,
                          backgroundColor: selected ? 'var(--terracotta)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {selected && <span style={{ transform: 'rotate(-45deg)', fontSize: 8, color: 'var(--cream)', fontWeight: 700 }}>✓</span>}
                        </div>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center flex-wrap gap-2" style={{ marginBottom: 4 }}>
                          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--ink)' }}>
                            {TIER_NAMES[i] ?? plan.name}
                          </span>
                          <span style={{ fontSize: 9, letterSpacing: '0.16em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gold-deep)' }}>
                            {TIER_LEVELS[i] ?? ''}
                          </span>
                          {featured && (
                            <span style={{ fontSize: 9, letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--terracotta)', border: '1px solid var(--terracotta)', padding: '2px 7px' }}>
                              MOST PICKED
                            </span>
                          )}
                        </div>
                        {selected && (
                          <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {(TIER_PERKS[i] ?? []).map((perk) => (
                              <li key={perk} style={{ display: 'flex', alignItems: 'baseline', gap: 7, fontSize: 12, color: 'var(--ink-soft)' }}>
                                <span style={{ color: 'var(--terracotta)', fontSize: 9, flexShrink: 0 }}>✦</span>
                                {perk}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Bottle count */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 36, color: selected ? 'var(--terracotta)' : 'var(--ink)', lineHeight: 1 }}>
                          {TIER_BOTTLES[i] ?? plan.packsPerOrder}
                        </div>
                        <div style={{ fontSize: 9, letterSpacing: '0.14em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginTop: 3 }}>
                          bottles
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Referral code */}
              <Field label="Referral Code" value={form.referralCode} onChange={(e) => update('referralCode', e.target.value)} placeholder="Optional" />

              <div className="flex items-center gap-3" style={{ marginTop: 28 }}>
                <button type="button" onClick={() => setStep(1)} className="btn-ghost-navy" style={{ color: 'var(--navy)', border: '1px solid var(--navy)' }}>
                  ← Back
                </button>
                <button type="submit" className="btn-saloon" disabled={!form.planId || loading}
                  style={{ flex: 1, justifyContent: 'center', opacity: !form.planId ? 0.45 : 1 }}>
                  {SQUARE_APP_ID ? 'Next: Card on File →' : loading ? 'Joining…' : 'Saddle Up — Join the Club'}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: Card on File ────────────────────────────────── */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 26, fontWeight: 400, color: 'var(--ink)', margin: '0 0 6px' }}>
                Card on file
              </h2>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 24px' }}>
                We won't charge a penny today. Your card is billed when you pick up your quarterly box.
              </p>

              {/* Square card wrapper */}
              <div style={{ border: '1px solid var(--rule)', backgroundColor: 'var(--paper)', padding: 24, marginBottom: 16 }}>
                <div id="square-card-container" style={{ minHeight: 90 }} />
                <p style={{ fontSize: 11, color: 'var(--ink-soft)', margin: '16px 0 0' }}>
                  🔒 Card info is securely stored by Square. We never see your full card number.
                </p>
              </div>

              {/* Order summary */}
              {selectedPlan && (
                <div style={{ backgroundColor: 'var(--navy)', padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--cream)' }}>
                    {TIER_NAMES[selectedPlanIdx] ?? selectedPlan.name}
                  </span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--gold-bright)' }}>
                    {TIER_BOTTLES[selectedPlanIdx] ?? selectedPlan.packsPerOrder} bottles / quarter
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setStep(2)} className="btn-ghost-navy" style={{ color: 'var(--navy)', border: '1px solid var(--navy)' }}>
                  ← Back
                </button>
                <button type="submit" className="btn-saloon" disabled={loading}
                  style={{ flex: 1, justifyContent: 'center', opacity: loading ? 0.65 : 1 }}>
                  {loading ? 'Joining…' : 'Saddle Up — Join the Club'}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>

      <Link href="/" style={{ marginTop: 24, fontSize: 10, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', textDecoration: 'none', opacity: 0.55 }}>
        ← Back to Hill Country Cider House
      </Link>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  )
}
