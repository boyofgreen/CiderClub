import Image from 'next/image'
import type { Metadata } from 'next'
import { SITE } from '@/lib/siteInfo'

export const metadata: Metadata = {
  title: 'Apple Trees',
  description:
    'Have apple trees on your property? We pick them for free and turn them into Texas cider — you get a bottle for every 3 bushels.',
}

const FAQ: Array<{ q: string; a: string }> = [
  { q: 'Who picks the apples?', a: 'We will come to your property at a convenient time, and pick the apples for you.' },
  { q: 'How long does it take?', a: 'It takes a few hours per tree.' },
  { q: 'Do you bring your own equipment?', a: 'Yes, we’ll bring everything we need to pick the apples.' },
  { q: 'Are you insured while on my property?', a: 'Yes, we are bonded for all our cidery work, so there is no risk to you even in the unlikely event of an accident.' },
  { q: 'What do I get in exchange for my apples?', a: 'Cider! We will provide you a bottle of our amazing cider for every 3 bushels of apples. Everybody wins.' },
  { q: 'Can I still harvest the apples I want first?', a: 'Absolutely. We’ll be happy to pick the apples that you don’t want. We don’t need pretty apples for cider, so feel free to pick the apples you want first, and we’ll take the rest.' },
  { q: 'Can I keep the apples you pick?', a: 'We can make a deal! Just let us know before we start.' },
  { q: 'What kind of apple trees are you looking for?', a: 'Actually, any kind of apple will work for cider. Often, the apples that are considered “spitters” or apples not suitable for eating are the best for making cider. You don’t need to know the variety — wild apples are just as useful as variety apples.' },
  { q: 'Are you interested in crab apples?', a: 'Absolutely, we use crab apples more than full sized apples.' },
  { q: 'When do you pick apples?', a: 'Depending on the tree, apple picking season starts as early as May, and as late as October in Texas. You may not know when your apples are ready to harvest, so it’s best to give us a call when the first apple drops from the tree.' },
  { q: 'My apples are bitter or have an odd taste — are you still interested?', a: 'Absolutely, cider apples are often more tart or more dry than the apples that are used for eating. Often, the apples considered “spitters” are the best for making cider.' },
  { q: 'Can you use apples that fall from the tree?', a: 'Per federal regulation, we can’t use fruit that has been on the ground, so we try to get to the tree before too many of them fall.' },
  { q: 'Do you provide any tree care or pruning of trees?', a: 'When possible, we like to identify trees in the spring, and try to estimate the amount and type of apples that will come from the tree. For visits, we sometimes do some pruning to maximize the apple growth. We don’t touch any trees without the express permission of the owners and try to not alter the aesthetics of the tree.' },
  { q: 'How do I sign up?', a: 'Reach out to us at hello@hillcountryciderhouse.com and we’ll get rolling.' },
]

export default function AppleTreesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative h-[48vh] min-h-[340px] w-full">
        <Image
          src="/site/apple-tree-home.webp"
          alt="A Texas home with an apple tree bearing ripe red apples in the front yard"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(26,37,64,0.45), rgba(26,37,64,0.72))' }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="smallcaps mb-4" style={{ color: 'var(--gold)' }}>Where it all starts</p>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(32px, 5vw, 56px)',
              color: 'var(--cream)',
            }}
          >
            Apple Trees
          </h1>
        </div>
      </section>

      {/* Pitch */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div
          className="border p-8 text-center"
          style={{ borderColor: 'var(--gold)', backgroundColor: 'var(--cream-deep)' }}
        >
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(20px, 3vw, 26px)', color: 'var(--ink)', lineHeight: 1.4 }}>
            Want to sign up to have your apples turned into cider?
          </p>
          <p className="mt-3 text-sm" style={{ color: 'var(--ink-soft)' }}>
            Reach out and we&rsquo;ll get rolling.
          </p>
          <a href={`mailto:${SITE.email}?subject=Apple%20trees`} className="btn-saloon mt-6" style={{ textDecoration: 'none' }}>
            Email Us About Your Trees
          </a>
        </div>

        <div className="mt-12 space-y-4" style={{ color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1.75 }}>
          <p>
            We try to use as many Texas apples as we can to make our Texas based cider. We find that many
            people have either a few apple trees that produce more fruit than they can use or &ldquo;wild&rdquo;
            apple trees growing on their property somewhere. Hill Country Cider House can use those apples to
            make amazing Texas cider.
          </p>
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 20, color: 'var(--ink)' }}>
            Yellow, red, or green&hellip; sweet, bitter or crabby&hellip; we can use them all!
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ backgroundColor: 'var(--cream-deep)', borderTop: '1px solid var(--rule)' }}>
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h2
            className="text-center mb-10"
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(24px, 3.5vw, 34px)',
              color: 'var(--ink)',
            }}
          >
            Apple Tree FAQ
          </h2>
          <div className="space-y-0 border" style={{ borderColor: 'var(--rule)', backgroundColor: 'var(--paper)' }}>
            {FAQ.map((item, i) => (
              <details
                key={item.q}
                className="group"
                style={{ borderTop: i > 0 ? '1px solid var(--rule)' : 'none' }}
              >
                <summary
                  className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 list-none"
                  style={{ color: 'var(--ink)', fontWeight: 600, fontSize: 15 }}
                >
                  {item.q}
                  <span
                    className="shrink-0 transition-transform group-open:rotate-45"
                    style={{ color: 'var(--gold-deep)', fontSize: 22, lineHeight: 1 }}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="px-5 pb-4 text-sm" style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
