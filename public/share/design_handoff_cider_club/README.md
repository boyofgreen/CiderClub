# Handoff: Hill Country Cider Club — Member Experience

## Overview

Redesign of the Cider Club's public-facing landing page and three-step registration flow, brand-matched to **hillcountryciderhouse.com**. Replaces the generic Tailwind-orange treatment currently in `src/app/page.tsx` and `src/app/register/page.tsx` with a Texas Hill Country heritage-saloon aesthetic — navy, antique gold, terracotta, real bottle photography, and folksy voice.

The goal: a member experience that feels like the same business as the marketing site, not a generic SaaS dashboard pasted on top.

## About the Design Files

The HTML files in this bundle are **design references**, not production code to copy directly. They were prototyped in plain React + JSX (loaded via Babel-standalone in the browser) so they could be iterated on quickly.

**Your task** is to recreate these designs in the existing codebase — Next.js 14 App Router with Tailwind CSS and the `lucide-react` icon set — using the project's existing component patterns (`src/components/ui/Button.tsx`, `Card.tsx`, `Input.tsx`, etc.). Update the Tailwind theme tokens, replace the hand-rolled `.btn-saloon` / `.field-saloon` CSS in `globals.css` with proper Tailwind utilities or `@layer components` rules, and refactor the existing `Button` / `Input` components to match.

## Fidelity

**High-fidelity.** All colors, typography, spacing, and copy are intentional and final. Recreate pixel-perfectly.

## Aesthetic Direction

- **Heritage Texas saloon, refined.** Echoes the brand's longhorn-shield logo and "Small Batch · Quality Cider" tagline, but cleaner and more typographically restrained than the logo itself.
- **Voice:** warm, folksy, first-person plural. Phrases used: "Pull up a chair," "You're family now," "We Holler," "Saddle Up," "Come On Down," "You're in, partner."
- **Tier names:** "The Pickers" (3 bottles) · "The Pressers" (6 bottles, featured) · "Cellar Crew" (9 bottles). Bottle counts (3/6/9) are fixed; names can be revisited but match the warm orchard metaphor.

## Design Tokens

All hex values lifted from the brand site / logo.

### Colors
```
--navy:           #1a2540   /* primary background, hero, footer */
--navy-deep:      #131c33   /* footer base */
--navy-soft:      #2a3654   /* subtle navy variants */
--gold:           #c9a14a   /* primary accent, rules, badges */
--gold-bright:    #e7c87a   /* highlights on dark, hover states */
--gold-deep:      #9c7a2e   /* numbered roman labels, button shadow */
--cream:          #f7f1e3   /* light text on navy */
--cream-deep:     #efe6cf   /* page bg behind tier cards */
--paper:          #fbf6e9   /* card surfaces, form fields */
--terracotta:     #b65a3c   /* primary CTA */
--terracotta-deep:#8a4128   /* CTA hover, button shadow */
--ink:            #1d1a14   /* body text */
--ink-soft:       #4a4334   /* secondary text */
--rule:           rgba(201, 161, 74, 0.35)   /* hairline borders */
--rule-strong:    rgba(201, 161, 74, 0.7)    /* visible borders, dashed perforations */
```

### Typography

Two Google Fonts:

- **Playfair Display** — display headings (h1, h2, tier names, big stats). Use **italic** for emphasis phrases (e.g. "*You're family* now").
- **Inter Tight** — body, buttons, form labels, nav.

Add to `src/app/layout.tsx`:
```tsx
import { Playfair_Display, Inter_Tight } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' })
const interTight = Inter_Tight({ subsets: ['latin'], variable: '--font-sans' })
```

Type scale used:
- H1 hero: 92px / line-height 0.96 / weight 400 / letter-spacing -0.01em
- H2 section: 64px / 1.05 / 400
- H3 tier name: 38px / 1.05 / 400
- Body large: 19px / 1.55
- Body: 15px / 1.55
- Body small: 13–14px / 1.55–1.6
- Smallcaps utility: 9–11px / weight 600–700 / letter-spacing 0.18–0.28em / **uppercase**

