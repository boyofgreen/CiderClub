import { cn } from '@/lib/utils'

type Color = 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'orange' | 'gray' | 'amber'

interface BadgeProps {
  children: React.ReactNode
  color?: Color
  className?: string
}

const colorMap: Record<Color, string> = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
  gray: 'bg-stone-100 text-stone-600',
  amber: 'bg-amber-100 text-amber-800',
}

export function Badge({ children, color = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        colorMap[color],
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: Color }> = {
    ACTIVE: { label: 'Active', color: 'green' },
    PAUSED: { label: 'Paused', color: 'yellow' },
    CANCELLED: { label: 'Cancelled', color: 'red' },
    WAITLIST: { label: 'Waitlist', color: 'blue' },
    PENDING_CUSTOMIZATION: { label: 'Pending', color: 'yellow' },
    CUSTOMIZED: { label: 'Customized', color: 'blue' },
    LOCKED: { label: 'Locked', color: 'purple' },
    AWAITING_PICKUP: { label: 'Ready', color: 'orange' },
    PICKED_UP: { label: 'Picked Up', color: 'green' },
    BILLED: { label: 'Paid', color: 'green' },
    PAYMENT_FAILED: { label: 'Payment Failed', color: 'red' },
    UPCOMING: { label: 'Upcoming', color: 'blue' },
    OPEN: { label: 'Open', color: 'green' },
    LOCKED_Q: { label: 'Locked', color: 'purple' },
    BILLING: { label: 'Billing', color: 'orange' },
    COMPLETED: { label: 'Completed', color: 'gray' },
    ARCHIVED: { label: 'Archived', color: 'gray' },
    DRAFT: { label: 'Draft', color: 'gray' },
    SENT: { label: 'Sent', color: 'green' },
    DELIVERED: { label: 'Delivered', color: 'green' },
    DELAYED: { label: 'Delayed', color: 'yellow' },
    BOUNCED: { label: 'Bounced', color: 'red' },
    COMPLAINED: { label: 'Spam', color: 'red' },
    FAILED: { label: 'Failed', color: 'red' },
    CANCELLED_STATUS: { label: 'Cancelled', color: 'red' },
  }
  const config = map[status] ?? { label: status, color: 'gray' as Color }
  return <Badge color={config.color}>{config.label}</Badge>
}
