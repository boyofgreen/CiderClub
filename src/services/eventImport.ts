import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod/v4'
import { isoToWallClock, VENUE_TIME_ZONE } from '@/lib/eventTime'

/** Pre-filled values for the admin event form. Times are venue wall-clock "YYYY-MM-DDTHH:mm". */
export interface EventDraft {
  title: string
  description: string
  eventType: string
  startsAt: string
  endsAt: string
  location: string
  imageUrl: string
  ticketUrl: string
  priceText: string
  source: 'LINK' | 'AI'
  sourceUrl: string
}

export class ImportError extends Error {}

const EVENT_TYPES = ['RELEASE_PARTY', 'TASTING', 'FARM_VISIT', 'WORKSHOP', 'OTHER'] as const

function matchEventType(text: string): string | null {
  const t = text.toLowerCase()
  if (/supper|dinner|pairing|tasting|flight/.test(t)) return 'TASTING'
  if (/release|launch|first pour/.test(t)) return 'RELEASE_PARTY'
  if (/orchard|farm|pick/.test(t)) return 'FARM_VISIT'
  if (/workshop|class|learn/.test(t)) return 'WORKSHOP'
  return null
}

/** The title says what the event is; the description only breaks ties. */
function guessEventType(title: string, description: string): string {
  return matchEventType(title) ?? matchEventType(description) ?? 'OTHER'
}

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

function formatPrice(price: unknown, currency: unknown): string {
  const n = Number(price)
  if (!isFinite(n) || n <= 0) return n === 0 ? 'Free' : ''
  const amount = Number.isInteger(n) ? String(n) : n.toFixed(2)
  return currency && currency !== 'USD' ? `${amount} ${currency}` : `$${amount}`
}

function assertPublicHttpsUrl(raw: string): URL {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    throw new ImportError("That doesn't look like a link. Paste the full address, starting with https://")
  }
  const host = url.hostname
  if (
    url.protocol !== 'https:' ||
    host === 'localhost' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
    host.includes(':') ||
    !host.includes('.')
  ) {
    throw new ImportError('Only public https:// event pages can be imported.')
  }
  return url
}

// ─── Import from a ticketing page ────────────────────────────────────────────
// TicketsCandy, Eventbrite and most ticketing sites publish a schema.org Event
// record (JSON-LD) on each event page for search engines. We read that rather
// than scraping the visible layout, so it keeps working when their design changes.

type JsonObject = Record<string, unknown>

function findEvent(node: unknown): JsonObject | null {
  if (!node || typeof node !== 'object') return null
  if (Array.isArray(node)) {
    for (const item of node) {
      const hit = findEvent(item)
      if (hit) return hit
    }
    return null
  }
  const obj = node as JsonObject
  const type = obj['@type']
  const types = Array.isArray(type) ? type : [type]
  if (types.some((t) => typeof t === 'string' && /Event$/.test(t))) return obj
  if (obj['@graph']) return findEvent(obj['@graph'])
  return null
}

function str(v: unknown): string {
  return typeof v === 'string' ? decodeEntities(v).trim() : ''
}

function imageFrom(v: unknown): string {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return imageFrom(v[0])
  if (v && typeof v === 'object') return str((v as JsonObject).url)
  return ''
}

function locationFrom(v: unknown): string {
  const loc = (Array.isArray(v) ? v[0] : v) as JsonObject | undefined
  if (!loc || typeof loc !== 'object') return str(v)
  const name = str(loc.name)
  const addr = loc.address as JsonObject | string | undefined
  let address = ''
  if (typeof addr === 'string') address = str(addr)
  else if (addr && typeof addr === 'object') {
    // Some sites (TicketsCandy) put the whole address in streetAddress; only
    // add city/region/zip when they aren't already in it.
    address = str(addr.streetAddress)
    for (const part of [str(addr.addressLocality), str(addr.addressRegion), str(addr.postalCode)]) {
      if (part && !address.toLowerCase().includes(part.toLowerCase())) {
        address = address ? `${address}, ${part}` : part
      }
    }
  }
  if (name && address && !address.startsWith(name)) return `${name}, ${address}`
  return name || address
}

function eventFromHtml(html: string): JsonObject | null {
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const event = findEvent(JSON.parse(m[1]))
      if (event) return event
    } catch {
      continue
    }
  }
  return null
}

export type TicketStatus = 'AVAILABLE' | 'SOLD_OUT'

/** Map schema.org availability to our two states; null when the page doesn't say. */
export function ticketStatusFromAvailability(availability: unknown): TicketStatus | null {
  const a = typeof availability === 'string' ? availability.split('/').pop()?.toLowerCase() : ''
  if (!a) return null
  if (['soldout', 'outofstock', 'discontinued'].includes(a)) return 'SOLD_OUT'
  if (['instock', 'limitedavailability', 'preorder', 'presale', 'onlineonly', 'instoreonly'].includes(a)) {
    return 'AVAILABLE'
  }
  return null
}

/**
 * Ask a ticket page whether tickets are still on sale. Returns null when the
 * page can't be read or doesn't publish availability (TicketsCandy omits it on
 * some events), so callers keep the last known value rather than guessing.
 */