The "smallcaps" pattern is used throughout for utility text (nav links, kicker eyebrows, card subtitles, footer column headers). It echoes "SMALL BATCH · QUALITY CIDER" on the bottle labels.

### Spacing

- Section vertical padding: 120px
- Hero padding: 100px top, 120px bottom
- Card inner padding: 48px 36px (tiers), 32px 56px (registration steps)
- Container max-width: 1280px
- Form field padding: 12px 14px
- Button padding: 14px 28px

### Borders & Effects

- No rounded corners. Everything is squared off — this is intentional and brand-correct.
- Hairline gold borders (`1px solid var(--rule)`) on cards
- Bottom-only thicker gold border on form fields (`border-bottom: 1.5px solid var(--gold-deep)`)
- Dashed perforations on registration ticket header (`1px dashed var(--rule-strong)`) with circular cutouts at ends to create a "tear-off ticket" effect
- Button shadow: `0 2px 0 <darker shade>` (a flat hard shadow, not a soft drop shadow)
- Card shadow on featured tier: `0 30px 60px rgba(26,37,64,0.25)`
- Subtle paper-grain texture on cream backgrounds via two dotted radial gradients (see `.paper-bg` in `styles.css`)

## Screens

### 1. Public Landing Page — `src/app/page.tsx`

A long-scroll page with seven distinct sections.

#### 1a. Top Nav
- Sticky, paper-cream background by default (toggleable to dark navy via the Tweaks panel; pick one and ship)
- Left: Shield badge SVG (48px wide, fixed-width container) + "Hill Country" Playfair italic 18px + "CIDER HOUSE" smallcaps 9px in gold beneath
- Right: nav links in smallcaps ("Tasting Room," "Apple Trees," "About," "Contact"), then "JOIN THE CLUB" with gold underline (current page indicator), then "MEMBER SIGN-IN" lower-opacity
- 18px vertical padding, 56px horizontal, max-width 1280px

#### 1b. Hero — Navy
- Full-bleed `var(--navy)` background with a faint star-field pattern (three radial-gradient dots at 8% opacity)
- Two-column grid (1.3fr / 1fr), 80px gap, max-width 1280px
- Left column:
  - Eyebrow: gold rule line + smallcaps "A QUARTERLY CIDER CLUB ✦ COMFORT, TEXAS"
  - H1 (Playfair, 92px): "Pull up a chair." + "*You're family* now." (italic + gold-bright on the second line)
  - Lede paragraph (Inter Tight, 19px, cream at 78% opacity, max-width 540px): "Four times a year, we set aside a small batch of our best ciders for the people who make this place feel like home. Pick the bottles you love. Bring a friend. We'll keep the porch light on."
  - Buttons: gold "Join the Club →" + ghost-navy outline "View the Lineup"
  - 3-stat strip below a gold hairline rule: 142 Members / 23 Ciders Released / 4× Pickup Parties / yr (Playfair italic 36px in gold-bright + smallcaps label)
- Right column: collage of two bottle photos and a circular "MEMBERS ONLY 20% OFF" stamp
  - `brand/cherry.jpg` rotated +3°, 260×340, with cream caption tag "Cherry Bloom · 7.6%"
  - `brand/pineapple.jpg` rotated -4°, 240×200, with terracotta caption tag "Pineapple Paradise"
  - Stamp: 130×130 circle, 2px gold border, rotated -8°, semi-transparent navy fill, "MEMBERS ONLY / 20% / OFF BOTTLES"

#### 1c. How It Works — Cream
- Section heading: smallcaps "HOW IT WORKS" in terracotta + H2 "*Four seasons,* four good reasons" + star divider (`✦ ✦ ✦` between gold rules)
- 4-column grid, hairline gold dividers between cells (1px gap with gold background showing through)
- Each cell: roman numeral (I., II., III., IV.) in Playfair italic 56px gold-deep, then Playfair 26px title, then 14px ink-soft body
- Steps: "Saddle Up" → "We Holler" → "Pick Your Bottles" → "Come On Down"

