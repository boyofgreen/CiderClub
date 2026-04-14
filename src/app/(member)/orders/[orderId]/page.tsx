'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatCents, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { Beer, ArrowLeft, Plus, Minus, Save, CheckCircle } from 'lucide-react'

type Product = { id: string; name: string; style: string | null; description: string | null }
type OrderItem = { productId: string; quantity: number; product: Product }
type Order = {
  id: string
  status: string
  totalInCents: number
  memberNotes: string | null
  lastCustomizedAt: string | null
  quarter: { label: string; name: string | null; status: string; endsAt: string }
  items: OrderItem[]
  pickupEvent: { title: string; startsAt: string; location: string | null } | null
  member: { plan: { packsPerOrder: number } }
}
type QuarterProduct = { product: Product; isDefault: boolean }

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [quarterProducts, setQuarterProducts] = useState<QuarterProduct[]>([])
  const [selections, setSelections] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data.order)
        // Build initial selections map
        const sel: Record<string, number> = {}
        data.order.items.forEach((i: OrderItem) => { sel[i.productId] = i.quantity })
        setSelections(sel)
        return data.order.quarter.id
      })
      .then((quarterId) =>
        fetch(`/api/quarters/${quarterId}/products`).then((r) => r.json())
      )
      .then((data) => setQuarterProducts(data.products ?? []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) return <div className="py-12 text-center"><Spinner className="mx-auto" /></div>
  if (!order) return <div className="py-12 text-center text-stone-500">Order not found.</div>

  const packsPerOrder = order.member.plan.packsPerOrder
  const totalSelected = Object.values(selections).reduce((sum, q) => sum + q, 0)
  const canCustomize =
    ['PENDING_CUSTOMIZATION', 'CUSTOMIZED'].includes(order.status) &&
    order.quarter.status === 'OPEN'

  function adjust(productId: string, delta: number) {
    setSelections((prev) => {
      const current = prev[productId] ?? 0
      const next = Math.max(0, current + delta)
      // Don't exceed total packs allowed
      const newTotal = totalSelected - current + next
      if (newTotal > packsPerOrder) return prev
      return { ...prev, [productId]: next }
    })
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const items = Object.entries(selections)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({ productId, quantity }))

    const res = await fetch(`/api/orders/${orderId}/items`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })

    if (res.ok) {
      const data = await res.json()
      setOrder(data.order)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to save. Please try again.')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/member/orders" className="text-stone-500 hover:text-stone-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-stone-900">
            {order.quarter.label} Order
            {order.quarter.name ? ` — ${order.quarter.name}` : ''}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge status={order.status} />
            <span className="text-sm text-stone-500">{formatCents(order.totalInCents)}</span>
          </div>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      {saved && (
        <Alert
          type="success"
          message="Your order has been saved! We'll send a confirmation shortly."
        />
      )}

      {/* Customization form */}
      {canCustomize ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-stone-900">Customize Your Order</h2>
              <p className="text-sm text-stone-500 mt-0.5">
                Select {packsPerOrder} bottles total
              </p>
            </div>
            <div className={`text-sm font-bold ${totalSelected === packsPerOrder ? 'text-green-600' : 'text-brand-600'}`}>
              {totalSelected}/{packsPerOrder} selected
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6 h-2 rounded-full bg-stone-100">
            <div
              className={`h-2 rounded-full transition-all ${totalSelected === packsPerOrder ? 'bg-green-500' : 'bg-brand-500'}`}
              style={{ width: `${(totalSelected / packsPerOrder) * 100}%` }}
            />
          </div>

          <div className="space-y-3">
            {quarterProducts.map(({ product }) => (
              <div
                key={product.id}
                className="flex items-center gap-4 rounded-xl border border-stone-200 p-4 hover:border-stone-300 transition"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                  <Beer className="h-5 w-5 text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-800 truncate">{product.name}</p>
                  {product.style && (
                    <p className="text-xs text-stone-400 mt-0.5">{product.style}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => adjust(product.id, -1)}
                    disabled={(selections[product.id] ?? 0) === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 text-stone-600 hover:bg-stone-50 disabled:opacity-30"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center font-bold text-stone-900">
                    {selections[product.id] ?? 0}
                  </span>
                  <button
                    onClick={() => adjust(product.id, 1)}
                    disabled={totalSelected >= packsPerOrder}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-300 text-stone-600 hover:bg-stone-50 disabled:opacity-30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSave}
            loading={saving}
            disabled={totalSelected !== packsPerOrder}
            className="mt-6 w-full"
          >
            {saved ? (
              <><CheckCircle className="h-4 w-4" /> Saved!</>
            ) : (
              <><Save className="h-4 w-4" /> Save My Order</>
            )}
          </Button>

          {order.quarter.endsAt && (
            <p className="mt-2 text-xs text-center text-stone-400">
              Customization closes on {formatDate(order.quarter.endsAt)}
            </p>
          )}
        </Card>
      ) : (
        <Card>
          <h2 className="font-semibold text-stone-900 mb-4">Your Order</h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.productId} className="flex items-center justify-between rounded-lg bg-stone-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Beer className="h-4 w-4 text-brand-500" />
                  <div>
                    <p className="font-medium text-stone-800">{item.product.name}</p>
                    {item.product.style && (
                      <p className="text-xs text-stone-400">{item.product.style}</p>
                    )}
                  </div>
                </div>
                <span className="font-semibold text-stone-700">×{item.quantity}</span>
              </div>
            ))}
          </div>

          {order.status === 'LOCKED' && (
            <p className="mt-4 text-sm text-stone-500">
              The customization window has closed. Your order is locked in and ready for pickup.
            </p>
          )}
        </Card>
      )}

      {/* Pickup info */}
      {order.pickupEvent && (
        <Card>
          <h2 className="font-semibold text-stone-900 mb-3">Pickup Details</h2>
          <div className="space-y-1">
            <p className="text-stone-700">{order.pickupEvent.title}</p>
            <p className="text-sm text-stone-500">{formatDate(order.pickupEvent.startsAt)}</p>
            {order.pickupEvent.location && (
              <p className="text-sm text-stone-500">📍 {order.pickupEvent.location}</p>
            )}
          </div>
        </Card>
      )}

      {/* Payment info */}
      {order.status === 'BILLED' && (
        <Card>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-semibold text-stone-900">Payment received</p>
              <p className="text-sm text-stone-500">{formatCents(order.totalInCents)} charged</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
