import type { Metadata } from 'next'
import { Photo } from '@/components/site/Photo'
import { ContactSection } from '@/components/site/ContactSection'
import { SITE, HOURS } from '@/lib/siteInfo'

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Give us a ring, send us a text, email us, or fill out the form — Hill Country Cider House, Castroville and Comfort, Texas.',
}

export default function ContactPage() {
  return (
    <>
      <section className="hc-dark hc-section--top">
        <div className="hc-wrap">
          <p className="hc-eyebrow" style={{ marginBottom: 28 }}>
            Say Howdy
          </p>
          <h1
            className="hc-display"
            style={{
              fontSize: 'clamp(38px,6.4vw,100px)',
              lineHeight: 0.96,
              letterSpacing: '-0.042em',
              maxWidth: '20ch',
            }}
          >
            Get in touch.
          </h1>
        </div>
      </section>

      <section className="hc-tiles hc-tiles--2">
        <Photo
          src="/site/contact-bar.webp"
          alt="A smiling host in a white cowboy hat behind the bar"
          height={420}
          objectPosition="center 35%"
          sizes="50vw"
          className="hc-img--md"
        />
        <Photo
          src="/brand/storefront.jpg"
          alt="The storefront on HWY 90 in Castroville"
          height={420}
          sizes="50vw"
          className="hc-img--md"
        />
      </section>

      <ContactSection />

      <section className="hc-deep hc-section">
        <div className="hc-wrap hc-grid-2">
          <div>
            <p className="hc-eyebrow" style={{ marginBottom: 32 }}>
              Tasting Room Hours
            </p>
            <div className="hc-rows">
              {HOURS.map((h) => (
                <div
                  key={h.days}
                  className="hc-hours-row"
                  style={{ color: h.hours === 'Closed' ? 'rgba(245,238,227,0.5)' : undefined }}
                >
                  <span>{h.days}</span>
                  <span>{h.hours}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hc-bordered-col">
            <p className="hc-eyebrow" style={{ marginBottom: 32 }}>
              Come See Us
            </p>
            <a
              href={SITE.addressMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-display), sans-serif',
                fontSize: 25,
                lineHeight: 1.4,
                display: 'block',
                letterSpacing: '-0.02em',
                marginBottom: 34,
              }}
            >
              405 HWY 90 West
              <br />
              Castroville, TX 78009
            </a>
            <a
              href={SITE.addressMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hc-btn hc-btn--accent"
            >
              Get Directions
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
