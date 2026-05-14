'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: 'clamp(20px,3vw,28px)',
          color: 'var(--ink)',
          marginBottom: '0.75rem',
        }}
      >
        Something went wrong
      </h2>
      <p className="text-stone-500 mb-6 max-w-sm">
        An unexpected error occurred. You can try again, or contact us if the
        problem persists.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: 'var(--terracotta)' }}
      >
        Try again
      </button>
    </div>
  )
}
