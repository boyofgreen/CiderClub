'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { StickyNote } from 'lucide-react'

export function NotesEditor({
  memberId,
  initialNotes,
}: {
  memberId: string
  initialNotes: string
}) {
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/members/${memberId}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="h-4 w-4 text-stone-500" />
        <h2 className="font-semibold text-stone-900">CRM Notes</h2>
      </div>
      <Textarea
        rows={4}
        placeholder="Internal notes about this member…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-stone-400">Visible to admins only</span>
        <Button size="sm" onClick={handleSave} loading={saving} variant={saved ? 'secondary' : 'primary'}>
          {saved ? 'Saved ✓' : 'Save Notes'}
        </Button>
      </div>
    </Card>
  )
}
