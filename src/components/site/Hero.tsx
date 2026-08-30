import Image from 'next/image'

const SCRIM_V =
  'linear-gradient(180deg,rgba(20,16,12,0.5) 0%,rgba(20,16,12,0.28) 32%,rgba(20,16,12,0.82) 74%,rgba(20,16,12,0.96) 100%)'
const SCRIM_H =
  'linear-gradient(90deg,rgba(20,16,12,0.72) 0%,rgba(20,16,12,0.26) 56%,rgba(20,16,12,0) 100%)'

type HeroProps = {
  src: string
  alt: string
  /** Hero height as a percentage of the viewport, minus the sticky header. */
  vh: number
  /** Floor for the height, itself capped at the space under the header. */
  minHeight: number
  objectPosition?: string
  /** Vertical then horizontal scrim — the pair is what keeps the type legible. */
  scrimV?: string
  scrimH?: string
  paddingBottom?: number
  children: React.ReactNode
}

export function Hero({
  src,
  alt,
  vh,
  minHeight,
  objectPosition,
  scrimV = SCRIM_V,
  scrimH = SCRIM_H,
  paddingBottom = 88,
  children,
}: HeroProps) {
  return (
    <section
      className="hc-hero"
      style={
        {
          '--hc-hero-vh': vh,
          '--hc-hero-min': `${minHeight}px`,
        } as React.CSSProperties
      }
    >
      <Image src={src} alt={alt} fill priority sizes="100vw" style={{ objectFit: 'cover', objectPosition }} />
      <div className="hc-hero__scrim" style={{ background: scrimV }} />
      <div className="hc-hero__scrim" style={{ background: scrimH }} />
      <div className="hc-hero__inner" style={{ paddingBottom }}>
        {children}
      </div>
    </section>
  )
}
