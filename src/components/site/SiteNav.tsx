'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { NAV_LINKS, SITE } from '@/lib/siteInfo'

/**
 * `homeHref` exists because the club.* subdomain rewrites "/" onto the club
 * page — there the wordmark has to jump back to the apex domain.
 */
export function SiteNav({ homeHref = '/' }: { homeHref?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const wordmark = (
    <>
      <Image
        src="/brand/logo.png"
        alt=""
        width={92}
        height={92}
        priority
        style={{ height: 46, width: 'auto', display: 'block' }}
      />
      <span
        style={{
          fontFamily: 'var(--font-display), sans-serif',
          fontSize: 17,
          lineHeight: 1.05,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}
      >
        Hill Country
        <br />
        <span style={{ opacity: 0.72 }}>Cider House</span>
      </span>
    </>
  )

  return (
    <>
      <header className="hc-header">
        <div className="hc-header__bar">
          <Link
            href={homeHref}
            className="flex items-center"
            style={{ gap: 14 }}
            aria-label="Hill Country Cider House — home"
          >
            {wordmark}
          </Link>

          <button
            type="button"
            className="hc-mobile-only hc-menu-toggle"
            onClick={() => setOpen(true)}
            aria-expanded={open}
          >
            Menu
          </button>

          <nav className="hc-nav hc-desktop-nav">
            {NAV_LINKS.map(({ href, label, external }) =>
              external ? (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer">
                  {label}
                </a>
              ) : (
                <Link key={label} href={href} aria-current={pathname === href ? 'page' : undefined}>
                  {label}
                </Link>
              ),
            )}
            <Link href="/club" className="hc-btn hc-btn--accent">
              Join the Club
            </Link>
          </nav>
        </div>
      </header>

      {open && (
        <div className="hc-menu hc-mobile-only" role="dialog" aria-modal="true" aria-label="Menu">
          <div
            className="flex items-center justify-between"
            style={{ minHeight: 56, marginBottom: 24 }}
          >
            <Image
              src="/brand/logo.png"
              alt=""
              width={88}
              height={88}
              style={{ height: 44, width: 'auto', display: 'block' }}
            />
            <button type="button" className="hc-menu-toggle" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>

          <div style={{ display: 'grid', gap: 2, borderTop: '1px solid var(--hc-hairline)' }}>
            <Link href="/" className="hc-menu__link" onClick={() => setOpen(false)}>
              Home
            </Link>
            {NAV_LINKS.map(({ href, label, external }) =>
              external ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hc-menu__link"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={label}
                  href={href}
                  className="hc-menu__link"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ),
            )}
            <Link href="/contact" className="hc-menu__link" onClick={() => setOpen(false)}>
              Contact
            </Link>
          </div>

          <div style={{ display: 'grid', gap: 10, marginTop: 'auto', paddingTop: 22 }}>
            <Link
              href="/club"
              className="hc-btn hc-btn--accent"
              style={{ padding: '20px 24px', letterSpacing: '0.2em' }}
              onClick={() => setOpen(false)}
            >
              Join the Club
            </Link>
            <a
              href={SITE.phoneHref}
              className="hc-btn hc-btn--outline"
              style={{ padding: '20px 24px', letterSpacing: '0.2em' }}
            >
              {SITE.phone}
            </a>
          </div>
        </div>
      )}
    </>
  )
}
