'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Mail, ChevronRight } from 'lucide-react'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [salesTaxPercent, setSalesTaxPercent] = useState('')
  const [adminNotifyEmail, setAdminNotifyEmail] = useState('')
  const [welcomeFollowupFrom, setWelcomeFollowupFrom] = useState('')
  const [legacyDiscountPercent, setLegacyDiscountPercent] = useState('')
  const [legacyMinBottles, setLegacyMinBottles] = useState('')
  const [legacyExpiryQuarters, setLegacyExpiryQuarters] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        setSalesTaxPercent(d.settings?.salesTaxPercent ?? '8.25')
        setAdminNotifyEmail(d.settings?.adminNotifyEmail ?? '')
        setWelcomeFollowupFrom(d.settings?.welcomeFollowupFrom ?? '')
        setLegacyDiscountPercent(d.settings?.legacyDiscountPercent ?? '10')
        setLegacyMinBottles(d.settings?.legacyMinBottles ?? '3')
        setLegacyExpiryQuarters(d.settings?.legacyExpiryQuarters ?? '4')
      })
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setError(null)
    setSuccess(null)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salesTaxPercent, adminNotifyEmail, welcomeFollowupFrom, legacyDiscountPercent, legacyMinBottles, legacyExpiryQuarters }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setSuccess('Settings saved.')
    } else {
      setError(data.error ?? 'Failed to save settings.')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 'clamp(22px,3vw,30px)',
          color: 'var(--ink)',
        }}
      >
        Settings
      </h1>

      {loading ? (
        <p className="text-stone-500">Loading…</p>
      ) : (
        <Card>
          <h2 className="font-semibold text-stone-900 mb-1">Billing</h2>
          <p className="text-sm text-stone-500 mb-4">
            Tax is applied to all Square orders as a separate &ldquo;Sales Tax&rdquo; line,
            so it shows up correctly in Square&apos;s tax reports for year-end reconciliation.
          </p>

          <div className="space-y-4">
            <Input
              label="Sales tax %"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={salesTaxPercent}
              onChange={(e) => setSalesTaxPercent(e.target.value)}
              hint="Applied to order subtotal (after any member discount). Set to 0 to disable."
            />
          </div>

          <h2 className="font-semibold text-stone-900 mb-1 mt-8">Legacy Club</h2>
          <p className="text-sm text-stone-500 mb-4">
            Legacy members don&apos;t get an automatic quarterly order. They&apos;re invited to
            build one each quarter at this discount, with none of the other club benefits.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Legacy order discount %"
              type="number"
              step="1"
              min="0"
              max="100"
              value={legacyDiscountPercent}
              onChange={(e) => setLegacyDiscountPercent(e.target.value)}
              hint="Applies to orders started after you save."
            />
            <Input
              label="Minimum bottles per legacy order"
              type="number"
              step="1"
              min="1"
              value={legacyMinBottles}
              onChange={(e) => setLegacyMinBottles(e.target.value)}
              hint="Fewest bottles a legacy member can order."
            />
            <Input
              label="Quarters without an order before final notice"
              type="number"
              step="1"
              min="0"
              value={legacyExpiryQuarters}
              onChange={(e) => setLegacyExpiryQuarters(e.target.value)}
              hint="After this many passed-up offers, the next invitation is a final notice. If they skip that too, the membership is cancelled when the following quarter's orders are generated. 0 = never expire."
            />
          </div>

          <h2 className="font-semibold text-stone-900 mb-1 mt-8">Notifications</h2>
          <p className="text-sm text-stone-500 mb-4">
            Controls the internal new-member alert and the personal welcome email.
          </p>
          <div className="space-y-4">
            <Input
              label="New-member alert recipient"
              type="email"
              value={adminNotifyEmail}
              onChange={(e) => setAdminNotifyEmail(e.target.value)}
              placeholder="you@hillcountryciderhouse.com"
              hint="Where the 'new member joined' email is sent. Defaults to the first admin email if blank."
            />
            <Input
              label="Personal welcome — from address"
              value={welcomeFollowupFrom}
              onChange={(e) => setWelcomeFollowupFrom(e.target.value)}
              placeholder="JB <jb@hillcountryciderhouse.com>"
              hint="The 24-hour personal welcome is sent from this address so replies reach you. Must be a verified Resend sender."
            />
          </div>

          {error && <Alert type="error" message={error} className="mt-4" />}
          {success && <Alert type="success" message={success} className="mt-4" />}

          <div className="mt-5 flex justify-end">
            <Button variant="saloon" onClick={save} loading={saving}>
              Save settings
            </Button>
          </div>
        </Card>
      )}

      {/* Email message editor link */}
      <Link href="/admin/settings/emails" className="block">
        <Card className="hover:bg-cream-deep transition">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-terracotta shrink-0" />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-stone-900">Email Messages</h2>
              <p className="text-sm text-stone-500">
                Edit the wording of every automated email — welcome, order, receipt, reminders, and event alerts.
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-stone-400 shrink-0" />
          </div>
        </Card>
      </Link>
    </div>
  )
}
