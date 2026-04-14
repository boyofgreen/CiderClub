'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Beer, Star, X, Plus } from 'lucide-react'

type Product = { id: string; name: string; style: string | null }
type QuarterProduct = { id: string; productId: string; isDefault: boolean; product: Product }

export function ProductsTab({
  quarterId,
  quarterProducts,
  allProducts,
}: {
  quarterId: string
  quarterProducts: QuarterProduct[]
  allProducts: Product[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState<string | null>(null)
  const [addModal, setAddModal] = useState(false)
  const [selectedToAdd, setSelectedToAdd] = useState<string>('')

  const addedIds = new Set(quarterProducts.map((qp) => qp.productId))
  const available = allProducts.filter((p) => !addedIds.has(p.id))

  async function toggleDefault(qp: QuarterProduct) {
    setSaving(qp.id)
    await fetch(`/api/quarters/${quarterId}/products`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: qp.productId, isDefault: !qp.isDefault }),
    })
    setSaving(null)
    router.refresh()
  }

  async function removeProduct(productId: string) {
    setSaving(productId)
    await fetch(`/api/quarters/${quarterId}/products`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    })
    setSaving(null)
    router.refresh()
  }

  async function addProduct() {
    if (!selectedToAdd) return
    setSaving(selectedToAdd)
    await fetch(`/api/quarters/${quarterId}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: selectedToAdd }),
    })
    setSaving(null)
    setAddModal(false)
    setSelectedToAdd('')
    router.refresh()
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-stone-900">Products ({quarterProducts.length})</h2>
        <Button size="sm" variant="secondary" onClick={() => setAddModal(true)}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {quarterProducts.length === 0 ? (
        <p className="text-sm text-stone-400 py-4 text-center">
          No products added yet.
        </p>
      ) : (
        <div className="space-y-2">
          {quarterProducts.map((qp) => (
            <div
              key={qp.id}
              className="flex items-center gap-3 rounded-lg border border-stone-200 px-3 py-2.5"
            >
              <Beer className="h-4 w-4 text-brand-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">{qp.product.name}</p>
                {qp.product.style && (
                  <p className="text-xs text-stone-400">{qp.product.style}</p>
                )}
              </div>
              <button
                title={qp.isDefault ? 'Default (click to unset)' : 'Set as default'}
                onClick={() => toggleDefault(qp)}
                disabled={saving === qp.id}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                  qp.isDefault
                    ? 'bg-amber-100 text-amber-600'
                    : 'text-stone-300 hover:text-amber-400'
                }`}
              >
                <Star className="h-4 w-4" fill={qp.isDefault ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => removeProduct(qp.productId)}
                disabled={saving === qp.productId}
                className="flex h-7 w-7 items-center justify-center rounded-full text-stone-300 hover:bg-red-50 hover:text-red-500 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-stone-400">
        ⭐ Star = default product (auto-added to new orders). Members can swap.
      </p>

      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-bold text-stone-900 mb-4">Add Product</h3>
            <select
              className="input w-full"
              value={selectedToAdd}
              onChange={(e) => setSelectedToAdd(e.target.value)}
            >
              <option value="">Select a product…</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => setAddModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={addProduct} loading={saving === selectedToAdd} disabled={!selectedToAdd} className="flex-1">
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
