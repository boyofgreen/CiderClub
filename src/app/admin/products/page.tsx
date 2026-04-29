'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { formatCents } from '@/lib/utils'
import { Beer, Plus, Pencil, X, RefreshCw } from 'lucide-react'

type Product = {
  id: string; name: string; slug: string; description: string | null
  style: string | null; abv: number | null; priceInCents: number
  isActive: boolean; sortOrder: number; squareItemId: string | null
  _count?: { orderItems: number }
}

const styleOptions = [
  { value: '', label: 'No style' },
  { value: 'dry', label: 'Dry' },
  { value: 'semi-sweet', label: 'Semi-Sweet' },
  { value: 'sweet', label: 'Sweet' },
  { value: 'hopped', label: 'Hopped' },
  { value: 'botanical', label: 'Botanical' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'fruit', label: 'Fruit' },
  { value: 'sparkling', label: 'Sparkling' },
]

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Product | null | 'new'>(null)
  const [form, setForm] = useState({ name: '', description: '', style: '', abv: '', priceInCents: '2100', sortOrder: '0' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const refresh = () =>
    fetch('/api/products').then((r) => r.json()).then((d) => setProducts(d.products ?? [])).finally(() => setLoading(false))

  useEffect(() => { refresh() }, [])

  function openNew() {
    setForm({ name: '', description: '', style: '', abv: '', priceInCents: '2100', sortOrder: '0' })
    setModal('new')
    setError(null)
  }

  function openEdit(p: Product) {
    setForm({ name: p.name, description: p.description ?? '', style: p.style ?? '', abv: p.abv?.toString() ?? '', priceInCents: (p.priceInCents ?? 2100).toString(), sortOrder: p.sortOrder.toString() })
    setModal(p)
    setError(null)
  }

  const editingProduct = modal !== 'new' && modal !== null ? modal as Product : null
  const priceFromSquare = !!editingProduct?.squareItemId

  async function handleSave() {
    setSaving(true)
    setError(null)
    const isNew = modal === 'new'
    const body = {
      name: form.name,
      description: form.description || null,
      style: form.style || null,
      abv: form.abv ? parseFloat(form.abv) : null,
      priceInCents: parseInt(form.priceInCents) || 2100,
      sortOrder: parseInt(form.sortOrder),
    }
    const url = isNew ? '/api/products' : `/api/products/${(modal as Product).id}`
    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) { await refresh(); setModal(null) }
    else setError(data.error ?? 'Failed')
    setSaving(false)
  }

  async function handleSyncFromSquare() {
    setSyncing(true)
    setSyncMessage(null)
    setError(null)
    const res = await fetch('/api/products/sync-from-square', { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      const parts = [`Synced from Square: ${data.created} created, ${data.updated} updated, ${data.skipped} skipped (${data.total} total).`]
      if (data.errors?.length) parts.push(`Errors: ${(data.errors as string[]).join('; ')}`)
      setSyncMessage(parts.join(' '))
      await refresh()
    } else {
      setError(data.error ?? 'Sync failed — check server logs for details.')
    }
    setSyncing(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    })
    await refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Products</h1>
        <div className="flex gap-2">
          <Button onClick={handleSyncFromSquare} loading={syncing} variant="secondary" size="sm">
            <RefreshCw className="h-4 w-4" /> Sync from Square
          </Button>
          <Button onClick={openNew} size="sm">
            <Plus className="h-4 w-4" /> New Product
          </Button>
        </div>
      </div>

      {syncMessage && <Alert type="success" message={syncMessage} />}
      {error && !modal && <Alert type="error" message={error} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className={`rounded-xl border p-5 ${p.isActive ? 'border-stone-200 bg-white' : 'border-stone-200 bg-stone-50 opacity-60'}`}>
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
                <Beer className="h-5 w-5 text-brand-600" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(p)} className="p-1 text-stone-400 hover:text-brand-600 transition">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => toggleActive(p.id, p.isActive)} className="p-1 text-stone-400 hover:text-stone-600 transition text-xs font-medium">
                  {p.isActive ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-stone-900 mt-2">{p.name}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {p.style && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{p.style}</span>}
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                {p.abv != null ? `${p.abv}% ABV` : '— ABV'}
              </span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 font-medium">
                {formatCents(p.priceInCents ?? 2100)}
              </span>
            </div>
            {p.description && <p className="mt-2 text-xs text-stone-500 line-clamp-2">{p.description}</p>}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900">{modal === 'new' ? 'New Product' : 'Edit Product'}</h3>
              <button onClick={() => setModal(null)}><X className="h-5 w-5 text-stone-400" /></button>
            </div>
            {error && <Alert type="error" message={error} className="mb-3" />}
            <div className="space-y-3">
              <Input label="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="label">Style</label>
                  <select className="input" value={form.style} onChange={(e) => setForm({ ...form, style: e.target.value })}>
                    {styleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <Input label="ABV %" type="number" step="0.1" value={form.abv} onChange={(e) => setForm({ ...form, abv: e.target.value })} />
              </div>
              <Input
                label="Price (cents)"
                type="number"
                value={form.priceInCents}
                onChange={(e) => setForm({ ...form, priceInCents: e.target.value })}
                disabled={priceFromSquare}
                hint={priceFromSquare ? 'Set in Square — sync to update' : 'e.g. 2100 = $21.00'}
              />
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
