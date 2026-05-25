'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ImportPreviewMember } from '@/app/api/admin/import-from-square/route'

export function ImportFromSquare() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<ImportPreviewMember[] | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function fetchPreview() {
    setLoading(true)
    setError(null)
    setPreview(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/import-from-square')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch preview')
      setPreview(data.preview)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  function handleOpen() {
    setOpen(true)
    fetchPreview()
  }

  function handleClose() {
    setOpen(false)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  async function handleImport() {
    if (!preview) return
    const toImport = preview.filter((m) => !m.alreadyImported)
    if (toImport.length === 0) return

    setImporting(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/import-from-square', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: toImport }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      setResult(`Imported ${data.imported} member${data.imported !== 1 ? 's' : ''}.${data.skipped > 0 ? ` ${data.skipped} skipped (already exist).` : ''}`)
      setPreview(null)
      router.refresh()
    } catch (err) {
      setError(String(err))
    } finally {
      setImporting(false)
    }
  }

  const newMembers = preview?.filter((m) => !m.alreadyImported) ?? []
  const alreadyIn = preview?.filter((m) => m.alreadyImported) ?? []

  return (
    <>
      <button onClick={handleOpen} className="btn-secondary text-sm">
        Import from Square
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white shadow-xl" style={{ borderColor: 'var(--rule)' }}>
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--rule)' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: '1.2rem' }}>
                Import from Square
              </h2>
              <button onClick={handleClose} className="text-stone-400 hover:text-stone-600 text-xl leading-none">&times;</button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {loading && (
                <p className="text-sm text-stone-500 text-center py-6">Fetching members from Square…</p>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2">{error}</p>
              )}

              {result && (
                <p className="text-sm text-green-700 bg-green-50 px-3 py-2">{result}</p>
              )}

              {preview && (
                <>
                  {newMembers.length === 0 && alreadyIn.length === 0 && (
                    <p className="text-sm text-stone-500 text-center py-4">
                      No members found in Square plan groups (Pickers, Pressers, Cellar Crew).
                    </p>
                  )}

                  {newMembers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                        New — will be imported ({newMembers.length})
                      </p>
                      <div className="divide-y divide-stone-100 border" style={{ borderColor: 'var(--rule)' }}>
                        {newMembers.map((m) => (
                          <div key={m.squareCustomerId} className="flex items-center justify-between px-3 py-2 text-sm">
                            <div>
                              <span className="font-medium text-stone-800">{m.firstName} {m.lastName}</span>
                              <span className="ml-2 text-stone-400 text-xs">{m.email}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-stone-400">{m.planName}</span>
                              {m.hasCard
                                ? <span className="text-xs text-green-600">card ✓</span>
                                : <span className="text-xs text-amber-600">no card</span>
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {alreadyIn.length > 0 && (
                    <p className="text-xs text-stone-400">
                      {alreadyIn.length} member{alreadyIn.length !== 1 ? 's' : ''} already in the system — will be skipped.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t px-6 py-4" style={{ borderColor: 'var(--rule)' }}>
              <button onClick={handleClose} className="btn-secondary">
                {result ? 'Close' : 'Cancel'}
              </button>
              {!result && newMembers.length > 0 && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="btn-primary"
                >
                  {importing ? 'Importing…' : `Import ${newMembers.length} member${newMembers.length !== 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
