'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PRESETS = [
  { key: '7', label: '7D' },
  { key: '14', label: '14D' },
  { key: '30', label: '30D' },
  { key: '90', label: '90D' },
  { key: '365', label: '1Y' },
]

export function RangePicker({
  activeKey,
  from,
  to,
}: {
  activeKey: string // '7' | '14' | '30' | '90' | '365' | 'custom'
  from: string // yyyy-mm-dd
  to: string // yyyy-mm-dd
}) {
  const router = useRouter()
  const [showCustom, setShowCustom] = useState(activeKey === 'custom')
  const [customFrom, setCustomFrom] = useState(from)
  const [customTo, setCustomTo] = useState(to)

  const isCustomActive = activeKey === 'custom'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex border bg-cream-paper" style={{ borderColor: 'var(--rule)' }}>
        {PRESETS.map((p) => {
          const active = !isCustomActive && activeKey === p.key
          return (
            <button
              key={p.key}
              onClick={() => {
                setShowCustom(false)
                router.push(`/admin/analytics?range=${p.key}`)
              }}
              className={`px-3 py-1.5 text-xs font-semibold tracking-wider transition-colors ${
                active ? 'bg-terracotta text-white' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {p.label}
            </button>
          )
        })}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`px-3 py-1.5 text-xs font-semibold tracking-wider transition-colors border-l ${
            isCustomActive ? 'bg-terracotta text-white' : 'text-stone-600 hover:bg-stone-100'
          }`}
          style={{ borderColor: 'var(--rule)' }}
        >
          Custom
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            max={customTo}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="border bg-cream-paper px-2 py-1 text-xs text-stone-700"
            style={{ borderColor: 'var(--rule)' }}
          />
          <span className="text-xs text-stone-400">to</span>
          <input
            type="date"
            value={customTo}
            min={customFrom}
            onChange={(e) => setCustomTo(e.target.value)}
            className="border bg-cream-paper px-2 py-1 text-xs text-stone-700"
            style={{ borderColor: 'var(--rule)' }}
          />
          <button
            onClick={() => {
              if (customFrom && customTo) {
                router.push(`/admin/analytics?from=${customFrom}&to=${customTo}`)
              }
            }}
            disabled={!customFrom || !customTo}
            className="bg-terracotta px-3 py-1.5 text-xs font-semibold tracking-wider text-white hover:opacity-90 disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}
