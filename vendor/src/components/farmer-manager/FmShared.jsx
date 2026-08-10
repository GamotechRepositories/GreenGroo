import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

const statusVariant = {
  Active: 'success',
  Inactive: 'secondary',
  Pending: 'warning',
  Approved: 'success',
  Rejected: 'error',
  Completed: 'success',
  Delivered: 'success',
  Processing: 'accent',
  Confirmed: 'accent',
  New: 'warning',
  Cancelled: 'error',
  Paid: 'success',
  Available: 'accent',
  'In Stock': 'success',
  'Low Stock': 'warning',
  'Out of Stock': 'error',
  'Ready for Pickup': 'accent',
  'Picked Up': 'accent',
}

export function FmTable({ columns, rows, emptyTitle = 'No records', emptyDescription, onRowClick }) {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="overflow-x-auto hide-scrollbar">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-cream/70">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary',
                  col.align === 'right' && 'text-right',
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b border-border/70 transition last:border-0 hover:bg-cream/40',
                onRowClick && 'cursor-pointer',
              )}
            >
              {columns.map((col) => {
                const value = row[col.key]
                return (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3.5 font-medium text-text-primary',
                      col.align === 'right' && 'text-right',
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : col.type === 'badge'
                        ? (
                            <Badge variant={statusVariant[value] || 'secondary'}>{value}</Badge>
                          )
                        : col.format === 'currency'
                          ? (
                              <span className="font-bold">{formatCurrency(value)}</span>
                            )
                          : (
                              value ?? '—'
                            )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AvatarBubble({ name, src, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'h-16 w-16 text-lg' : size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs'
  if (src) {
    return <img src={src} alt={name} className={cn(sizeClass, 'rounded-full object-cover')} />
  }
  const initials = (name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
  return (
    <span
      className={cn(
        sizeClass,
        'inline-flex items-center justify-center rounded-full bg-primary/15 font-bold text-primary',
      )}
    >
      {initials}
    </span>
  )
}

export function StatGrid({ items }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{item.label}</p>
          <p className="mt-1 text-xl font-bold text-text-primary">{item.value}</p>
        </div>
      ))}
    </div>
  )
}

export function PageToolbar({ children }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN')
}
