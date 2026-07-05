'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { formatCents } from '@/lib/utils'
import { Beer, Plus, Pencil, X, RefreshCw } from 'lucide-react'

type Product = {
  id: string; name: string; slug: string; description: string | null
  style: string | null; abv: number | null; priceInCents: number
  isActive: boolean; sortOrder: number; squareItemId: string | null
  imageUrl: string | null
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
  const [form, setForm] = useState({ name: '', description: '', style: '', abv: '', priceInCents: '2100', sortOrder: '0', imageUrl: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const refresh = () =>
    fetch('/api/products').then((r) => r.json()).then((d) => setProducts(d.products ?? [])).finally(() => setLoading(false))

  useEffect(() => { refresh() }, [])

  function openNew() {
    setForm({ name: '', description: '', style: '', abv: '', priceInCents: '2100', sortOrder: '0', imageUrl: '' })
    setModal('new')
    setError(null)
  }

  function openEdit(p: Product) {
    setForm({ name: p.name, description: p.description ?? '', style: p.style ?? '', abv: p.abv?.toString() ?? '', priceInCents: (p.priceInCents ?? 2100).toString(), sortOrder: p.sortOrder.toString(), imageUrl: p.imageUrl ?? '' })
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
      name: form.name, description: form.description || null, style: form.style || null,
      abv: form.abv ? parseFloat(form.abv) : null,
      priceInCents: parseInt(form.priceInCents) || 2100,
      sortOrder: parseInt(form.sortOrder),
      imageUrl: form.imageUrl.trim() || null,
    }
    const url = isNew ? '/api/products' : `/api/products/${(modal as Product).id}`
    const res = await fetch(url, { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
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
      setSyncMessage(`Synced from Square: ${data.created} created, ${data.updated} updated, ${data.skipped} skipped (${data.total} total).${data.errors?.length ? ` Errors: ${(data.errors as string[]).join('; ')}` : ''}`)
      await refresh()
    } else {
      setError(data.error ?? 'Sync failed — check server logs for details.')
    }
    setSyncing(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch(`/api/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !current }) })
    await refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,3vw,30px)', color: 'var(--ink)' }}>
          Products
        </h1>
        <div className="flex gap-2">
          <Button onClick={handleSyncFromSquare} loading={syncing} variant="secondary" size="sm">
            <RefreshCw className="h-4 w-4" /> Sync from Square
          </Button>
          <Button variant="saloon" onClick={openNew} size="sm">
            <Plus className="h-4 w-4" /> New Product
          </Button>
        </div>
      </div>

      {syncMessage && <Alert type="success" message={syncMessage} />}
      {error && !modal && <Alert type="error" message={error} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div
            key={p.id}
            className={`border overflow-hidden flex flex-col ${!p.isActive ? 'opacity-60' : ''}`}
            style={{ backgroundColor: 'var(--paper)', borderColor: 'var(--rule)' }}
          >
            {/* Label image */}
            <div
              className="relative w-full"
              style={{ aspectRatio: '4 / 3', backgroundColor: 'var(--cream-deep)' }}
            >
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                  <Beer className="h-8 w-8 text-gold-deep opacity-60" />
                  <span className="text-[10px] uppercase tracking-widest text-stone-400">No label image</span>
                </div>
              )}
              {/* Hover actions */}
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => openEdit(p)}
                  className="flex h-7 w-7 items-center justify-center bg-white/90 text-stone-500 hover:text-terracotta shadow-sm transition"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => toggleActive(p.id, p.isActive)}
                  className="flex h-7 items-center justify-center bg-white/90 px-2 text-xs font-medium text-stone-500 hover:text-stone-700 shadow-sm transition"
                >
                  {p.isActive ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="p-4 flex-1">
              <h3 className="font-semibold text-stone-900">{p.name}</h3>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {p.style && <span className="bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{p.style}</span>}
                <span className="bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                  {p.abv != null ? `${p.abv}% ABV` : '— ABV'}
                </span>
                <span className="bg-green-100 px-2 py-0.5 text-xs text-green-700 font-medium">
                  {formatCents(p.priceInCents ?? 2100)}
                </span>
              </div>
              {p.description && <p className="mt-2 text-xs text-stone-500 line-clamp-2">{p.description}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-cream-paper p-6 shadow-xl" style={{ border: '1px solid var(--rule)' }}>
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
              <Input label="Price (cents)" type="number" value={form.priceInCents} onChange={(e) => setForm({ ...form, priceInCents: e.target.value })} disabled={priceFromSquare} hint={priceFromSquare ? 'Set in Square — sync to update' : 'e.g. 2100 = $21.00'} />
              <Input label="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" hint="Label photo. Auto-filled by Sync from Square when the item has an image." />
              {form.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.imageUrl} alt="Preview" className="h-24 w-24 object-cover border" style={{ borderColor: 'var(--rule)' }} />
              )}
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Cancel</Button>
              <Button variant="saloon" onClick={handleSave} loading={saving} className="flex-1">Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
