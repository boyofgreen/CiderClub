'use client'

import { useState, useEffect } from 'react'
import { formatCents } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { Plus, Pencil, X } from 'lucide-react'

type Plan = {
  id: string; name: string; slug: string; description: string | null
  packsPerOrder: number; priceInCents: number; isActive: boolean
  maxCapacity: number | null; sortOrder: number
  _count: { members: number }
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Plan | null | 'new'>(null)
  const [form, setForm] = useState({ name: '', description: '', packsPerOrder: '6', priceInCents: '4500', maxCapacity: '', sortOrder: '0' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/plans').then((r) => r.json()).then((d) => setPlans(d.plans ?? [])).finally(() => setLoading(false))
  }, [])

  function openEdit(plan: Plan) {
    setForm({
      name: plan.name,
      description: plan.description ?? '',
      packsPerOrder: plan.packsPerOrder.toString(),
      priceInCents: plan.priceInCents.toString(),
      maxCapacity: plan.maxCapacity?.toString() ?? '',
      sortOrder: plan.sortOrder.toString(),
    })
    setModal(plan)
    setError(null)
  }

  function openNew() {
    setForm({ name: '', description: '', packsPerOrder: '6', priceInCents: '4500', maxCapacity: '', sortOrder: '0' })
    setModal('new')
    setError(null)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const body = {
      name: form.name,
      description: form.description || null,
      packsPerOrder: parseInt(form.packsPerOrder),
      priceInCents: parseInt(form.priceInCents),
      maxCapacity: form.maxCapacity ? parseInt(form.maxCapacity) : null,
      sortOrder: parseInt(form.sortOrder),
    }
    const isNew = modal === 'new'
    const url = isNew ? '/api/plans' : `/api/plans/${(modal as Plan).id}`
    const method = isNew ? 'POST' : 'PATCH'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      const refreshed = await fetch('/api/plans').then((r) => r.json())
      setPlans(refreshed.plans ?? [])
      setModal(null)
    } else {
      setError(data.error ?? 'Failed to save plan.')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Club Plans</h1>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4" /> New Plan
        </Button>
      </div>

      {loading ? (
        <p className="text-stone-500">Loading…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-stone-900">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-sm text-stone-500 mt-0.5">{plan.description}</p>
                  )}
                </div>
                <button onClick={() => openEdit(plan)} className="text-stone-400 hover:text-brand-600 transition">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Price</span>
                  <span className="font-semibold text-stone-800">{formatCents(plan.priceInCents)}/qtr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Items per order</span>
                  <span className="font-medium text-stone-700">{plan.packsPerOrder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Members</span>
                  <span className="font-medium text-stone-700">{plan._count.members}</span>
                </div>
                {plan.maxCapacity && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Capacity</span>
                    <span className="font-medium text-stone-700">{plan._count.members}/{plan.maxCapacity}</span>
                  </div>
                )}
              </div>
              <div className={`mt-3 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                plan.isActive ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
              }`}>
                {plan.isActive ? 'Active' : 'Inactive'}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900">
                {modal === 'new' ? 'New Plan' : 'Edit Plan'}
              </h3>
              <button onClick={() => setModal(null)}>
                <X className="h-5 w-5 text-stone-400" />
              </button>
            </div>

            {error && <Alert type="error" message={error} className="mb-4" />}

            <div className="space-y-3">
              <Input label="Plan name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Price (cents)" type="number" value={form.priceInCents} onChange={(e) => setForm({ ...form, priceInCents: e.target.value })} hint="e.g. 4500 = $45.00" />
                <Input label="Items per order" type="number" value={form.packsPerOrder} onChange={(e) => setForm({ ...form, packsPerOrder: e.target.value })} />
              </div>
              <Input label="Max capacity (optional)" type="number" value={form.maxCapacity} onChange={(e) => setForm({ ...form, maxCapacity: e.target.value })} hint="Leave blank for unlimited" />
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