#### 1d. Tier Cards — Cream-Deep
- Heading: smallcaps "THREE TIERS" + H2 "Choose your *seat at the table*"
- Subtitle: "Billed quarterly when you pick up. Pause whenever you'd like. Cancel any time, no hard feelings."
- 3-column grid, 28px gap. Middle card (The Pressers) is `var(--navy)` bg / cream text / 1px gold border, with terracotta "★ Most Picked ★" stamp protruding 14px above. Outer two are paper-bg with hairline gold border.
- Each card structure:
  - Top section (centered, gold-bordered bottom): "Level I/II/III" Playfair italic 18px + Tier name Playfair 38px + smallcaps "N BOTTLES · EVERY QUARTER"
  - Price section (centered, gold-bordered bottom): "$65/$120/$170" Playfair italic 64px + "/ quarter" suffix + italic blurb in quotes
  - Perks list: terracotta `✦` bullet (or gold-bright on featured) + 14px Inter Tight perk
  - Full-width CTA button: terracotta `btn-saloon` on outer, gold `btn-gold` on featured, both labeled "Saddle Up →"
- Below grid, centered: "Already a member? [Get your access link →]" with terracotta underlined link

**Tier perks (exact copy):**
- The Pickers: "Member discount: 10% off bottles" / "5% off everything else" / "One free pour each visit" / "Pickup party invite"
- The Pressers: above + "Open-bar pickup parties" / "Early access to new releases" / member discount changes to **15% / 5%** and free pour for **you + a guest**
- Cellar Crew: above + "First access to limited releases" / "Free barrel-room reservation"; discount **20% / 10%**

