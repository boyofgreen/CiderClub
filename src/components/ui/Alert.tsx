import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

type AlertType = 'success' | 'error' | 'warning' | 'info'

const typeConfig = {
  success: {
    icon: CheckCircle,
    classes: 'bg-green-50 border-green-200 text-green-800',
    iconClasses: 'text-green-500',
  },
  error: {
    icon: XCircle,
    classes: 'bg-red-50 border-red-200 text-red-800',
    iconClasses: 'text-red-500',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconClasses: 'text-yellow-500',
  },
  info: {
    icon: Info,
    classes: 'bg-blue-50 border-blue-200 text-blue-800',
    iconClasses: 'text-blue-500',
  },
}

export function Alert({
  type = 'info',
  title,
  message,
  className,
}: {
  type?: AlertType
  title?: string
  message: string
  className?: string
}) {
  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div className={cn('flex gap-3 rounded-lg border p-4', config.classes, className)}>
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.iconClasses)} />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <p className="text-sm">{message}</p>
      </div>
    </div>
  )
}
