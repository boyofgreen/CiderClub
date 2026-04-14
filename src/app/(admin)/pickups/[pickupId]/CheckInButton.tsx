'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export function CheckInButton({
  pickupId,
  memberId,
  orderId,
}: {
  pickupId: string
  memberId: string
  orderId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function checkIn() {
    setLoading(true)
    await fetch(`/api/pickups/${pickupId}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, orderId }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <Button size="sm" variant="secondary" onClick={checkIn} loading={loading}>
      Check In
    </Button>
  )
}
