'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn-secondary text-xs py-1.5 px-3 print:hidden"
    >
      Print
    </button>
  )
}
