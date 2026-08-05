import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

const statusVariant = {
  Active: 'success',
  Completed: 'success',
  Delivered: 'success',
  Pending: 'warning',
  Processing: 'accent',
  Cancelled: 'error',
  'Low Stock': 'warning',
  Rejected: 'error',
}

export function DataTable({
  columns,
  rows,
  sortKey,
  sortDir,
  onSort,
  selectedIds,
  onToggleRow,
  onToggleAll,
  emptyTitle,
  emptyDescription,
}) {
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id))

  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="overflow-x-auto hide-scrollbar">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-cream/70">
            <th className="w-12 px-4 py-3.5">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                className="h-4 w-4 rounded border-border accent-primary"
                aria-label="Select all"
              />
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary"
              >
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => onSort(col.key)}
                    className="inline-flex items-center gap-1 transition hover:text-primary"
                  >
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                'border-b border-border/70 transition hover:bg-cream/40 last:border-0',
                selectedIds.has(row.id) && 'bg-primary/[0.04]',
              )}
            >
              <td className="px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={selectedIds.has(row.id)}
                  onChange={() => onToggleRow(row.id)}
                  className="h-4 w-4 rounded border-border accent-primary"
                  aria-label={`Select ${row.id}`}
                />
              </td>
              {columns.map((col) => {
                const value = row[col.key]
                return (
                  <td key={col.key} className="px-4 py-3.5 font-medium text-text-primary">
                    {col.type === 'badge' ? (
                      <Badge variant={statusVariant[value] || 'secondary'}>{value}</Badge>
                    ) : col.format === 'currency' ? (
                      <span className="font-bold">{formatCurrency(value)}</span>
                    ) : col.key === 'id' ? (
                      <span className="font-bold text-primary">{value}</span>
                    ) : (
                      value
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
