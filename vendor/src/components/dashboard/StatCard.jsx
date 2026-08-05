import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'

export function StatCard({
  title,
  value,
  change,
  trend = 'up',
  icon: Icon,
  format = 'number',
}) {
  const display =
    format === 'currency'
      ? formatCurrency(value)
      : format === 'compact'
        ? formatNumber(value)
        : typeof value === 'number'
          ? formatNumber(value)
          : value

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-secondary">{title}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-text-primary">
            {display}
          </p>
          {change != null && (
            <div
              className={cn(
                'mt-2 inline-flex items-center gap-1 text-xs font-medium',
                trend === 'up' ? 'text-text-secondary' : 'text-text-secondary',
              )}
            >
              {trend === 'up' ? (
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-error" />
              )}
              <span className={trend === 'up' ? 'text-primary' : 'text-error'}>{change}</span>
              <span className="text-text-secondary">vs yesterday</span>
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-cream">
          <Icon className="h-5 w-5 text-text-secondary" strokeWidth={1.75} />
        </div>
      </div>
    </Card>
  )
}
