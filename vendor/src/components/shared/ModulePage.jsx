import { useEffect, useMemo, useState } from 'react'
import {
  Download,
  FileDown,
  Filter,
  RefreshCw,
  Search,
  Trash2,
  CheckCircle2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/dialog'
import { PageSkeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { DataTable } from '@/components/shared/DataTable'
import { useVendor } from '@/context/VendorContext'
import {
  DEFAULT_COLUMNS,
  downloadBlob,
  generateRows,
  rowsToCsv,
} from '@/lib/mockTable'

const PAGE_SIZE_OPTIONS = [8, 12, 24]

export function ModulePage({
  title,
  parent,
  permission,
  description,
  columns = DEFAULT_COLUMNS,
}) {
  const { can, toast } = useVendor()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [rows, setRows] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)

  const allowed = can(permission)

  const load = () => {
    setLoading(true)
    setError(false)
    setSelectedIds(new Set())
    window.setTimeout(() => {
      // Simulate occasional error for demo of error state when title includes "force-error"
      if (title?.toLowerCase().includes('__error__')) {
        setError(true)
        setLoading(false)
        return
      }
      setRows(generateRows(title || 'module', 48))
      setLoading(false)
    }, 550)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title])

  const filtered = useMemo(() => {
    let data = [...rows]
    const q = query.trim().toLowerCase()
    if (q) {
      data = data.filter((r) =>
        [r.id, r.name, r.product, r.sku, r.category, r.status]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    }
    if (statusFilter !== 'all') {
      data = data.filter((r) => r.status === statusFilter)
    }
    data.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
    return data
  }, [rows, query, statusFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setPage(1)
  }, [query, statusFilter, pageSize])

  const onSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (pageRows.every((r) => selectedIds.has(r.id))) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        pageRows.forEach((r) => next.delete(r.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        pageRows.forEach((r) => next.add(r.id))
        return next
      })
    }
  }

  const exportCsv = () => {
    if (!can(permission?.replace('.view', '.export') || permission) && !can('*')) {
      // still allow export for owners; staff with view can export for demo
    }
    const csv = rowsToCsv(filtered, columns)
    downloadBlob(csv, `${title.replace(/\s+/g, '-').toLowerCase()}.csv`, 'text/csv;charset=utf-8')
    toast('CSV exported successfully')
  }

  const exportPdf = () => {
    const html = `<!doctype html><html><head><title>${title}</title>
      <style>body{font-family:Inter,Arial,sans-serif;padding:24px}table{border-collapse:collapse;width:100%}
      th,td{border:1px solid #E8E8E8;padding:8px;font-size:12px;text-align:left}th{background:#F7F2E8}</style>
      </head><body><h1>${title}</h1><p>Generated ${new Date().toLocaleString()}</p>
      <table><thead><tr>${columns.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead>
      <tbody>${filtered
        .slice(0, 100)
        .map(
          (r) =>
            `<tr>${columns.map((c) => `<td>${r[c.key] ?? ''}</td>`).join('')}</tr>`,
        )
        .join('')}</tbody></table></body></html>`
    downloadBlob(html, `${title.replace(/\s+/g, '-').toLowerCase()}.html`, 'text/html')
    toast('PDF report downloaded (HTML print-ready)')
  }

  const askBulk = (action) => {
    if (!selectedIds.size) {
      toast('Select at least one row', 'info')
      return
    }
    setConfirmAction(action)
    setConfirmOpen(true)
  }

  const runBulk = () => {
    const ids = [...selectedIds]
    if (confirmAction === 'delete') {
      setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)))
      toast(`Deleted ${ids.length} record(s)`, 'success')
    } else if (confirmAction === 'activate') {
      setRows((prev) =>
        prev.map((r) => (selectedIds.has(r.id) ? { ...r, status: 'Active' } : r)),
      )
      toast(`Activated ${ids.length} record(s)`, 'success')
    }
    setSelectedIds(new Set())
    setConfirmOpen(false)
    setConfirmAction(null)
  }

  if (!allowed) {
    return (
      <Card className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
        <h2 className="text-lg font-bold text-text-primary">Access restricted</h2>
        <p className="mt-2 max-w-md text-sm font-medium text-text-secondary">
          Your role does not include permission <code className="text-primary">{permission}</code> for{' '}
          {title}.
        </p>
      </Card>
    )
  }

  if (loading) return <PageSkeleton />

  if (error) {
    return (
      <Card className="overflow-hidden p-0">
        <ErrorState onRetry={load} />
      </Card>
    )
  }

  const statuses = ['all', ...new Set(rows.map((r) => r.status))]

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {parent && (
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              {parent}
            </p>
          )}
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <p className="mt-0.5 text-sm font-medium text-text-secondary">
            {description || `Manage ${title.toLowerCase()} with search, filters, and bulk actions.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="bg-card" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" className="bg-card" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="secondary" onClick={exportPdf}>
            <FileDown className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search records…"
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Filter className="h-4 w-4" />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s === 'all' ? 'All statuses' : s}
                  </option>
                ))}
              </Select>
            </div>
            <Select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              aria-label="Rows per page"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </Select>
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary/[0.04] px-4 py-3 sm:px-5">
            <span className="text-sm font-semibold text-primary">
              {selectedIds.size} selected
            </span>
            <Button size="sm" variant="secondary" onClick={() => askBulk('activate')}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Activate
            </Button>
            <Button size="sm" variant="danger" onClick={() => askBulk('delete')}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        )}

        <DataTable
          columns={columns}
          rows={pageRows}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={onSort}
          selectedIds={selectedIds}
          onToggleRow={toggleRow}
          onToggleAll={toggleAll}
          emptyTitle="No matching records"
          emptyDescription="Clear filters or try a different search."
        />

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs font-medium text-text-secondary">
            Showing {(page - 1) * pageSize + (filtered.length ? 1 : 0)}–
            {Math.min(page * pageSize, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="min-w-[80px] text-center text-xs font-bold text-text-primary">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmAction === 'delete' ? 'Delete selected records?' : 'Activate selected records?'}
        description={
          confirmAction === 'delete'
            ? `This will permanently remove ${selectedIds.size} record(s). This action cannot be undone.`
            : `Mark ${selectedIds.size} record(s) as Active?`
        }
        confirmLabel={confirmAction === 'delete' ? 'Delete' : 'Activate'}
        variant={confirmAction === 'delete' ? 'danger' : 'default'}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={runBulk}
      />
    </div>
  )
}
