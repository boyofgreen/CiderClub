import Link from 'next/link'
import Image from 'next/image'
import { SITE, HOURS, FOOTER_EXPLORE } from '@/lib/siteInfo'

const COL_HEAD: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: 'var(--hc-accent)',
  fontWeight: 600,
  marginBottom: 22,
}

const COL_BODY: React.CSSProperties = {
  display: 'grid',
  gap: 13,
  fontSize: 16,
  color: 'rgba(245,238,227,0.72)',
  fontWeight: 300,
}

export function SiteFooter() {
  const open = HOURS.filter((h) => h.hours !== 'Closed')

  return (
    <footer
      className="hc-dark"
      style={{ borderTop: '1px solid rgba(245,238,227,0.14)', padding: '100px 0 44px' }}
    >
      <div className="hc-wrap">
        <div className="hc-footer-cols" style={{ paddingBottom: 72 }}>
          <div>
            <div className="flex items-center" style={{ gap: 14, marginBottom: 22 }}>
              <Image
                src="/brand/logo.png"
                alt=""
                width={112}
                height={112}
                style={{ height: 56, width: 'auto', display: 'block' }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-display), sans-serif',
                  fontSize: 19,
                  lineHeight: 1.05,
                  whiteSpace: 'nowrap',
                }}
              >
                Hill Country
                <br />
                <span style={{ opacity: 0.72 }}>Cider House</span>
              </span>
            </div>
            <p
              style={{
                fontSize: 15,
                letterSpacing: '0.06em',
                color: 'rgba(245,238,227,0.5)',
                fontWeight: 300,
                margin: '0 0 24px',
              }}
            >
              Small batch, quality cider · Est. 2020
              <br />
              Castroville &amp; Comfort, Texas
            </p>
            <div
              className="flex"
              style={{
                gap: 20,
                fontSize: 11.5,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              <a href={SITE.facebook} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
              <a href={SITE.instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </div>
          </div>

          <div>
            <div style={COL_HEAD}>Explore</div>
            <div style={COL_BODY}>
              {FOOTER_EXPLORE.map(({ href, label, external }) =>
                external ? (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer">
                    {label}
                  </a>
                ) : (
                  <Link key={label} href={href}>
                    {label}
                  </Link>
                ),
              )}
            </div>
          </div>

          <div>
            <div style={COL_HEAD}>Visit</div>
            <div style={COL_BODY}>
              <a href={SITE.addressMapUrl} target="_blank" rel="noopener noreferrer">
                405 HWY 90 West
                <br />
                Castroville, TX 78009
              </a>
              {open.map((h) => (
                <span key={h.days}>
                  {h.days} · {h.hours}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div style={COL_HEAD}>Get in Touch</div>
            <div style={COL_BODY}>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              <a href={SITE.phoneHref}>{SITE.phone}</a>
              <a href={SITE.shop} target="_blank" rel="noopener noreferrer">
                Online Shop
              </a>
              <Link href="/login">Member sign in</Link>
            </div>
          </div>
        </div>

        <div
          className="hc-footer-legal"
          style={{
            borderTop: '1px solid rgba(245,238,227,0.12)',
            paddingTop: 32,
            fontSize: 13.5,
            color: 'rgba(245,238,227,0.4)',
            fontWeight: 300,
          }}
        >
          <span>© {new Date().getFullYear()} Hill Country Cider House. All rights reserved.</span>
          <span>Please drink responsibly.</span>
        </div>
      </div>
    </footer>
  )
}
