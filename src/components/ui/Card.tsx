import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-stone-200 bg-white shadow-sm', padding && 'p-6', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-base font-semibold text-stone-900', className)}>{children}</h3>
}

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  color = 'amber',
}: {
  label: string
  value: string | number
  sub?: string
  icon?: React.ElementType
  color?: 'amber' | 'green' | 'blue' | 'purple' | 'red'
}) {
  const colorMap = {
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-stone-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-stone-400">{sub}</p>}
        </div>
        {Icon && (
          <div className={cn('rounded-lg p-2', colorMap[color])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  )
}
