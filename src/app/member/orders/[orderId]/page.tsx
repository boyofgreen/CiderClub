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
import { Beer, ArrowLeft, Plus, Minus, Save, CheckCircle, X } from 'lucide-react'

type Product = { id: string; name: string; style: string | null; description: string | null; imageUrl: string | null }
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

  // Split products into in-box vs available-to-add
  const inBox = quarterProducts.filter(({ product }) => (selections[product.id] ?? 0) > 0)
  const available = quarterProducts.filter(({ product }) => (selections[product.id] ?? 0) === 0)

  function adjust(productId: string, delta: number) {
    setSelections((prev) => {
      const current = prev[productId] ?? 0
      const next = Math.max(0, current + delta)
      return { ...prev, [productId]: next }
    })
  }

  function remove(productId: string) {
    setSelections((prev) => ({ ...prev, [productId]: 0 }))
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
        <Link href="/member/orders" style={{ color: 'var(--ink-soft)' }}>
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 22, color: 'var(--ink)' }}>
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
      {saved && <Alert type="success" message="Your order has been saved! We'll send a confirmation shortly." />}

      {/* Customization form */}
      {canCustomize ? (
        <Card>
          {/* Header + progress */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 600, fontSize: 18, color: 'var(--ink)' }}>
                Customize Your Order
              </h2>
              <p className="text-sm text-stone-500 mt-0.5">
                {packsPerOrder} bottles included — add as many extras as you like
              </p>
            </div>
            <div className={`text-sm font-bold shrink-0 ml-4 ${totalSelected >= packsPerOrder ? 'text-green-600' : 'text-terracotta'}`}>
              {totalSelected} / {packsPerOrder}
              {totalSelected > packsPerOrder && (
                <span className="font-normal text-stone-500 ml-1">(+{totalSelected - packsPerOrder})</span>
              )}
            </div>
          </div>
          <div className="mb-5 h-2 bg-stone-100">
            <div
              className={`h-2 transition-all ${totalSelected >= packsPerOrder ? 'bg-green-500' : 'bg-terracotta'}`}
              style={{ width: `${Math.min(100, (totalSelected / packsPerOrder) * 100)}%` }}
            />
          </div>

          {/* ── Your Box ─────────────────────────────────────────────── */}
          <div className="mb-6">
            <p style={{ fontSize: 10, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
              Your Box
            </p>
            {inBox.length === 0 ? (
              <div className="py-6 text-center border border-dashed" style={{ borderColor: 'var(--rule)' }}>
                <Beer className="h-6 w-6 text-stone-300 mx-auto mb-2" />
                <p className="text-sm text-stone-400">Your box is empty — add ciders below</p>
              </div>
            ) : (
              <div className="space-y-2">
                {inBox.map(({ product }) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 px-3 py-2.5"
                    style={{ backgroundColor: 'var(--cream-deep)' }}
                  >
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-12 w-12 shrink-0 object-cover border"
                        style={{ borderColor: 'var(--rule)' }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-white/50 border" style={{ borderColor: 'var(--rule)' }}>
                        <Beer className="h-5 w-5 text-gold-deep opacity-50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 leading-snug text-sm">{product.name}</p>
                      {product.style && <p className="text-xs text-stone-400 mt-0.5">{product.style}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => adjust(product.id, -1)}
                        className="flex h-8 w-8 items-center justify-center border border-stone-300 text-stone-600 hover:bg-stone-100"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-stone-900 text-sm">
                        {selections[product.id]}
                      </span>
                      <button
                        onClick={() => adjust(product.id, 1)}
                        className="flex h-8 w-8 items-center justify-center border border-stone-300 text-stone-600 hover:bg-stone-100"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => remove(product.id)}
                        className="flex h-8 w-8 items-center justify-center text-stone-300 hover:text-terracotta transition ml-1"
                        title="Remove from box"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Add a Cider ──────────────────────────────────────────── */}
          {available.length > 0 && (
            <div>
              <p style={{ fontSize: 10, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 10 }}>
                Add a Cider
              </p>
              <div className="space-y-2">
                {available.map(({ product }) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 border transition"
                    style={{ borderColor: 'var(--rule)' }}
                  >
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-12 w-12 shrink-0 object-cover border"
                        style={{ borderColor: 'var(--rule)' }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center border" style={{ backgroundColor: 'var(--cream-deep)', borderColor: 'var(--rule)' }}>
                        <Beer className="h-5 w-5 text-gold-deep opacity-50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-700 leading-snug text-sm">{product.name}</p>
                      {product.style && <p className="text-xs text-stone-400 mt-0.5">{product.style}</p>}
                    </div>
                    <button
                      onClick={() => adjust(product.id, 1)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border border-stone-300 text-stone-600 text-xs font-medium hover:bg-stone-50 transition"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="saloon"
            onClick={handleSave}
            loading={saving}
            disabled={totalSelected < packsPerOrder}
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
          <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 600, fontSize: 18, color: 'var(--ink)', marginBottom: 16 }}>
            Your Order
          </h2>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between gap-3 px-4 py-3"
                style={{ backgroundColor: 'var(--cream-deep)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Beer className="h-4 w-4 shrink-0 text-gold-deep" />
                  <div className="min-w-0">
                    <p className="font-medium text-stone-800 leading-snug">{item.product.name}</p>
                    {item.product.style && (
                      <p className="text-xs text-stone-400">{item.product.style}</p>
                    )}
                  </div>
                </div>
                <span className="font-semibold text-stone-700 shrink-0">×{item.quantity}</span>
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
          <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 600, fontSize: 18, color: 'var(--ink)', marginBottom: 12 }}>
            Pickup Details
          </h2>
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
