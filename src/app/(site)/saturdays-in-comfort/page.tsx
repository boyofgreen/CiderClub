import Image from 'next/image'
import type { Metadata } from 'next'
import { SITE } from '@/lib/siteInfo'
import { MapPin, Phone, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: "Saturday's in Comfort",
  description:
    'A personalized, private cider tasting on twenty acres at Holiday Orchard in Comfort, Texas. One group at a time, ninety minutes, 5–7 ciders.',
}

const INCLUDED = [
  'Welcome cocktails upon arrival',
  '5–7 ciders presented for tasting',
  'Charcuterie and “palette inspirations” presented throughout the tasting',
  'Exclusive access to Holiday Orchard at Hill Country Cider House',
  'Unmatched Texas hospitality',
]

const BOOK_HREF = `mailto:${SITE.email}?subject=Saturdays%20in%20Comfort%20booking&body=Hi%20Hill%20Country%20Cider%20House%2C%0A%0AI%27d%20like%20to%20book%20a%20private%20tasting.%0A%0APreferred%20date%3A%0AParty%20size%3A%0AName%3A%0APhone%3A%0A%0AThank%20you%21`

export default function SaturdaysInComfortPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative h-[62vh] min-h-[420px] w-full">
        <Image
          src="/site/comfort-hills.webp"
          alt="Rolling hill country landscape at Holiday Orchard in Comfort, Texas"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(26,37,64,0.42), rgba(26,37,64,0.8))' }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="smallcaps mb-4" style={{ color: 'var(--gold)' }}>Comfort, Texas</p>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(32px, 5.5vw, 58px)',
              color: 'var(--cream)',
              lineHeight: 1.15,
            }}
          >
            Saturdays in Comfort
          </h1>
          <p className="mt-5 max-w-xl" style={{ color: 'rgba(247,241,227,0.82)', fontSize: 16, lineHeight: 1.7 }}>
            A personalized, private tasting that personifies the Texas hill country experience
          </p>
          <a href={BOOK_HREF} className="btn-gold mt-8" style={{ textDecoration: 'none' }}>
            Book Now
          </a>
        </div>
      </section>

      {/* Welcome */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p style={{ color: 'var(--ink-soft)', fontSize: 17, lineHeight: 1.8 }}>
          Welcome to Holiday Orchard, our micro&#8209;event retreat set across twenty acres of rolling hill
          country views in Comfort, Texas. Saturdays in Comfort offers a refined, private tasting experience
          designed to engage every sense&mdash;thoughtful, unhurried, and rooted in the quiet character of
          this place. We host only one group at a time, ensuring your party has full and exclusive access to
          the property throughout your visit, with room to explore, savor, and settle into the landscape.
        </p>
      </section>

      {/* What's included */}
      <section style={{ backgroundColor: 'var(--navy)' }}>
        <div className="mx-auto grid max-w-6xl items-center gap-0 lg:grid-cols-2">
          <div className="px-6 py-14 sm:px-12">
            <p className="smallcaps mb-4" style={{ color: 'var(--gold)' }}>Ninety Minutes</p>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(24px, 3.5vw, 36px)',
                color: 'var(--cream)',
                lineHeight: 1.25,
              }}
            >
              What&rsquo;s included in my tasting experience
            </h2>
            <p className="mt-5 text-sm" style={{ color: 'rgba(247,241,227,0.7)', lineHeight: 1.75 }}>
              Your private tasting is reserved for parties of two or more, with special pricing and tailored
              accommodations available for groups of ten or larger. Each experience lasts approximately ninety
              minutes and is guided by one of our storytelling cider makers, whose role is to help you engage
              with the land, the craft, and the cider itself in ways that feel both thoughtful and unexpectedly
              meaningful.
            </p>
            <ul className="mt-7 space-y-3">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span style={{ color: 'var(--gold)', fontSize: 13, marginTop: 3 }} aria-hidden="true">✦</span>
                  <span style={{ color: 'var(--cream)', fontSize: 15, lineHeight: 1.6 }}>{item}</span>
                </li>
              ))}
            </ul>
            <a href={BOOK_HREF} className="btn-gold mt-9" style={{ textDecoration: 'none' }}>
              Book Now
            </a>
          </div>

          <div className="grid grid-cols-2 gap-0 lg:h-full">
            <div className="relative h-[220px] w-full lg:h-full">
              <Image src="/site/comfort-dessert.webp" alt="Plated dessert with blueberry jam, whipped cream, mint and candied lemon" fill sizes="25vw" style={{ objectFit: 'cover' }} />
            </div>
            <div className="relative h-[220px] w-full lg:h-full">
              <Image src="/site/comfort-flutes.webp" alt="Three flutes of cider with pink flowers on a wooden surface" fill sizes="25vw" style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Find us */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(24px, 3.5vw, 34px)',
            color: 'var(--ink)',
          }}
        >
          Find us in the hills of Comfort Texas
        </h2>
        <p className="mt-4" style={{ color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1.7 }}>
          We are located just minutes from high street, at{' '}
          <a href={SITE.comfortMapUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--terracotta)' }}>
            {SITE.comfortAddress}
          </a>
        </p>

        <div className="mt-10 border p-10" style={{ borderColor: 'var(--gold)', backgroundColor: 'var(--cream-deep)' }}>
          <p className="smallcaps mb-3" style={{ color: 'var(--terracotta)' }}>Now Booking</p>
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(22px, 3vw, 30px)', color: 'var(--ink)' }}>
            Schedule a private tasting
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <a href={BOOK_HREF} className="btn-saloon" style={{ textDecoration: 'none' }}>
              Book Now
            </a>
            <a href={SITE.phoneHref} className="inline-flex items-center gap-2 text-sm hover:opacity-75" style={{ color: 'var(--ink-soft)', textDecoration: 'none' }}>
              <Phone className="h-4 w-4" style={{ color: 'var(--gold-deep)' }} /> {SITE.phone}
            </a>
            <a href={`mailto:${SITE.email}`} className="inline-flex items-center gap-2 text-sm hover:opacity-75" style={{ color: 'var(--ink-soft)', textDecoration: 'none' }}>
              <Mail className="h-4 w-4" style={{ color: 'var(--gold-deep)' }} /> {SITE.email}
            </a>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--ink-soft)' }}>
            <MapPin className="h-3.5 w-3.5" style={{ color: 'var(--gold-deep)' }} /> {SITE.comfortAddress}
          </p>
        </div>
      </section>
    </>
  )
}
