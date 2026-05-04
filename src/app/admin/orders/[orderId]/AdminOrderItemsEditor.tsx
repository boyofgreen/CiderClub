'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Beer, Minus, Plus, Pencil, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

interface Product { id: string; name: string; style: string | null }
interface CurrentItem { productId: string; quantity: number; product: Product }

export function AdminOrderItemsEditor({
  orderId,
  packsPerOrder,
  currentItems,
  availableProducts,
  lastCustomizedAt,
}: {
  orderId: string
  packsPerOrder: number
  currentItems: CurrentItem[]
  availableProducts: Product[]
  lastCustomizedAt: Date | null
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initialQtys = () => {
    const map: Record<string, number> = {}
    for (const p of availableProducts) map[p.id] = 0
    for (const item of currentItems) map[item.productId] = item.quantity
    return map
  }
  const [qtys, setQtys] = useState<Record<string, number>>(initialQtys)

  const total = Object.values(qtys).reduce((s, q) => s + q, 0)
  const remaining = packsPerOrder - total

  function adjust(productId: string, delta: number) {
    setQtys((prev) => {
      const next = (prev[productId] ?? 0) + delta
      if (next < 0 || next > packsPerOrder) return prev
      return { ...prev, [productId]: next }
    })
  }

  function cancel() {
    setQtys(initialQtys())
    setError(null)
    setEditing(false)
  }

  async function save() {
    setLoading(true)
    setError(null)
    const items = Object.entries(qtys)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }))

    const res = await fetch(`/api/orders/${orderId}/items`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })

    if (res.ok) {
      setEditing(false)
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to save')
    }
    setLoading(false)
  }

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-stone-900">
          Order Items ({currentItems.reduce((s, i) => s + i.quantity, 0)} / {packsPerOrder})
        </h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-sm text-terracotta hover:text-terracotta-deep"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Items
          </button>
        )}
      </div>

      {error && <Alert type="error" message={error} className="mb-3" />}

      {!editing ? (
        <div className="space-y-2">
          {currentItems.length === 0 ? (
            <p className="text-sm text-stone-400 py-4 text-center">No items — click Edit Items to add selections.</p>
          ) : (
            currentItems.map((item) => (
              <div key={item.productId} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: 'var(--cream-deep)' }}>
                <div className="flex items-center gap-3">
                  <Beer className="h-4 w-4 text-terracotta" />
                  <div>
                    <p className="font-medium text-stone-800">{item.product.name}</p>
                    {item.product.style && <p className="text-xs text-stone-400">{item.product.style}</p>}
                  </div>
                </div>
                <span className="font-semibold text-stone-700">×{item.quantity}</span>
              </div>
            ))
          )}
          {lastCustomizedAt && (
            <p className="mt-2 text-xs text-stone-400">Last customized: {formatDate(lastCustomizedAt)}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Counter badge */}
          <div className="flex items-center justify-between px-4 py-2 rounded" style={{ backgroundColor: remaining === 0 ? 'var(--cream-deep)' : 'rgba(182,90,60,0.08)', border: `1px solid ${remaining === 0 ? 'var(--rule)' : 'var(--terracotta)'}` }}>
            <span className="text-sm font-medium text-stone-700">Bottles selected</span>
            <span className={`font-bold text-sm ${remaining === 0 ? 'text-green-700' : 'text-terracotta'}`}>
              {total} / {packsPerOrder}
              {remaining > 0 && <span className="font-normal text-stone-500 ml-1">({remaining} left)</span>}
            </span>
          </div>

          {/* Product rows */}
          {availableProducts.map((product) => {
            const qty = qtys[product.id] ?? 0
            return (
              <div key={product.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ backgroundColor: qty > 0 ? 'rgba(182,90,60,0.06)' : 'var(--cream-deep)', border: `1px solid ${qty > 0 ? 'var(--terracotta)' : 'transparent'}` }}>
                <div className="flex items-center gap-3 min-w-0">
                  <Beer className="h-4 w-4 shrink-0 text-terracotta" />
                  <div className="min-w-0">
                    <p className="font-medium text-stone-800 truncate">{product.name}</p>
                    {product.style && <p className="text-xs text-stone-400">{product.style}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <button
                    onClick={() => adjust(product.id, -1)}
                    disabled={qty === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-full border text-stone-600 hover:bg-stone-100 disabled:opacity-30"
                    style={{ borderColor: 'var(--rule)' }}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center font-semibold text-stone-800 text-sm">{qty}</span>
                  <button
                    onClick={() => adjust(product.id, 1)}
                    disabled={remaining === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-full border text-stone-600 hover:bg-stone-100 disabled:opacity-30"
                    style={{ borderColor: 'var(--rule)' }}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )
          })}

          <div className="flex items-center gap-2 pt-1">
            <Button variant="secondary" onClick={cancel} disabled={loading}>
              <X className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
            <Button
              variant="primary"
              onClick={save}
              loading={loading}
              disabled={remaining !== 0}
            >
              <Check className="h-3.5 w-3.5 mr-1" /> Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
