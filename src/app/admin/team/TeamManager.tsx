'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'

interface Operator {
  id: string
  role: string
  name: string
  email: string
}

interface Invite {
  id: string
  email: string
  role: string
  token: string
  expiresAt: string
}

export function TeamManager(props: {
  initialOperators: Operator[]
  initialInvites: Invite[]
  currentUserId: string
  currentUserEmail: string
}) {
  const [operators, setOperators] = useState(props.initialOperators)
  const [invites, setInvites] = useState(props.initialInvites)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('ADMIN')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to send invite')
        return
      }
      setInvites((prev) => [
        { ...data.invite, token: data.inviteUrl.split('/invite/')[1] ?? '' },
        ...prev.filter((i) => i.email !== data.invite.email),
      ])
      setNotice(`Invitation sent to ${data.invite.email}.`)
      setEmail('')
    } catch {
      setError('Failed to send invite')
    } finally {
      setBusy(false)
    }
  }

  async function revoke(inviteId: string) {
    await fetch(`/api/admin/team/invites/${inviteId}`, { method: 'DELETE' })
    setInvites((prev) => prev.filter((i) => i.id !== inviteId))
  }

  async function remove(orgUserId: string) {
    setError(null)
    const res = await fetch(`/api/admin/team/${orgUserId}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to remove team member')
      return
    }
    setOperators((prev) => prev.filter((o) => o.id !== orgUserId))
  }

  function copyInviteLink(token: string) {
    navigator.clipboard
      .writeText(`${window.location.origin}/invite/${token}`)
      .then(() => setNotice('Invite link copied to clipboard.'))
      .catch(() => setError('Could not copy — your browser blocked clipboard access.'))
  }

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} />}
      {notice && <Alert type="success" message={notice} />}

      {/* Invite form */}
      <form onSubmit={sendInvite} className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-56">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@example.com"
            required
          />
        </div>
        <div className="w-36">
          <label className="label" htmlFor="invite-role">Role</label>
          <select id="invite-role" value={role} onChange={(e) => setRole(e.target.value)} className="input">
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
          </select>
        </div>
        <Button type="submit" loading={busy}>Send invite</Button>
      </form>

      {/* Current team */}
      <section className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <h2 className="px-5 py-3 text-sm font-semibold text-stone-800 border-b border-stone-100">
          Team members
        </h2>
        <ul className="divide-y divide-stone-100">
          {operators.map((o) => (
            <li key={o.id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-900 truncate">{o.name}</p>
                <p className="text-xs text-stone-500 truncate">{o.email}</p>
              </div>
              <Badge color={o.role === 'OWNER' ? 'green' : o.role === 'ADMIN' ? 'blue' : 'gray'}>
                {o.role}
              </Badge>
              {o.email !== props.currentUserEmail && (
                <Button variant="ghost" size="sm" onClick={() => remove(o.id)}>
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Pending invites */}
      {invites.length > 0 && (
        <section className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <h2 className="px-5 py-3 text-sm font-semibold text-stone-800 border-b border-stone-100">
            Pending invitations
          </h2>
          <ul className="divide-y divide-stone-100">
            {invites.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-stone-900 truncate">{i.email}</p>
                  <p className="text-xs text-stone-500">
                    {i.role} · expires {new Date(i.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => copyInviteLink(i.token)}>
                  Copy link
                </Button>
                <Button variant="ghost" size="sm" onClick={() => revoke(i.id)}>
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
