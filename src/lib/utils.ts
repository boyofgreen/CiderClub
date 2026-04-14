import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'green',
    PAUSED: 'yellow',
    CANCELLED: 'red',
    WAITLIST: 'blue',
    PENDING_CUSTOMIZATION: 'yellow',
    CUSTOMIZED: 'blue',
    LOCKED: 'purple',
    AWAITING_PICKUP: 'orange',
    PICKED_UP: 'green',
    BILLED: 'green',
    PAYMENT_FAILED: 'red',
    UPCOMING: 'blue',
    OPEN: 'green',
    BILLING: 'orange',
    COMPLETED: 'gray',
    ARCHIVED: 'gray',
    DRAFT: 'gray',
    SENT: 'green',
    FAILED: 'red',
  }
  return map[status] ?? 'gray'
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length
  const totalPages = Math.ceil(total / pageSize)
  const data = items.slice((page - 1) * pageSize, page * pageSize)
  return { data, total, totalPages, page, pageSize }
}