export async function fetchTicketStatus(rawUrl: string): Promise<TicketStatus | null> {
  try {
    const url = assertPublicHttpsUrl(rawUrl)
    const res = await fetch(url, {
      headers: { 'User-Agent': 'HillCountryCiderHouse-EventImport/1.0', Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const event = eventFromHtml(await res.text())
    const offers = (Array.isArray(event?.offers) ? event?.offers : [event?.offers]) as Array<JsonObject | undefined>
    const statuses = offers.map((o) => ticketStatusFromAvailability(o?.availability)).filter(Boolean)
    if (statuses.length === 0) return null
    // Several ticket types: sold out only when every one is.
    return statuses.every((s) => s === 'SOLD_OUT') ? 'SOLD_OUT' : 'AVAILABLE'
  } catch {
    return null
  }
}

export async function importFromUrl(rawUrl: string): Promise<EventDraft> {
  const url = assertPublicHttpsUrl(rawUrl)

  let html: string
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'HillCountryCiderHouse-EventImport/1.0', Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) throw new ImportError(`That page returned an error (${res.status}). Check the link and try again.`)
    html = await res.text()
  } catch (err) {
    if (err instanceof ImportError) throw err
    throw new ImportError("Couldn't reach that page. Check the link and try again.")
  }

  const event = eventFromHtml(html)
  if (!event) {
    throw new ImportError(
      "That page doesn't publish event details we can read. Try the screenshot import instead."
    )
  }

  const offers = (Array.isArray(event.offers) ? event.offers[0] : event.offers) as JsonObject | undefined
  const title = str(event.name)
  const description = str(event.description)
  const startsAt = isoToWallClock(str(event.startDate))
  if (!title || !startsAt) {
    throw new ImportError("That page is missing the event's name or date. Try the screenshot import instead.")
  }

  return {
    title,
    description,
    eventType: guessEventType(title, description),
    startsAt,
    endsAt: isoToWallClock(str(event.endDate)) ?? '',
    location: locationFrom(event.location),
    imageUrl: imageFrom(event.image),
    ticketUrl: str(offers?.url) || url.toString(),
    priceText: offers ? formatPrice(offers.price ?? offers.lowPrice, offers.priceCurrency) : '',
    source: 'LINK',
    sourceUrl: url.toString(),
  }
}

// ─── Read a screenshot or pasted post with Claude ────────────────────────────

const ExtractedEvent = z.object({
  found: z.boolean().describe('false if the input does not describe a specific event'),
  title: z.string(),
  description: z.string().describe('One or two sentences for a public events page, in the host’s own words where possible'),
  eventType: z.enum(EVENT_TYPES),
  startsAt: z.string().describe('Local start time as YYYY-MM-DDTHH:mm, 24-hour, empty if unknown'),
  endsAt: z.string().describe('Local end time as YYYY-MM-DDTHH:mm, 24-hour, empty if unknown'),
  location: z.string(),
  ticketUrl: z.string().describe('A ticket or RSVP link if one appears, else empty'),
  priceText: z.string().describe('Price as written, e.g. "$25" or "Free", else empty'),
})

const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const
type ImageType = (typeof SUPPORTED_IMAGE_TYPES)[number]

export function aiImportConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

export async function extractWithAI(input: {
  imageBase64?: string
  imageType?: string
  text?: string
}): Promise<EventDraft> {
  if (!aiImportConfigured()) {
    throw new ImportError('Screenshot import needs an ANTHROPIC_API_KEY setting in Azure.')
  }
  const text = input.text?.trim() ?? ''
  if (!input.imageBase64 && !text) throw new ImportError('Add a screenshot or paste the event text.')
  if (input.imageBase64 && !SUPPORTED_IMAGE_TYPES.includes(input.imageType as ImageType)) {
    throw new ImportError('Use a PNG, JPEG, WebP or GIF screenshot.')
  }

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: VENUE_TIME_ZONE }).format(new Date())
  const content: Anthropic.ContentBlockParam[] = []
  if (input.imageBase64) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: input.imageType as ImageType, data: input.imageBase64 },
    })
  }
  content.push({
    type: 'text',
    text: [
      `This is an event announcement from Hill Country Cider House (a cidery in Castroville and Comfort, Texas), usually a screenshot or copy of a Facebook event or post. Extract the event details for our website's events page.`,
      `Today is ${today}. If the year isn't shown, use the next upcoming occurrence of that date. Times are local Texas time — give them exactly as shown, converted to 24-hour, with no time zone adjustment.`,
      `If no end time is shown, leave endsAt empty rather than guessing. If a field isn't in the input, leave it empty — don't invent details.`,
      text ? `\nPasted text:\n${text}` : '',
    ].join('\n'),
  })

  const client = new Anthropic()
  let response
  try {
    response = await client.messages.parse({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      output_config: { effort: 'low', format: zodOutputFormat(ExtractedEvent) },
      messages: [{ role: 'user', content }],
    })
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new ImportError('The ANTHROPIC_API_KEY in Azure was rejected. Check it in the Anthropic console.')
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new ImportError('Too many requests right now — wait a minute and try again.')
    }
    if (err instanceof Anthropic.APIError) {
      console.error('[event-import] Claude API error:', err.status, err.message)
      throw new ImportError('Reading the event failed. Try again, or fill the form in by hand.')
    }
    throw err
  }

  const e = response.parsed_output
  if (response.stop_reason === 'refusal' || !e) {
    throw new ImportError("Couldn't read an event from that. Fill the form in by hand instead.")
  }
  if (!e.found || !e.title) {
    throw new ImportError("That doesn't look like an event announcement. Try a screenshot of the event itself.")
  }

  return {
    title: e.title,
    description: e.description,
    eventType: e.eventType,
    startsAt: isoToWallClock(e.startsAt) ?? '',
    endsAt: isoToWallClock(e.endsAt) ?? '',
    location: e.location,
    imageUrl: '',
    ticketUrl: /^https:\/\//.test(e.ticketUrl) ? e.ticketUrl : '',
    priceText: e.priceText,
    source: 'AI',
    sourceUrl: '',
  }
}
