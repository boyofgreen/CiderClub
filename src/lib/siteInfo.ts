// Shared facts for the public site — one place to update hours, addresses, links.

export const SITE = {
  name: 'Hill Country Cider House',
  tagline: 'Small Batch, Quality Cider · Est. 2020',
  phone: '(830) 344-0441',
  phoneHref: 'tel:+18303440441',
  email: 'hello@hillcountryciderhouse.com',
  address: '405 HWY 90 West, Castroville TX 78009',
  addressMapUrl: 'https://maps.google.com/?q=405+HWY+90+West,+Castroville+TX+78009',
  comfortAddress: '130 Holiday Road, Comfort, Texas 78013',
  comfortMapUrl: 'https://maps.google.com/?q=130+Holiday+Road,+Comfort+TX+78013',
  instagram: 'https://instagram.com/hillcountrycider',
  facebook: 'https://www.facebook.com/HillCountryCiderHouse',
  shop: 'https://hillcountryciderhouse.square.site/',
  supperClub: 'https://ticketscandy.com/e/comfort-joy-holiday-orchard-supper-club-by-hill-country-cider-house-20415',
}

export const HOURS: Array<{ days: string; hours: string }> = [
  { days: 'Sunday – Tuesday', hours: 'Closed' },
  { days: 'Wednesday', hours: '4PM – 8PM' },
  { days: 'Thursday', hours: '4PM – 8PM' },
  { days: 'Friday', hours: '4PM – 9PM' },
  { days: 'Saturday', hours: '2PM – 9PM' },
]

/**
 * Public pages whose views are recorded for analytics. Explicit rather than
 * pattern-matched so a bot can't fill the PageView table with junk paths.
 * Add new public routes here to see them in the admin analytics.
 */
export const TRACKED_PATHS = [
  '/',
  '/tasting-room',
  '/saturdays-in-comfort',
  '/cigars',
  '/apple-trees',
  '/about',
  '/contact',
  '/club',
  '/register',
  '/magic/request',
] as const

/** Friendly labels for the analytics "Top Pages" table */
export const PATH_LABELS: Record<string, string> = {
  '/': 'Home',
  '/tasting-room': 'Tasting Room',
  '/saturdays-in-comfort': "Saturday's in Comfort",
  '/cigars': 'Cigars',
  '/apple-trees': 'Apple Trees',
  '/about': 'About',
  '/contact': 'Contact',
  '/club': 'Cider Club',
  '/register': 'Join / Register',
  '/magic/request': 'Member Sign-in',
}

export const NAV_LINKS: Array<{ href: string; label: string; external?: boolean }> = [
  { href: '/tasting-room', label: 'Tasting Room' },
  { href: '/saturdays-in-comfort', label: 'Saturdays in Comfort' },
  { href: '/cigars', label: 'Cigars' },
  { href: SITE.supperClub, label: 'Supper Club', external: true },
  { href: '/about', label: 'About' },
  { href: SITE.shop, label: 'Shop', external: true },
]

/** Extra destinations that appear in the footer but not the top nav. */
export const FOOTER_EXPLORE: Array<{ href: string; label: string; external?: boolean }> = [
  { href: '/tasting-room', label: 'Tasting Room' },
  { href: '/saturdays-in-comfort', label: 'Saturdays in Comfort' },
  { href: '/cigars', label: 'Cigars' },
  { href: SITE.supperClub, label: 'Supper Club', external: true },
  { href: '/apple-trees', label: 'Apple Trees' },
  { href: '/club', label: 'Join the Cider Club' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]
