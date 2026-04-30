'use client'

import { useEffect, useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { CreditCard, User } from 'lucide-react'

type MemberProfile = {
  id: string; firstName: string; lastName: string; email: string; phone: string | null
  address1: string | null; city: string | null; state: string | null; zip: string | null
  squareCardId: string | null; plan: { name: string; priceInCents: number }
  status: string
}

export default function MemberProfilePage() {
  const [member, setMember] = useState<MemberProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<MemberProfile>>({})

  useEffect(() => {
    fetch('/api/members/me')
      .then((r) => r.json())
      .then((data) => {
        setMember(data.member)
        setForm(data.member)
      })
      .finally(() => setLoading(false))
  }, [])

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
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
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Plan</span>
            <span className="font-medium text-stone-800">{member.plan.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Quarterly price</span>
            <span className="font-medium text-stone-800">
              ${(member.plan.priceInCents / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Status</span>
            <span className={`font-medium ${
              member.status === 'ACTIVE' ? 'text-green-700' :
              member.status === 'PAUSED' ? 'text-yellow-700' : 'text-red-700'
            }`}>{member.status}</span>
          </div>
        </div>
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--rule)' }}>
          <p className="text-xs text-stone-500">
            To pause or cancel your membership, email us or contact us directly.
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

      {/* Payment method */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" style={{ color: 'var(--ink-soft)' }} />
            <CardTitle>Payment Method</CardTitle>
          </div>
        </CardHeader>
        {member.squareCardId ? (
          <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: 'var(--cream-deep)' }}>
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-stone-400" />
              <span className="text-sm font-medium text-stone-700">Card on file</span>
            </div>
            <span className="text-xs text-stone-400">Managed via Square</span>
          </div>
        ) : (
          <div className="border border-dashed p-4 text-center" style={{ borderColor: 'var(--rule-strong)' }}>
            <CreditCard className="mx-auto h-8 w-8 text-stone-300 mb-2" />
            <p className="text-sm text-stone-500">No payment method on file</p>
            <p className="text-xs text-stone-400 mt-1">
              We'll collect your payment at pickup or send a payment link.
            </p>
          </div>
        )}
        <p className="mt-3 text-xs text-stone-400">
          To update your payment method, contact us directly.
        </p>
      </Card>
    </div>
  )
}
