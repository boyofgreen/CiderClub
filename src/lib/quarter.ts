/** Quarter label format: "2025-Q2" */

export function getCurrentQuarterLabel(): string {
  const now = new Date()
  const q = Math.ceil((now.getMonth() + 1) / 3)
  return `${now.getFullYear()}-Q${q}`
}

export function labelToYearQuarter(label: string): { year: number; quarter: number } {
  const [year, q] = label.split('-Q')
  return { year: parseInt(year), quarter: parseInt(q) }
}

export function yearQuarterToLabel(year: number, quarter: number): string {
  return `${year}-Q${quarter}`
}

export function nextQuarterLabel(label: string): string {
  const { year, quarter } = labelToYearQuarter(label)
  if (quarter === 4) return yearQuarterToLabel(year + 1, 1)
  return yearQuarterToLabel(year, quarter + 1)
}

export function prevQuarterLabel(label: string): string {
  const { year, quarter } = labelToYearQuarter(label)
  if (quarter === 1) return yearQuarterToLabel(year - 1, 4)
  return yearQuarterToLabel(year, quarter - 1)
}

/** Returns start and end dates for a given quarter */
export function getQuarterDates(year: number, quarter: number): { startsAt: Date; endsAt: Date } {
  const startMonth = (quarter - 1) * 3 // 0, 3, 6, 9
  const startsAt = new Date(year, startMonth, 1)
  const endsAt = new Date(year, startMonth + 3, 0, 23, 59, 59) // last day of quarter
  return { startsAt, endsAt }
}

export function quarterDisplayName(label: string): string {
  const { year, quarter } = labelToYearQuarter(label)
  const names = ['', 'Spring', 'Summer', 'Fall', 'Winter']
  return `${names[quarter]} ${year}`
}

/** Returns all quarter labels from start to now (inclusive) */
export function getRecentQuarters(count: number): string[] {
  const labels: string[] = []
  let label = getCurrentQuarterLabel()
  for (let i = 0; i < count; i++) {
    labels.unshift(label)
    label = prevQuarterLabel(label)
  }
  return labels
}
