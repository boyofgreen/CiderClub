import { prisma } from '@/lib/prisma'
import { parseCsv } from '@/lib/csv'

/**
 * CSV member import — the migration path for clubs coming from spreadsheets
 * or other platforms (Commerce7/WineDirect exports).
 *
 * Deliberately bypasses createMember(): importing an existing roster must NOT
 * send welcome emails, apply capacity waitlisting, or touch Square. Operators
 * can Square-sync members individually (or bulk) after reviewing the import.
 */

// Recognized header names (lowercased, trimmed) → canonical field
const HEADER_ALIASES: Record<string, string> = {
  'email': 'email', 'e-mail': 'email', 'email address': 'email',
  'first name': 'firstName', 'firstname': 'firstName', 'first': 'firstName', 'given name': 'firstName',
  'last name': 'lastName', 'lastname': 'lastName', 'last': 'lastName', 'surname': 'lastName', 'family name': 'lastName',
  'name': 'fullName', 'full name': 'fullName', 'member name': 'fullName',
  'phone': 'phone', 'phone number': 'phone', 'mobile': 'phone', 'telephone': 'phone',
  'address': 'address1', 'address1': 'address1', 'address 1': 'address1', 'street': 'address1', 'street address': 'address1',
  'address2': 'address2', 'address 2': 'address2', 'apt': 'address2', 'unit': 'address2',
  'city': 'city', 'town': 'city',
  'state': 'state', 'province': 'state', 'region': 'state',
  'zip': 'zip', 'zipcode': 'zip', 'zip code': 'zip', 'postal code': 'zip', 'postcode': 'zip',
  'plan': 'plan', 'plan name': 'plan', 'tier': 'plan', 'membership': 'plan', 'membership level': 'plan', 'club level': 'plan',
  'status': 'status',
  'joined': 'joinedAt', 'joined at': 'joinedAt', 'join date': 'joinedAt', 'member since': 'joinedAt', 'signup date': 'joinedAt',
  'notes': 'notes', 'note': 'notes',
}

const VALID_STATUSES = new Set(['ACTIVE', 'PAUSED', 'CANCELLED', 'WAITLIST'])
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface ImportRowError {
  line: number // 1-based line in the CSV (header = line 1)
  email: string | null
  message: string
}

export interface ImportResult {
  dryRun: boolean
  total: number // data rows in the file
  created: number
  skipped: number // already members (by email) or duplicated within the file
  errors: ImportRowError[]
}

interface ParsedRow {
  line: number
  email: string
  firstName: string
  lastName: string
  phone?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  zip?: string
  planId: string
  status: string
  joinedAt?: Date
  notes?: string
}

export async function importMembersFromCsv(params: {
  csv: string
  defaultPlanId?: string
  dryRun?: boolean
}): Promise<ImportResult> {
  const dryRun = params.dryRun ?? false
  const rows = parseCsv(params.csv)
  if (rows.length < 2) {
    return { dryRun, total: 0, created: 0, skipped: 0, errors: [{ line: 1, email: null, message: 'The file needs a header row and at least one member row.' }] }
  }

  // Map headers → canonical fields
  const header = rows[0].map((h) => HEADER_ALIASES[h.trim().toLowerCase()] ?? null)
  if (!header.includes('email')) {
    return { dryRun, total: rows.length - 1, created: 0, skipped: 0, errors: [{ line: 1, email: null, message: 'No "email" column found in the header row.' }] }
  }

  // Plans for this org, matchable by name or slug (case-insensitive)
  const plans = await prisma.plan.findMany({ select: { id: true, name: true, slug: true } })
  const planLookup = new Map<string, string>()
  for (const p of plans) {
    planLookup.set(p.name.toLowerCase(), p.id)
    planLookup.set(p.slug.toLowerCase(), p.id)
  }
  const defaultPlanId =
    params.defaultPlanId && plans.some((p) => p.id === params.defaultPlanId)
      ? params.defaultPlanId
      : undefined

  // Existing members in this org (single query)
  const existing = await prisma.member.findMany({ select: { email: true } })
  const existingEmails = new Set(existing.map((m) => m.email))

  const errors: ImportRowError[] = []
  const seenInFile = new Set<string>()
  const toCreate: ParsedRow[] = []
  let skipped = 0

  for (let r = 1; r < rows.length; r++) {
    const line = r + 1
    const record: Record<string, string> = {}
    rows[r].forEach((value, c) => {
      const field = header[c]
      if (field && value.trim() !== '') record[field] = value.trim()
    })

    const email = record.email?.toLowerCase()
    if (!email || !EMAIL_PATTERN.test(email)) {
      errors.push({ line, email: record.email ?? null, message: 'Missing or invalid email.' })
      continue
    }
    if (seenInFile.has(email)) {
      skipped++
      continue
    }
    seenInFile.add(email)
    if (existingEmails.has(email)) {
      skipped++
      continue
    }

    // Names: explicit first/last beats splitting a full name
    let firstName = record.firstName
    let lastName = record.lastName
    if ((!firstName || !lastName) && record.fullName) {
      const [first, ...rest] = record.fullName.split(/\s+/)
      firstName = firstName ?? first
      lastName = lastName ?? (rest.join(' ') || '—')
    }
    if (!firstName) {
      errors.push({ line, email, message: 'Missing first name (add a "first name" or "name" column).' })
      continue
    }
    lastName = lastName || '—'

    // Plan: per-row name/slug, else the chosen default
    let planId: string | undefined
    if (record.plan) {
      planId = planLookup.get(record.plan.toLowerCase())
      if (!planId) {
        errors.push({ line, email, message: `Unknown plan "${record.plan}" — create it first or map it to an existing plan.` })
        continue
      }
    } else {
      planId = defaultPlanId
      if (!planId) {
        errors.push({ line, email, message: 'No plan column value and no default plan selected.' })
        continue
      }
    }

    // Status
    let status = 'ACTIVE'
    if (record.status) {
      status = record.status.toUpperCase()
      if (!VALID_STATUSES.has(status)) {
        errors.push({ line, email, message: `Unknown status "${record.status}" (use Active, Paused, Cancelled, or Waitlist).` })
        continue
      }
    }

    // Joined date
    let joinedAt: Date | undefined
    if (record.joinedAt) {
      const d = new Date(record.joinedAt)
      if (Number.isNaN(d.getTime())) {
        errors.push({ line, email, message: `Could not read join date "${record.joinedAt}".` })
        continue
      }
      joinedAt = d
    }

    toCreate.push({
      line, email, firstName, lastName, planId, status, joinedAt,
      phone: record.phone, address1: record.address1, address2: record.address2,
      city: record.city, state: record.state, zip: record.zip, notes: record.notes,
    })
  }

  if (!dryRun) {
    for (const row of toCreate) {
      await prisma.member.create({
        data: {
          email: row.email,
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
          address1: row.address1,
          address2: row.address2,
          city: row.city,
          state: row.state,
          zip: row.zip,
          planId: row.planId,
          status: row.status,
          ...(row.joinedAt ? { joinedAt: row.joinedAt } : {}),
          ...(row.notes ? { notes: `[Imported] ${row.notes}` } : {}),
        },
      })
    }
  }

  return {
    dryRun,
    total: rows.length - 1,
    created: toCreate.length,
    skipped,
    errors,
  }
}
