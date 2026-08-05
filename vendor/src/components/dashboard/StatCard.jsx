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
  accent = 'green',
}) {
  const display =
    format === 'currency'
      ? formatCurrency(value)
      : format === 'compact'
        ? formatNumber(value)
        : formatNumber(value)

  const accentMap = {
    green: 'bg-primary/10 text-primary',
    lime: 'bg-secondary/15 text-secondary',
    gold: 'bg-accent/25 text-amber-700',
    warn: 'bg-warning/15 text-amber-700',
    error: 'bg-error/10 text-error',
    slate: 'bg-muted text-text-secondary',
  }

  return (
    <Card className="group relative overflow-hidden p-4 sm:p-5">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/[0.04] transition-transform duration-300 group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            {title}
          </p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-text-primary">
            {display}
          </p>
          {change != null && (
            <div
              className={cn(
                'mt-2 inline-flex items-center gap-1 text-xs font-semibold',
                trend === 'up' ? 'text-success' : 'text-error',
              )}
            >
              {trend === 'up' ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {change}
              <span className="font-medium text-text-secondary">vs yesterday</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105',
            accentMap[accent],
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
    </Card>
  )
}
