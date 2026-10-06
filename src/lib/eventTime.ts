// Event times are stored as the wall-clock time at the venue, encoded as UTC:
// a 7:00 PM event is saved as 19:00Z. That matches how the admin forms have
// always saved events (datetime-local strings parsed on a UTC server), so
// imported events line up with hand-entered ones. Two consequences:
//   - always format with timeZone 'UTC' (never the viewer's zone), and
//   - convert to a real offset only when publishing data for other systems
//     (schema.org JSON-LD for Google), via toVenueIso().

export const VENUE_TIME_ZONE = 'America/Chicago'

const WALL_CLOCK = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/

/** "2026-11-14T19:00" (or any ISO string — offset ignored) → stored Date. */
export function wallClockToDate(value: string): Date | null {
  const m = WALL_CLOCK.exec(value.trim())
  if (!m) return null
  const d = new Date(`${m[1]}T${m[2]}:00.000Z`)
  return isNaN(d.getTime()) ? null : d
}

/**
 * The venue's local clock time from an ISO timestamp, ignoring its offset.
 * TicketsCandy publishes "2026-11-14T19:00:00+00:00" for a 7 PM Central event
 * (local time mislabeled as UTC); sites that label correctly, e.g.
 * "2026-11-14T19:00:00-06:00", give the same "2026-11-14T19:00".
 */
export function isoToWallClock(iso: string | undefined | null): string | null {
  if (!iso) return null
  const m = WALL_CLOCK.exec(iso.trim())
  return m ? `${m[1]}T${m[2]}` : null
}

/** Stored Date → "2026-11-14T19:00", the value a datetime-local input expects. */
export function dateToWallClock(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 16)
}

/** "Sat, Nov 14, 2026, 7:00 PM" */
export function formatEventDateTime(d: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(d))
}

/** "7:00 PM" */
export function formatEventTime(d: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(d))
}

/** Parts for a calendar-style date badge: { month: "NOV", day: "14", weekday: "Sat" } */
export function eventDateParts(d: Date | string) {
  const date = new Date(d)
  const part = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...opts }).format(date)
  return {
    month: part({ month: 'short' }).toUpperCase(),
    day: part({ day: 'numeric' }),
    weekday: part({ weekday: 'long' }),
  }
}

/** Minutes the venue zone is ahead of UTC at a given instant (Central: -360 or -300). */
function venueOffsetMinutes(utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: VENUE_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(utcMs))
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'))
  return Math.round((asUtc - utcMs) / 60000)
}

/**
 * Stored wall-clock Date → ISO 8601 with the venue's real offset for that date,
 * e.g. "2026-11-14T19:00:00-06:00" (CST) or "2026-07-04T19:00:00-05:00" (CDT).
 */
export function toVenueIso(d: Date | string): string {
  const wall = new Date(d).getTime()
  let offset = venueOffsetMinutes(wall)
  // Re-check at the corrected instant in case the guess straddled a DST change.
  const corrected = venueOffsetMinutes(wall - offset * 60000)
  if (corrected !== offset) offset = corrected
  const sign = offset <= 0 ? '-' : '+'
  const abs = Math.abs(offset)
  const hh = String(Math.floor(abs / 60)).padStart(2, '0')
  const mm = String(abs % 60).padStart(2, '0')
  return `${new Date(wall).toISOString().slice(0, 19)}${sign}${hh}:${mm}`
}

/** The current venue-local time on the stored scale (Texas wall clock encoded as UTC). */
export function venueNow(): Date {
  const now = Date.now()
  return new Date(now + venueOffsetMinutes(now) * 60000)
}
