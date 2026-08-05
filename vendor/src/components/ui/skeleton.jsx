import { cn } from '@/lib/utils'

export function Skeleton({ className }) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-border/70', className)} />
  )
}

export function TableSkeleton({ rows = 8, cols = 6 }) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex gap-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`r-${r}`} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={`c-${r}-${c}`} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Skeleton className="h-10 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      <Skeleton className="h-14 w-full" />
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <TableSkeleton />
      </div>
    </div>
  )
}
