import { ContactForm } from '@/components/site/ContactForm'
import { SITE } from '@/lib/siteInfo'

const ROW: React.CSSProperties = {
  padding: '20px 0',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 20,
  fontSize: 17,
}

const KEY: React.CSSProperties = { color: 'rgba(245,238,227,0.5)' }

export function ContactSection({ id }: { id?: string }) {
  return (
    <section id={id} className="hc-dark hc-section">
      <div className="hc-wrap hc-grid-2">
        <div>
          <p className="hc-eyebrow" style={{ marginBottom: 24 }}>
            Get in Touch
          </p>
          <h2
            className="hc-display"
            style={{ fontSize: 'clamp(32px,4vw,56px)', margin: '0 0 26px' }}
          >
            Contact us.
          </h2>
          <p
            style={{
              fontSize: 18.5,
              lineHeight: 1.75,
              color: 'rgba(245,238,227,0.66)',
              fontWeight: 300,
              margin: '0 0 44px',
              maxWidth: '44ch',
            }}
          >
            Want to learn more? Send a note and we&rsquo;ll be in touch shortly. We can&rsquo;t wait
            to hear from you.
          </p>

          <div className="hc-rows">
            <div style={ROW}>
              <span style={KEY}>Email</span>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </div>
            <div style={ROW}>
              <span style={KEY}>Phone</span>
              <a href={SITE.phoneHref} style={{ whiteSpace: 'nowrap' }}>
                {SITE.phone}
              </a>
            </div>
            <div style={ROW}>
              <span style={KEY}>Castroville</span>
              <a href={SITE.addressMapUrl} target="_blank" rel="noopener noreferrer">
                405 HWY 90 West
              </a>
            </div>
            <div style={ROW}>
              <span style={KEY}>Comfort</span>
              <a href={SITE.comfortMapUrl} target="_blank" rel="noopener noreferrer">
                130 Holiday Road
              </a>
            </div>
          </div>
        </div>

        <div className="hc-deep hc-form-card">
          <ContactForm />
        </div>
      </div>
    </section>
  )
}
