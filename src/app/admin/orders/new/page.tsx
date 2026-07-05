'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCents } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { ArrowLeft, Beer, Plus, Minus, Search } from 'lucide-react'

type Member = { id: string; firstName: string; lastName: string; email: string; status: string }
type Product = {
  id: string; name: string; style: string | null; priceInCents: number
  imageUrl: string | null; isActive: boolean
}

export default function NewAdHocOrderPage() {
  const router = useRouter()

  // Member picker
  const [memberSearch, setMemberSearch] = useState('')
  const [memberResults, setMemberResults] = useState<Member[]>([])
  const [member, setMember] = useState<Member | null>(null)
  const [searching, setSearching] = useState(false)

  // Products
  const [products, setProducts] = useState<Product[]>([])
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const [adminNotes, setAdminNotes] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => setProducts((d.products ?? []).filter((p: Product) => p.isActive)))
      .catch(() => {})
  }, [])

  // Debounced member search
  useEffect(() => {
    if (!memberSearch.trim()) { setMemberResults([]); return }
    setSearching(true)
    const t = setTimeout(() => {
      fetch(`/api/members?search=${encodeURIComponent(memberSearch.trim())}&limit=8`)
        .then((r) => r.json())
        .then((d) => setMemberResults(d.members ?? []))
        .catch(() => {})
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(t)
  }, [memberSearch])

  function adjust(productId: string, delta: number) {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[productId] ?? 0) + delta)
      return { ...prev, [productId]: next }
    })
  }

  const lineItems = products
    .map((p) => ({ product: p, quantity: quantities[p.id] ?? 0 }))
    .filter((l) => l.quantity > 0)
  const total = lineItems.reduce((sum, l) => sum + l.quantity * (l.product.priceInCents ?? 2100), 0)

  async function handleCreate() {
    if (!member || lineItems.length === 0) return
    setCreating(true)
    setError(null)
    const res = await fetch('/api/orders/ad-hoc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId: member.id,
        items: lineItems.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        adminNotes: adminNotes || undefined,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      router.push(`/admin/orders/${data.order.id}`)
    } else {
      setError(data.error ?? 'Failed to create order')
      setCreating(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="text-stone-500 hover:text-stone-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(20px,3vw,28px)', color: 'var(--ink)' }}>
            New Ad Hoc Order
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            A one-off order outside the quarterly cycle — items at full bottle price, ready for pickup and billing.
          </p>
        </div>
      </div>

      {error && <Alert type="error" message={error} />}

      {/* Step 1: Member */}
      <div className="border bg-cream-paper p-6 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
        <h2 className="font-semibold text-stone-900 mb-3">1. Who is this order for?</h2>
        {member ? (
          <div className="flex items-center justify-between border px-4 py-3" style={{ borderColor: 'var(--terracotta)', backgroundColor: 'var(--cream-deep)' }}>
            <div>
              <p className="font-medium text-stone-900">{member.firstName} {member.lastName}</p>
              <p className="text-xs text-stone-500">{member.email}</p>
            </div>
            <button onClick={() => { setMember(null); setMemberSearch('') }} className="text-xs text-stone-500 hover:text-terracotta">
              Change
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                className="input pl-9"
                placeholder="Search members by name or email…"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                autoFocus
              />
            </div>
            {searching && <p className="text-xs text-stone-400">Searching…</p>}
            {memberResults.length > 0 && (
              <div className="border divide-y divide-stone-100" style={{ borderColor: 'var(--rule)' }}>
                {memberResults.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMember(m)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-cream-deep transition"
                  >
                    <div>
                      <p className="text-sm font-medium text-stone-800">{m.firstName} {m.lastName}</p>
                      <p className="text-xs text-stone-400">{m.email}</p>
                    </div>
                    <span className="text-xs text-stone-400">{m.status}</span>
                  </button>
                ))}
              </div>
            )}
            {!searching && memberSearch.trim() && memberResults.length === 0 && (
              <p className="text-xs text-stone-400">No members match that search.</p>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Items */}
      <div className="border bg-cream-paper p-6 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
        <h2 className="font-semibold text-stone-900 mb-3">2. What&apos;s in it?</h2>
        <div className="space-y-2">
          {products.map((p) => {
            const qty = quantities[p.id] ?? 0
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-2.5 border"
                style={{
                  borderColor: qty > 0 ? 'var(--terracotta)' : 'var(--rule)',
                  backgroundColor: qty > 0 ? 'var(--cream-deep)' : undefined,
                }}
              >
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} className="h-11 w-11 shrink-0 object-cover border" style={{ borderColor: 'var(--rule)' }} loading="lazy" />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center border" style={{ backgroundColor: 'var(--cream-deep)', borderColor: 'var(--rule)' }}>
                    <Beer className="h-5 w-5 text-gold-deep opacity-50" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 leading-snug">{p.name}</p>
                  <p className="text-xs text-stone-400">
                    {p.style ? `${p.style} · ` : ''}{formatCents(p.priceInCents ?? 2100)}/bottle
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {qty > 0 && (
                    <>
                      <button onClick={() => adjust(p.id, -1)} className="flex h-8 w-8 items-center justify-center border border-stone-300 text-stone-600 hover:bg-stone-100">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-stone-900 text-sm">{qty}</span>
                    </>
                  )}
                  <button onClick={() => adjust(p.id, 1)} className="flex h-8 items-center justify-center gap-1 border border-stone-300 px-2.5 text-stone-600 text-xs font-medium hover:bg-stone-100">
                    <Plus className="h-3 w-3" />{qty === 0 ? ' Add' : ''}
                  </button>
                </div>
              </div>
            )
          })}
          {products.length === 0 && (
            <p className="text-sm text-stone-400 py-4 text-center">No active products.</p>
          )}
        </div>
      </div>

      {/* Step 3: Review */}
      <div className="border bg-cream-paper p-6 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
        <h2 className="font-semibold text-stone-900 mb-3">3. Review &amp; create</h2>
        {lineItems.length === 0 ? (
          <p className="text-sm text-stone-400">No items yet — add some ciders above.</p>
        ) : (
          <div className="space-y-1.5 mb-4">
            {lineItems.map((l) => (
              <div key={l.product.id} className="flex items-center justify-between text-sm">
                <span className="text-stone-700">{l.quantity} × {l.product.name}</span>
                <span className="font-medium text-stone-900">{formatCents(l.quantity * (l.product.priceInCents ?? 2100))}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 mt-2 font-bold text-stone-900" style={{ borderTop: '1px solid var(--rule)' }}>
              <span>Subtotal</span>
              <span>{formatCents(total)}</span>
            </div>
            <p className="text-xs text-stone-400">
              The member&apos;s tier discount and sales tax are applied automatically — the final total
              shows on the order page.
            </p>
          </div>
        )}
        <Input
          label="Admin notes (optional)"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="e.g. Farmers market pre-order, picking up Saturday"
        />
        <Button
          variant="saloon"
          className="mt-4 w-full"
          onClick={handleCreate}
          loading={creating}
          disabled={!member || lineItems.length === 0}
        >
          Create Order{member ? ` for ${member.firstName}` : ''}
        </Button>
        <p className="mt-2 text-xs text-center text-stone-400">
          The order is created as Awaiting Pickup — check in and bill it from the order page like any other.
        </p>
      </div>
    </div>
  )
}
