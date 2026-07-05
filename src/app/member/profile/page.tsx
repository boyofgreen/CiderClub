'use client'

import { useEffect, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { User, Bell } from 'lucide-react'
import { PaymentMethodCard } from './PaymentMethodCard'
import { formatCents } from '@/lib/utils'

type MemberProfile = {
  id: string; firstName: string; lastName: string; email: string; phone: string | null
  address1: string | null; city: string | null; state: string | null; zip: string | null
  squareCardId: string | null; planId: string; plan: { name: string; priceInCents: number; packsPerOrder: number }
  status: string; eventAlertsOptIn: boolean
}

type Plan = {
  id: string; name: string; description: string | null
  packsPerOrder: number; priceInCents: number; maxCapacity: number | null
  _count?: { members: number }
}

export default function MemberProfilePage() {
  const [member, setMember] = useState<MemberProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<MemberProfile>>({})

  // Plan switching
  const [plans, setPlans] = useState<Plan[]>([])
  const [showPlans, setShowPlans] = useState(false)
  const [switchingTo, setSwitchingTo] = useState<string | null>(null)
  const [planMessage, setPlanMessage] = useState<string | null>(null)
  const [planError, setPlanError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/members/me')
      .then((r) => r.json())
      .then((data) => {
        setMember(data.member)
        setForm(data.member)
      })
      .finally(() => setLoading(false))
    fetch('/api/plans')
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []))
      .catch(() => {})
  }, [])

  async function switchPlan(plan: Plan) {
    if (!window.confirm(
      `Switch to ${plan.name} (${formatCents(plan.priceInCents)}/quarter)? ` +
      `Your new plan takes effect with your next quarterly box.`
    )) return
    setSwitchingTo(plan.id)
    setPlanError(null)
    setPlanMessage(null)
    const res = await fetch('/api/members/me/change-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: plan.id }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setMember(data.member)
      setShowPlans(false)
      setPlanMessage(`You're now on ${plan.name}. It takes effect with your next quarterly box.`)
    } else {
      setPlanError(data.error ?? 'Could not switch plans. Please try again.')
    }
    setSwitchingTo(null)
  }

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function toggleEventAlerts(next: boolean) {
    setForm((f) => ({ ...f, eventAlertsOptIn: next }))
    await fetch('/api/members/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventAlertsOptIn: next }),
    }).catch(() => {
      // revert on failure
      setForm((f) => ({ ...f, eventAlertsOptIn: !next }))
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/members/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        address1: form.address1,
        city: form.city,
        state: form.state,
        zip: form.zip,
      }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError('Failed to save. Please try again.')
    }
    setSaving(false)
  }

  if (loading) return <div className="py-12 text-center"><Spinner className="mx-auto" /></div>
  if (!member) return <Alert type="error" message="Could not load profile." />

  return (
    <div className="max-w-2xl space-y-6">
      <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,3vw,30px)', color: 'var(--ink)' }}>
        My Profile
      </h1>

      {/* Membership info */}
      <Card>
        <CardHeader>
          <CardTitle>Membership</CardTitle>
        </CardHeader>

        {planMessage && <Alert type="success" message={planMessage} className="mb-4" />}
        {planError && <Alert type="error" message={planError} className="mb-4" />}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Plan</span>
            <span className="font-medium text-stone-800">
              {member.plan.name}
              <span className="text-stone-400 font-normal"> · {formatCents(member.plan.priceInCents)}/quarter</span>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Ciders per box</span>
            <span className="font-medium text-stone-800">{member.plan.packsPerOrder}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Status</span>
            <span className={`font-medium ${
              member.status === 'ACTIVE' ? 'text-green-700' :
              member.status === 'PAUSED' ? 'text-yellow-700' : 'text-red-700'
            }`}>{member.status}</span>
          </div>
        </div>

        {/* Plan switcher */}
        {member.status === 'ACTIVE' && plans.length > 1 && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--rule)' }}>
            {!showPlans ? (
              <Button variant="secondary" size="sm" onClick={() => setShowPlans(true)}>
                Change Plan
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-stone-800">Choose your new plan</p>
                  <button onClick={() => setShowPlans(false)} className="text-xs text-stone-400 hover:text-stone-600">
                    Cancel
                  </button>
                </div>
                {plans.map((plan) => {
                  const isCurrent = plan.id === member.planId
                  const isFull = plan.maxCapacity != null && (plan._count?.members ?? 0) >= plan.maxCapacity && !isCurrent
                  return (
                    <div
                      key={plan.id}
                      className={`flex items-center justify-between gap-3 border p-3 ${isCurrent ? '' : 'bg-white'}`}
                      style={{
                        borderColor: isCurrent ? 'var(--terracotta)' : 'var(--rule)',
                        backgroundColor: isCurrent ? 'var(--cream-deep)' : undefined,
                      }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-900">
                          {plan.name}
                          {isCurrent && <span className="ml-2 text-xs font-medium text-terracotta">Current plan</span>}
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {plan.packsPerOrder} ciders per quarter · {formatCents(plan.priceInCents)}/quarter
                        </p>
                        {plan.description && <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{plan.description}</p>}
                      </div>
                      {!isCurrent && (
                        <Button
                          size="sm"
                          variant="saloon"
                          disabled={isFull || switchingTo !== null}
                          loading={switchingTo === plan.id}
                          onClick={() => switchPlan(plan)}
                        >
                          {isFull ? 'Full' : 'Switch'}
                        </Button>
                      )}
                    </div>
                  )
                })}
                <p className="text-xs text-stone-400 italic">
                  Plan changes take effect with your next quarterly box — your current quarter isn't affected.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--rule)' }}>
          <p className="text-xs text-stone-500">
            Need to cancel? You can cancel your plan after 4 quarters — just reach out to{' '}
            <a href="mailto:hello@hillcountryciderhouse.com" className="text-terracotta underline">
              hello@hillcountryciderhouse.com
            </a>{' '}
            and we'll take care of it.
          </p>
        </div>
      </Card>

      {/* Personal info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" style={{ color: 'var(--ink-soft)' }} />
            <CardTitle>Personal Information</CardTitle>
          </div>
        </CardHeader>

        {saved && <Alert type="success" message="Profile updated successfully!" className="mb-4" />}
        {error && <Alert type="error" message={error} className="mb-4" />}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              value={form.firstName ?? ''}
              onChange={(e) => update('firstName', e.target.value)}
              required
            />
            <Input
              label="Last name"
              value={form.lastName ?? ''}
              onChange={(e) => update('lastName', e.target.value)}
              required
            />
          </div>
          <Input
            label="Email address"
            type="email"
            value={form.email ?? ''}
            disabled
            hint="Email cannot be changed here. Contact us to update."
          />
          <Input
            label="Phone number"
            type="tel"
            value={form.phone ?? ''}
            onChange={(e) => update('phone', e.target.value)}
          />
          <Input
            label="Street address"
            value={form.address1 ?? ''}
            onChange={(e) => update('address1', e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="City"
              value={form.city ?? ''}
              onChange={(e) => update('city', e.target.value)}
            />
            <Input
              label="State"
              value={form.state ?? ''}
              onChange={(e) => update('state', e.target.value)}
              maxLength={2}
            />
            <Input
              label="ZIP"
              value={form.zip ?? ''}
              onChange={(e) => update('zip', e.target.value)}
            />
          </div>
          <Button variant="saloon" type="submit" loading={saving}>
            Save Changes
          </Button>
        </form>
      </Card>

      {/* Notification preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" style={{ color: 'var(--ink-soft)' }} />
            <CardTitle>Notifications</CardTitle>
          </div>
        </CardHeader>
        <label className="flex items-start justify-between gap-4 cursor-pointer">
          <span>
            <span className="block text-sm font-medium text-stone-800">Event alerts</span>
            <span className="block text-xs text-stone-500 mt-0.5">
              Get an email when we announce club events — release parties, tastings, and pickups.
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={!!form.eventAlertsOptIn}
            onClick={() => toggleEventAlerts(!form.eventAlertsOptIn)}
            className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition"
            style={{ backgroundColor: form.eventAlertsOptIn ? 'var(--terracotta)' : 'var(--rule)' }}
          >
            <span
              className="inline-block h-5 w-5 transform rounded-full bg-white transition"
              style={{ transform: form.eventAlertsOptIn ? 'translateX(22px)' : 'translateX(2px)' }}
            />
          </button>
        </label>
      </Card>

      {/* Payment method */}
      <PaymentMethodCard hasCard={!!member.squareCardId} />
    </div>
  )
}
