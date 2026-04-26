'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Beer, Star, X, Plus, Minus, Pencil, Save } from 'lucide-react'

type Product = { id: string; name: string; style: string | null }
type Plan = { id: string; name: string; packsPerOrder: number; discountPercent: number }
type QuarterProduct = { id: string; productId: string; isDefault: boolean; product: Product }
type PlanDefault = {
  id: string
  planId: string
  productId: string
  quantity: number
  product: Product
  plan: Plan
}

export function ProductsTab({
  quarterId,
  quarterProducts,
  allProducts,
  allPlans,
  planDefaults,
}: {
  quarterId: string
  quarterProducts: QuarterProduct[]
  allProducts: Product[]
  allPlans: Plan[]
  planDefaults: PlanDefault[]
}) {
  const router = useRouter()
  const [saving, setSaving] = useState<string | null>(null)
  const [addModal, setAddModal] = useState(false)
  const [selectedToAdd, setSelectedToAdd] = useState<string>('')
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [planSelections, setPlanSelections] = useState<Record<string, number>>({})

  const addedIds = new Set(quarterProducts.map((qp) => qp.productId))
  const available = allProducts.filter((p) => !addedIds.has(p.id))
  const defaultsByPlan = groupBy(planDefaults, (d) => d.planId)

  async function toggleDefault(qp: QuarterProduct) {
    setSaving(qp.id)
    await fetch(`/api/quarters/${quarterId}/products`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quarterProductId: qp.id, isDefault: !qp.isDefault }),
    })
    setSaving(null)
    router.refresh()
  }

  async function removeProduct(qp: QuarterProduct) {
    setSaving(qp.id)
    await fetch(`/api/quarters/${quarterId}/products?quarterProductId=${qp.id}`, {
      method: 'DELETE',
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

  function openPlanEditor(plan: Plan) {
    const initial: Record<string, number> = {}
    for (const d of defaultsByPlan[plan.id] ?? []) {
      initial[d.productId] = d.quantity
    }
    setPlanSelections(initial)
    setEditingPlanId(plan.id)
  }

  function adjustSelection(productId: string, delta: number, plan: Plan) {
    setPlanSelections((prev) => {
      const current = prev[productId] ?? 0
      const next = Math.max(0, current + delta)
      const totalAfter = Object.entries(prev).reduce(
        (sum, [id, q]) => sum + (id === productId ? next : q),
        0
      )
      if (totalAfter > plan.packsPerOrder) return prev
      return { ...prev, [productId]: next }
    })
  }

  async function savePlanDefaults() {
    if (!editingPlanId) return
    setSaving(editingPlanId)
    const items = Object.entries(planSelections)
      .filter(([, q]) => q > 0)
      .map(([productId, quantity]) => ({ productId, quantity }))

    await fetch(`/api/quarters/${quarterId}/plan-defaults`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: editingPlanId, items }),
    })
    setSaving(null)
    setEditingPlanId(null)
    setPlanSelections({})
    router.refresh()
  }

  const editingPlan = allPlans.find((p) => p.id === editingPlanId) ?? null
  const selectionTotal = Object.values(planSelections).reduce((s, q) => s + q, 0)

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-stone-900">Products ({quarterProducts.length})</h2>
        <Button size="sm" variant="secondary" onClick={() => setAddModal(true)}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {quarterProducts.length === 0 ? (
        <p className="text-sm text-stone-400 py-4 text-center">No products added yet.</p>
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
                title={qp.isDefault ? 'Default for everyone (click to unset)' : 'Set as fallback default'}
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
                onClick={() => removeProduct(qp)}
                disabled={saving === qp.id}
                className="flex h-7 w-7 items-center justify-center rounded-full text-stone-300 hover:bg-red-50 hover:text-red-500 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-stone-400">
        ⭐ Star = fallback default for any plan without its own picks below.
      </p>

      {/* Per-plan defaults */}
      {allPlans.length > 0 && (
        <div className="mt-6 border-t border-stone-100 pt-4">
          <h3 className="font-semibold text-stone-900 mb-3">Per-Plan Defaults</h3>
          <div className="space-y-3">
            {allPlans.map((plan) => {
              const planDefaultsList = defaultsByPlan[plan.id] ?? []
              const totalQty = planDefaultsList.reduce((s, d) => s + d.quantity, 0)
              return (
                <div key={plan.id} className="rounded-lg border border-stone-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{plan.name}</p>
                      <p className="text-xs text-stone-400">
                        {plan.packsPerOrder} bottles · {plan.discountPercent}% discount
                      </p>
                    </div>
                    <button
                      onClick={() => openPlanEditor(plan)}
                      className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600 hover:bg-stone-50 transition"
                    >
                      <Pencil className="h-3 w-3" />
                      {planDefaultsList.length === 0 ? 'Set picks' : 'Edit'}
                    </button>
                  </div>
                  {planDefaultsList.length === 0 ? (
                    <p className="text-xs text-stone-400 italic">
                      No picks set — falls back to starred products above.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {planDefaultsList.map((d) => (
                        <span
                          key={d.id}
                          className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700"
                        >
                          <Beer className="h-3 w-3" />
                          {d.product.name} ×{d.quantity}
                        </span>
                      ))}
                      <span className="ml-auto text-xs text-stone-400">
                        {totalQty}/{plan.packsPerOrder}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add-product modal */}
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

      {/* Plan-defaults editor modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-stone-900">{editingPlan.name} — Defaults</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Pick {editingPlan.packsPerOrder} bottles for new orders on this plan.
                </p>
              </div>
              <button onClick={() => setEditingPlanId(null)}>
                <X className="h-5 w-5 text-stone-400" />
              </button>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <span className={`text-sm font-bold ${selectionTotal === editingPlan.packsPerOrder ? 'text-green-600' : 'text-brand-600'}`}>
                {selectionTotal}/{editingPlan.packsPerOrder} selected
              </span>
              <button
                onClick={() => setPlanSelections({})}
                className="text-xs text-stone-400 hover:text-stone-600"
              >
                Clear all
              </button>
            </div>
            <div className="h-2 rounded-full bg-stone-100 mb-4">
              <div
                className={`h-2 rounded-full transition-all ${selectionTotal === editingPlan.packsPerOrder ? 'bg-green-500' : 'bg-brand-500'}`}
                style={{ width: `${Math.min(100, (selectionTotal / editingPlan.packsPerOrder) * 100)}%` }}
              />
            </div>

            <div className="space-y-2">
              {quarterProducts.length === 0 ? (
                <p className="text-sm text-stone-400 py-4 text-center">
                  Add products to this quarter first.
                </p>
              ) : (
                quarterProducts.map((qp) => {
                  const qty = planSelections[qp.productId] ?? 0
                  return (
                    <div key={qp.id} className="flex items-center gap-3 rounded-lg border border-stone-200 px-3 py-2">
                      <Beer className="h-4 w-4 text-brand-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">{qp.product.name}</p>
                        {qp.product.style && (
                          <p className="text-xs text-stone-400">{qp.product.style}</p>
                        )}
                      </div>
                      <button
                        onClick={() => adjustSelection(qp.productId, -1, editingPlan)}
                        disabled={qty === 0}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 text-stone-600 hover:bg-stone-50 disabled:opacity-30"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center text-sm font-bold text-stone-900">{qty}</span>
                      <button
                        onClick={() => adjustSelection(qp.productId, 1, editingPlan)}
                        disabled={selectionTotal >= editingPlan.packsPerOrder}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 text-stone-600 hover:bg-stone-50 disabled:opacity-30"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="secondary" onClick={() => setEditingPlanId(null)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={savePlanDefaults}
                loading={saving === editingPlanId}
                disabled={selectionTotal !== editingPlan.packsPerOrder && selectionTotal !== 0}
                className="flex-1"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
            {selectionTotal === 0 && (
              <p className="mt-2 text-xs text-stone-400 text-center">
                Saving with 0 picks clears the plan's defaults (falls back to starred).
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

function groupBy<T, K extends string | number>(arr: T[], key: (item: T) => K): Record<K, T[]> {
  const out = {} as Record<K, T[]>
  for (const item of arr) {
    const k = key(item)
    if (!out[k]) out[k] = []
    out[k].push(item)
  }
  return out
}
