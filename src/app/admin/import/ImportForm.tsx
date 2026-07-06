'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

interface ImportError {
  line: number
  email: string | null
  message: string
}

interface ImportResult {
  dryRun: boolean
  total: number
  created: number
  skipped: number
  errors: ImportError[]
}

export function ImportForm({ plans }: { plans: { id: string; name: string }[] }) {
  const [csv, setCsv] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [defaultPlanId, setDefaultPlanId] = useState(plans[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportResult | null>(null)
  const [done, setDone] = useState<ImportResult | null>(null)

  async function run(dryRun: boolean) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/import-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv, defaultPlanId: defaultPlanId || undefined, dryRun }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Import failed — please try again.')
        return
      }
      if (dryRun) setPreview(data)
      else {
        setDone(data)
        setPreview(null)
      }
    } catch {
      setError('Import failed — please try again.')
    } finally {
      setBusy(false)
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return
    setFileName(file.name)
    setDone(null)
    setPreview(null)
    const reader = new FileReader()
    reader.onload = () => setCsv(String(reader.result ?? ''))
    reader.readAsText(file)
  }

  if (done) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4">
        <Alert
          type="success"
          title="Import complete"
          message={`${done.created} member${done.created === 1 ? '' : 's'} imported, ${done.skipped} skipped (already members), ${done.errors.length} row${done.errors.length === 1 ? '' : 's'} with problems.`}
        />
        {done.errors.length > 0 && <ErrorTable errors={done.errors} />}
        <div className="flex gap-3">
          <a href="/admin/members"><Button>View members</Button></a>
          <Button variant="secondary" onClick={() => { setDone(null); setCsv(''); setFileName(null) }}>
            Import another file
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-5">
      {error && <Alert type="error" message={error} />}

      <div className="space-y-1">
        <label className="label">CSV file</label>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="block w-full text-sm text-stone-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-700"
        />
        {fileName && <p className="text-xs text-stone-500">{fileName} loaded ({csv.split('\n').length - 1} rows)</p>}
      </div>

      <div className="space-y-1">
        <label className="label" htmlFor="default-plan">Default plan (used when a row has no plan column)</label>
        <select
          id="default-plan"
          value={defaultPlanId}
          onChange={(e) => setDefaultPlanId(e.target.value)}
          className="input"
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {preview && (
        <div className="space-y-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="text-sm font-medium text-stone-800">
            Preview: {preview.created} will be imported · {preview.skipped} skipped (already members or duplicates) · {preview.errors.length} problem row{preview.errors.length === 1 ? '' : 's'}
          </p>
          {preview.errors.length > 0 && <ErrorTable errors={preview.errors} />}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" disabled={!csv} loading={busy && !preview} onClick={() => run(true)}>
          Preview import
        </Button>
        <Button
          disabled={!csv || !preview || preview.created === 0}
          loading={busy && Boolean(preview)}
          onClick={() => run(false)}
        >
          {preview ? `Import ${preview.created} member${preview.created === 1 ? '' : 's'}` : 'Import'}
        </Button>
      </div>
      <p className="text-xs text-stone-500">
        Always preview first — problem rows are listed with line numbers so you can fix the
        file and re-upload. Importing never sends emails or charges anyone.
      </p>
    </div>
  )
}

function ErrorTable({ errors }: { errors: ImportError[] }) {
  return (
    <div className="max-h-64 overflow-y-auto rounded border border-stone-200 bg-white">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-stone-100 text-stone-600">
          <tr>
            <th className="px-3 py-2 font-medium">Line</th>
            <th className="px-3 py-2 font-medium">Email</th>
            <th className="px-3 py-2 font-medium">Problem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {errors.map((e, i) => (
            <tr key={i}>
              <td className="px-3 py-1.5 text-stone-500">{e.line}</td>
              <td className="px-3 py-1.5">{e.email ?? '—'}</td>
              <td className="px-3 py-1.5 text-stone-700">{e.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
