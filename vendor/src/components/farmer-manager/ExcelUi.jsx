import {
  EXCEL_CELL,
  EXCEL_HEAD,
  EXCEL_PANEL,
  EXCEL_TABLE,
  EXCEL_WRAP,
} from '@/components/farmer-manager/excelStyles'

export function ExcelStatCard({ title, value, hint }) {
  return (
    <div className={`${EXCEL_PANEL} p-3`}>
      <p className="text-xs font-medium text-[#6B7280]">{title}</p>
      <p className="mt-1 text-lg font-bold text-[#1F2937]">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-[#6B7280]">{hint}</p> : null}
    </div>
  )
}

export function ExcelStatusBadge({ status }) {
  const map = {
    Active: 'text-emerald-700',
    Approved: 'text-emerald-700',
    Completed: 'text-emerald-700',
    Delivered: 'text-emerald-700',
    Paid: 'text-emerald-700',
    'In Stock': 'text-emerald-700',
    Pending: 'text-amber-700',
    Processing: 'text-amber-700',
    New: 'text-amber-700',
    Available: 'text-amber-700',
    'Low Stock': 'text-amber-700',
    Inactive: 'text-[#6B7280]',
    Rejected: 'text-red-600',
    Cancelled: 'text-red-600',
    'Out of Stock': 'text-red-600',
  }
  return (
    <span className={`border border-[#D4D4D4] bg-[#F2F2F2] px-1.5 py-0.5 text-[10px] font-semibold ${map[status] || 'text-[#1F2937]'}`}>
      {status || '—'}
    </span>
  )
}

export function ExcelDataTable({
  columns,
  rows,
  emptyMessage = 'No records found.',
  onRowClick,
  compact = false,
}) {
  if (!rows?.length) {
    return <div className={`${EXCEL_WRAP} px-3 py-8 text-center text-xs text-[#6B7280]`}>{emptyMessage}</div>
  }

  const cellClass = compact
    ? 'border border-[#D4D4D4] px-1.5 py-1 text-[10px] text-[#1F2937]'
    : EXCEL_CELL
  const headClass = compact
    ? 'border border-[#D4D4D4] bg-[#F2F2F2] px-1.5 py-1 text-[10px] font-semibold text-[#1F2937]'
    : EXCEL_HEAD

  return (
    <div className={EXCEL_WRAP}>
      <table className={EXCEL_TABLE}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`${headClass} ${col.align === 'right' ? 'text-right' : 'text-left'} whitespace-nowrap`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={(e) => {
                if (!onRowClick) return
                if (e.target.closest('a, button, select, input, textarea, label')) return
                onRowClick(row)
              }}
              className={`hover:bg-[#F9F9F9] ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`${cellClass} ${col.align === 'right' ? 'text-right' : 'text-left'} ${
                    col.wrap ? 'whitespace-normal' : 'whitespace-nowrap'
                  }`}
                >
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ExcelInfoGrid({ rows }) {
  return (
    <dl className="grid gap-0 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="border border-[#D4D4D4] px-3 py-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">{row.label}</dt>
          <dd className="mt-0.5 text-xs font-semibold text-[#1F2937]">{row.value || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}
