'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { TRACKED_PATHS } from '@/lib/siteInfo'

// Public marketing pages only — signed-in areas are excluded so the analytics
// reflect visitor acquisition rather than member/admin app usage.
const TRACKED = new Set<string>(TRACKED_PATHS)

function isTracked(pathname: string): boolean {
  return TRACKED.has(pathname)
}

export function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!isTracked(pathname)) return
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
