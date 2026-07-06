'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'

function suggestSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function NewOrgForm() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<{ name: string; portalUrl: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong — please try again.')
        return
      }
      setCreated({ name: data.org.name, portalUrl: data.portalUrl })
    } catch {
      setError('Something went wrong — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (created) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4 text-center">
        <Alert type="success" title="Your club is ready!" message={`${created.name} has been created.`} />
        <p className="text-sm text-stone-600">
          Your member portal lives at{' '}
          <a href={created.portalUrl} className="font-medium text-brand-600 underline">
            {created.portalUrl}
          </a>
        </p>
        <a href={`${created.portalUrl}/admin/dashboard`}>
          <Button className="w-full">Open your admin dashboard</Button>
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-5">
      {error && <Alert type="error" message={error} />}

      <Input
        label="Club or business name"
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          if (!slugTouched) setSlug(suggestSlug(e.target.value))
        }}
        placeholder="Bluebird Cidery"
        required
        maxLength={80}
      />

      <div className="space-y-1">
        <Input
          label="Club web address"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(suggestSlug(e.target.value))
          }}
          placeholder="bluebird-cidery"
          required
          minLength={3}
          maxLength={48}
          hint={slug ? `Your members will visit ${slug}.cideryclub.app` : 'Lowercase letters, numbers, and hyphens'}
        />
      </div>

      <Button type="submit" loading={submitting} className="w-full">
        Create my club
      </Button>

      <p className="text-xs text-stone-500 text-center">
        Free 30-day trial. No credit card required.
      </p>
    </form>
  )
}
