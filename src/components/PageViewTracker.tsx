'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const TRACKED = new Set(['/', '/register', '/magic/request'])

export function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!TRACKED.has(pathname)) return
    const key = `pv:${pathname}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // sessionStorage blocked — still track, just don't dedup
    }
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer: document.referrer || null }),
    }).catch(() => {})
  }, [pathname])

  return null
}