#### 1e. Lineup — Navy
- Heading row: "THIS QUARTER'S POUR" smallcaps + H2 "Spring '26 *Lineup*" on the left; right-aligned 14px description on the right ("Eight ciders are on tap this quarter. Members can mix any combination — defaults are set, but the choice is always yours.")
- 4-column bottle grid, 24px gap
- Each bottle card: 3/4 aspect-ratio image in `.bottle-frame` (cream-deep bg, 1px gold border, 6px inner-inset gold border via `::after`), then 20px down: Playfair italic 24px name + smallcaps 9px "STYLE · ABV%"
- Bottles: Cherry Bloom (Dry · Sparkling · 7.6%), Pineapple Paradise (Sweet · Tropical · 5.8%), Lemongrass Lush (Botanical · Bright · 6.4%), Black Bart (Gentleman's Cider · 6.8%)

#### 1f. Founder Letter — Cream
- Centered, max-width 720px
- Giant gold open-quote glyph (Playfair italic 80px)
- Body: Playfair italic 32px / line-height 1.4 / ink: "We started pressing apples in our backyard with a hand crank and a stubborn streak. Eight years on, this club is how we say thank you to the folks who showed up early — and stayed."
- 80px gold rule + smallcaps terracotta "— THE FOUNDERS, COMFORT TX"

#### 1g. Footer — Navy-Deep
- 4-column grid (1.4fr / 1fr / 1fr / 1fr), 48px gap, paddinged from sticky nav padding
- Col 1: 70px Badge SVG + tagline "Small-batch craft cider, pressed and bottled in the Texas Hill Country since 2020."
- Cols 2–4: smallcaps gold-bright header + 4 list items each, 13px Inter Tight at 75% opacity
  - Visit: Tasting Room / Saturdays in Comfort / Apple Trees / Supper Club
  - Club: Join the Club / Member Sign-in / FAQs / Pickup Schedule
  - Reach Us: hello@hillcountryciderhouse.com / (830) 344-0441 / Comfort, Texas / @hillcountrycider
- Bottom strip with hairline rule: "© 2026 Hill Country Cider House · Small Batch · Quality Cider" / "Drink responsibly · 21+" both in 10px smallcaps at 50% opacity

### 2. Registration Flow — `src/app/register/page.tsx`

Four steps, rendered as a single perforated-ticket card on a `.paper-bg` page with paper grain.

#### Shared chrome
- Page background: `var(--paper)` with subtle dotted grain
- Centered max-width 640px
- Above the card: ProgressRail — three diamond (rotated 45°) numbered tokens connected by hairline rules with `✦` mid-points. Active = terracotta border + terracotta numeral. Done = filled terracotta + cream check. Future = gold-rule border + ink-soft numeral. Labels beneath in smallcaps: "YOUR DETAILS" / "PICK YOUR TIER" / "CARD ON FILE"
- Card body: `var(--paper)` background with paper-card box-shadow
- TicketHeader at top of card: centered Badge SVG (66px), Playfair italic 32px "Welcome to the Club", smallcaps 10px terracotta "HILL COUNTRY CIDER HOUSE · EST. 2020", separated from step content by **dashed gold rule with two cream circular cutouts** at the edges (the "tear here" perforation effect)
- Below card: smallcaps 10px ink-soft link "← BACK TO HILL COUNTRY CIDER HOUSE"

#### Step 1 — Your Details
- "Tell us who you are" Playfair italic 26px, then 13px ink-soft "We'll send a magic link — no passwords to forget."
- Form fields, smallcaps labels above, 16px gap, 18px field bottom margin:
  - First name / Last name (2-col grid)
  - Email (full-width, hint: "Pickup reminders and your magic link land here.")
  - Phone (full-width, hint: "Optional — text reminders for pickup parties.")
  - City / State (2-char) / Zip (3-col 2:1:1 grid)
- Field hints: 11px italic ink-soft at 70% opacity
- Required-field asterisks in terracotta
- Full-width terracotta `btn-saloon`: "Next: Pick Your Tier →"

#### Step 2 — Pick Your Tier
- "Pick your tier" Playfair italic 26px + "Billed each quarter at pickup. Pause anytime."
- Stacked tier rows (full-width, 12px gap), each row has:
  - Diamond (rotated 45°) checkbox on the left, filled terracotta when selected
  - Tier name Playfair italic 22px + smallcaps gold-deep "LEVEL I/II/III" + (if featured) terracotta-bordered "MOST PICKED" pill
  - 13px ink-soft sub: "N bottles per quarter · <blurb>"
  - Right-aligned price: Playfair italic 28px + smallcaps "PER QUARTER"
- Selected row: terracotta border + light terracotta tint (rgba(182,90,60,0.05))
- Then a "Referral code" optional field
- Bottom row: ghost-navy "← Back" + flex-1 terracotta "Next: Card on File →"

#### Step 3 — Card on File
- "Card on file" Playfair italic 26px + reassurance "We won't charge a penny today. Your card is billed when you pick up your quarterly box."
- Inner card (paper bg, 24px padding, gold hairline border):
  - Card number field with monospace placeholder + right-aligned VISA chip in gold-deep smallcaps
  - 3-col grid: Expires (MM / YY) / CVC / Zip
  - 11px legal: "🔒 Card info is securely stored by Square. We never see your full card number."
- Order summary strip (navy bg, 20×24 padding) below: tier name + price, both in cream/gold-bright Playfair italic
- Bottom row: ghost-navy "← Back" + terracotta "Saddle Up — Join the Club"
- Skip link: "Skip for now — add a card later" centered, 11px ink-soft underlined

#### Step 4 — Confirmation
- Centered 80px gold-bordered circle with `✦` glyph (Playfair italic 40px gold-deep)
- Playfair italic 36px "You're in, partner."
- 15px message: "We just sent a welcome note to **{email}** with your member portal link. Check your inbox."
- 3-cell stat strip with gold hairline top + bottom: First Pickup (June 14) / Member # (0143) / Tier (Pressers) — each cell: smallcaps 9px label + Playfair italic 20px value
- Terracotta "Open Member Portal →" CTA

## Interactions & Behavior

- **Step navigation** is local state (`useState`). Each Next/Back swaps the card body. The progress rail re-renders to show current/done/future states.
- **Tier selection** is a controlled radio. Click anywhere on a tier row to select. Visual feedback: border + bg tint switch.
- **Form validation:** existing app code does basic required-field gating (disable Next until firstName/lastName/email are non-empty). Match that.
- **Square card mount:** existing register page lazy-loads `square.js` and mounts a hosted card form into `#square-card-container`. Keep that contract — the design just provides the visual shell around it. The mock card UI in the design is a *placeholder* for the Square iframe; the real implementation should keep the Square integration as-is and just style the surrounding container with `var(--paper)` bg + gold hairline border.
- **No animations** beyond default browser focus rings on inputs and a subtle `translateY(-1px)` button hover.

## Component Refactor Targets

The existing `src/components/ui/Button.tsx`, `Input.tsx`, `Card.tsx`, `Alert.tsx`, `Badge.tsx`, `Spinner.tsx` are generic SaaS-style. To match this design:

- **Button:** add `saloon` (terracotta primary), `gold` (Playfair-adjacent gold CTA on dark), and `ghost-navy` (outlined) variants. All buttons are square-cornered, smallcaps text, with a flat 2px hard shadow.
- **Input:** Pull bottom-only thick gold border, paper bg. Smallcaps label above. Italic hint below at 70% opacity.
- **Card:** Square corners, hairline gold border, paper bg, optional dashed perforated header.
- **Badge SVG:** New component — see `screens/landing.jsx` for the reference. Echoes the longhorn shield with simplified strokes. Sizes 48 / 66 / 70 / 110 used.

## Tailwind Config Updates

Replace the brand orange scale in `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      navy:       { DEFAULT: '#1a2540', deep: '#131c33', soft: '#2a3654' },
      gold:       { DEFAULT: '#c9a14a', bright: '#e7c87a', deep: '#9c7a2e' },
      cream:      { DEFAULT: '#f7f1e3', deep: '#efe6cf', paper: '#fbf6e9' },
      terracotta: { DEFAULT: '#b65a3c', deep: '#8a4128' },
      ink:        { DEFAULT: '#1d1a14', soft: '#4a4334' },
    },
    fontFamily: {
      serif: ['var(--font-serif)', 'Georgia', 'serif'],
      sans:  ['var(--font-sans)', 'system-ui', 'sans-serif'],
    },
  },
},
```

Update `globals.css` `@layer components` — replace `.btn-primary`, `.input`, `.card` with saloon-styled equivalents. See `styles.css` in this bundle for the exact rules.

## Assets

Bottle photography lives in this bundle under `brand/`:
- `cherry.jpg` — Cherry Bloom on rust linen with yellow flowers
- `pineapple.jpg` — Pineapple Paradise cocktail flat-lay
- `lemongrass.jpg` — Lemongrass Lush
- `hero1.jpg` — Black Bart bottle / Paris-themed packaging
- `logo.png` — official shield logo (use directly when not using the simplified `Badge` SVG)
- `saturday.png` — supplementary marquee photo (not used in current screens but kept for future)
- `club.png` — original tier comparison table from the marketing site (reference only; do not ship)

These are sourced from hillcountryciderhouse.com's Squarespace CDN and should be re-hosted in your project (`public/brand/`).

## Files in This Bundle

- `Cider Club Experience.html` — entry HTML, sets up React + Babel + Google Fonts
- `styles.css` — design tokens + utility classes (`.serif`, `.sans`, `.smallcaps`, `.btn-saloon`, `.btn-gold`, `.btn-ghost-navy`, `.field-saloon`, `.bottle-frame`, `.paper-bg`, etc.)
- `screens/landing.jsx` — full landing-page composition + Badge SVG component
- `screens/register.jsx` — 4-step registration card
- `design-canvas.jsx` / `tweaks-panel.jsx` — prototyping host (ignore; not part of the deliverable)
- `brand/` — photography and logo source files

## Open Questions for the Developer

1. Tier names ("The Pickers / Pressers / Cellar Crew") are proposals. The product team should confirm before launch.
2. Lineup section uses placeholder bottle metadata (style, ABV) — wire to `Product.style` and `Product.abv` from Prisma.
3. Stat numbers in hero (142 members, 23 ciders, 4× pickup parties) are placeholder — pull from `AnalyticsSnapshot` or compute live.
4. Square card form must replace the visual mock in Step 3 — keep the existing mount logic, just restyle the wrapper.
