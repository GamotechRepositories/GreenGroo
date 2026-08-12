import { useMemo, useState } from 'react'
import { EXCEL_BTN_PRIMARY, EXCEL_CELL, EXCEL_HEAD, EXCEL_TABLE, EXCEL_WRAP } from './excelStyles'

function formatDate(isoDate) {
  if (!isoDate) return '—'
  const [y, m, d] = String(isoDate).split('-')
  if (!d) return isoDate
  return `${d}/${m}/${y}`
}

function getDayOfWeek(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-US', { weekday: 'long' })
  } catch {
    return ''
  }
}

function formatRupee(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function SearchIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
        clipRule="evenodd"
      />
    </svg>
  )
}

const CELL_INPUT =
  'w-full h-full bg-transparent px-2 py-1.5 text-xs border-0 outline-none focus:bg-[#E8F5E9] focus:ring-2 focus:ring-[#217346] font-mono text-[#1F2937] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'

function DailyChartSection({ rows, setRows, unit, onSave }) {
  const [query, setQuery] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [pageSize, setPageSize] = useState(24)

  const handleCellChange = (index, field, value) => {
    setRows((prev) => {
      const copy = [...prev]
      const row = { ...copy[index], [field]: value }

      if (field === 'date') {
        row.weekday = getDayOfWeek(value) || row.weekday
      }

      const gAQty = Number(row.gradeAQty) || 0
      const gARate = Number(row.gradeARate) || 0
      const gBQty = Number(row.gradeBQty) || 0
      const gBRate = Number(row.gradeBRate) || 0

      row.aTotal = gAQty * gARate
      row.bTotal = gBQty * gBRate
      row.abTotal = row.aTotal + row.bTotal

      copy[index] = row
      return copy
    })
  }

  const handleAddRow = () => {
    const newRow = {
      srNo: rows.length + 1,
      date: new Date().toISOString().split('T')[0],
      weekday: getDayOfWeek(new Date().toISOString().split('T')[0]),
      gradeAQty: '',
      gradeARate: '',
      aTotal: 0,
      gradeBQty: '',
      gradeBRate: '',
      bTotal: 0,
      abTotal: 0,
      unit: unit || 'Kg',
    }
    setRows([newRow, ...rows])
  }

  const handleDeleteRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const filteredRows = useMemo(() => {
    let list = [...rows]
    const needle = query.trim().toLowerCase()
    if (needle) {
      list = list.filter(
        (row) =>
          formatDate(row.date).toLowerCase().includes(needle) ||
          row.weekday?.toLowerCase().includes(needle) ||
          String(row.srNo).includes(needle),
      )
    }
    if (dayFilter) {
      list = list.filter((row) => row.weekday === dayFilter)
    }
    return list
  }, [rows, query, dayFilter])

  const visibleRows = filteredRows.slice(0, pageSize)
  const days = [...new Set(rows.map((r) => r.weekday).filter(Boolean))]

  const totals = useMemo(() => {
    const gradeAQty = filteredRows.reduce((s, r) => s + Number(r.gradeAQty || 0), 0)
    const gradeBQty = filteredRows.reduce((s, r) => s + Number(r.gradeBQty || 0), 0)
    const aTotal = filteredRows.reduce((s, r) => s + Number(r.gradeAQty || 0) * Number(r.gradeARate || 0), 0)
    const bTotal = filteredRows.reduce((s, r) => s + Number(r.gradeBQty || 0) * Number(r.gradeBRate || 0), 0)
    const abTotal = aTotal + bTotal
    const avgARate = gradeAQty > 0 ? Math.round(aTotal / gradeAQty) : 0
    const avgBRate = gradeBQty > 0 ? Math.round(bTotal / gradeBQty) : 0
    return { gradeAQty, gradeBQty, aTotal, bTotal, abTotal, avgARate, avgBRate }
  }, [filteredRows])

  return (
    <div className="border border-[#D4D4D4] bg-white">
      <div className="flex flex-wrap items-center justify-between border-b border-[#D4D4D4] bg-[#217346] px-3 py-2 text-white">
        <p className="flex items-center gap-1.5 text-xs font-bold">
          <span>📊</span> Daily Chart — Grade A / B (Excel Editable Spreadsheet)
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddRow}
            className="rounded bg-white px-3 py-1 text-xs font-bold text-[#217346] shadow-sm transition-all hover:bg-[#F3F4F6]"
          >
            + Add Excel Row
          </button>
          {onSave ? (
            <button
              type="button"
              onClick={onSave}
              className="rounded border border-white/30 bg-[#15803D] px-3 py-1 text-xs font-bold text-white transition-all hover:bg-[#166534]"
            >
              💾 Save Chart
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-[#D4D4D4] bg-[#F9F9F9] px-3 py-2">
        <div className="relative min-w-[200px] flex-1">
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[#6B7280]">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search date or day..."
            className="w-full border border-[#D4D4D4] bg-white py-1.5 pl-7 pr-2 text-xs text-[#1F2937] outline-none focus:border-[#217346]"
          />
        </div>
        <select
          value={dayFilter}
          onChange={(e) => setDayFilter(e.target.value)}
          className="border border-[#D4D4D4] bg-white px-2 py-1.5 text-xs text-[#1F2937]"
        >
          <option value="">All days</option>
          {days.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="border border-[#D4D4D4] bg-white px-2 py-1.5 text-xs text-[#1F2937]"
        >
          <option value={10}>10 / page</option>
          <option value={24}>24 / page</option>
          <option value={50}>50 / page</option>
        </select>
      </div>

      <div className={EXCEL_WRAP}>
        <table className="w-full min-w-[950px] border-collapse border border-[#D4D4D4] text-left text-xs">
          <thead>
            <tr className="bg-[#E6F2EB] text-[11px] font-bold text-[#1F2937]">
              <th className="w-10 border border-[#D4D4D4] px-2 py-2 text-center">Sr.</th>
              <th className="w-36 border border-[#D4D4D4] px-2 py-2 text-left">Date</th>
              <th className="w-28 border border-[#D4D4D4] px-2 py-2 text-left">Day</th>
              <th className="w-28 border border-[#D4D4D4] px-2 py-2 text-right">A Qty ({unit})</th>
              <th className="w-24 border border-[#D4D4D4] px-2 py-2 text-right">A Rate (₹)</th>
              <th className="w-28 border border-[#D4D4D4] px-2 py-2 text-right">A Amount</th>
              <th className="w-28 border border-[#D4D4D4] px-2 py-2 text-right">B Qty ({unit})</th>
              <th className="w-24 border border-[#D4D4D4] px-2 py-2 text-right">B Rate (₹)</th>
              <th className="w-28 border border-[#D4D4D4] px-2 py-2 text-right">B Amount</th>
              <th className="w-28 border border-[#D4D4D4] px-2 py-2 text-right text-[#DC2626]">Total</th>
              <th className="w-12 border border-[#D4D4D4] px-2 py-2 text-center">Del</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={11} className="border border-[#D4D4D4] bg-white py-8 text-center text-[#6B7280]">
                  No records yet. Click "+ Add Excel Row" to insert an empty spreadsheet row.
                </td>
              </tr>
            ) : (
              visibleRows.map((row, idx) => {
                const aQty = Number(row.gradeAQty) || 0
                const aRate = Number(row.gradeARate) || 0
                const aTotal = aQty * aRate

                const bQty = Number(row.gradeBQty) || 0
                const bRate = Number(row.gradeBRate) || 0
                const bTotal = bQty * bRate

                const abTotal = aTotal + bTotal

                return (
                  <tr key={row.srNo || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F9FBF9]'}>
                    <td className="border border-[#D4D4D4] bg-[#F2F2F2] px-2 py-1.5 text-center font-bold text-[#6B7280]">
                      {idx + 1}
                    </td>
                    <td className="border border-[#D4D4D4] p-0">
                      <input
                        type="date"
                        value={row.date || ''}
                        onChange={(e) => handleCellChange(idx, 'date', e.target.value)}
                        className={CELL_INPUT}
                      />
                    </td>
                    <td className="border border-[#D4D4D4] p-0">
                      <input
                        type="text"
                        value={row.weekday || ''}
                        onChange={(e) => handleCellChange(idx, 'weekday', e.target.value)}
                        className={CELL_INPUT}
                        placeholder="Day"
                      />
                    </td>
                    <td className="border border-[#D4D4D4] p-0">
                      <input
                        type="number"
                        min="0"
                        value={row.gradeAQty ?? ''}
                        onChange={(e) => handleCellChange(idx, 'gradeAQty', e.target.value)}
                        className={`${CELL_INPUT} text-right font-medium`}
                      />
                    </td>
                    <td className="border border-[#D4D4D4] p-0">
                      <input
                        type="number"
                        min="0"
                        value={row.gradeARate ?? ''}
                        onChange={(e) => handleCellChange(idx, 'gradeARate', e.target.value)}
                        className={`${CELL_INPUT} text-right font-medium`}
                      />
                    </td>
                    <td className="border border-[#D4D4D4] bg-[#F9F9F9] px-2 py-1.5 text-right font-bold tabular-nums text-[#1F2937]">
                      {aTotal === 0 && (row.gradeAQty === '' || row.gradeARate === '') ? '—' : formatRupee(aTotal)}
                    </td>
                    <td className="border border-[#D4D4D4] p-0">
                      <input
                        type="number"
                        min="0"
                        value={row.gradeBQty ?? ''}
                        onChange={(e) => handleCellChange(idx, 'gradeBQty', e.target.value)}
                        className={`${CELL_INPUT} text-right font-medium`}
                      />
                    </td>
                    <td className="border border-[#D4D4D4] p-0">
                      <input
                        type="number"
                        min="0"
                        value={row.gradeBRate ?? ''}
                        onChange={(e) => handleCellChange(idx, 'gradeBRate', e.target.value)}
                        className={`${CELL_INPUT} text-right font-medium`}
                      />
                    </td>
                    <td className="border border-[#D4D4D4] bg-[#F9F9F9] px-2 py-1.5 text-right font-bold tabular-nums text-[#1F2937]">
                      {bTotal === 0 && (row.gradeBQty === '' || row.gradeBRate === '') ? '—' : formatRupee(bTotal)}
                    </td>
                    <td className="border border-[#D4D4D4] bg-[#FEF2F2] px-2 py-1.5 text-right font-extrabold tabular-nums text-[#DC2626]">
                      {abTotal === 0 && row.gradeAQty === '' && row.gradeBQty === '' ? '—' : formatRupee(abTotal)}
                    </td>
                    <td className="border border-[#D4D4D4] bg-white p-0 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(idx)}
                        className="h-full w-full px-2 py-1 text-xs font-bold text-[#DC2626] transition-colors hover:bg-[#FEE2E2]"
                        title="Delete row"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          {visibleRows.length > 0 ? (
            <tfoot>
              <tr className="bg-[#E6F2EB] text-xs font-bold">
                <td className="border border-[#D4D4D4] px-3 py-2 text-left" colSpan={3}>
                  Total Summary
                </td>
                <td className="border border-[#D4D4D4] px-2 py-2 text-right tabular-nums">
                  {totals.gradeAQty} {unit}
                </td>
                <td className="border border-[#D4D4D4] px-2 py-2 text-right tabular-nums">{formatRupee(totals.avgARate)}</td>
                <td className="border border-[#D4D4D4] px-2 py-2 text-right font-bold tabular-nums">{formatRupee(totals.aTotal)}</td>
                <td className="border border-[#D4D4D4] px-2 py-2 text-right tabular-nums">
                  {totals.gradeBQty} {unit}
                </td>
                <td className="border border-[#D4D4D4] px-2 py-2 text-right tabular-nums">{formatRupee(totals.avgBRate)}</td>
                <td className="border border-[#D4D4D4] px-2 py-2 text-right font-bold tabular-nums">{formatRupee(totals.bTotal)}</td>
                <td className="border border-[#D4D4D4] px-2 py-2 text-right font-extrabold tabular-nums text-[#DC2626]">
                  {formatRupee(totals.abTotal)}
                </td>
                <td className="border border-[#D4D4D4]"></td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[#D4D4D4] bg-[#F9F9F9] px-3 py-2 text-xs text-[#6B7280]">
        <span>Showing {visibleRows.length} of {filteredRows.length} Excel spreadsheet records</span>
        <button
          type="button"
          onClick={handleAddRow}
          className={`${EXCEL_BTN_PRIMARY} px-3 py-1 text-xs font-semibold`}
        >
          + Add Excel Row
        </button>
      </div>
    </div>
  )
}

function SalesSummarySection({
  grandAQty,
  grandBQty,
  grandATotal,
  grandBTotal,
  totalRupees,
  avgARate,
  avgBRate,
  unit,
}) {
  const totalQty = Number(grandAQty || 0) + Number(grandBQty || 0)
  const columns = [
    { header: 'A Qty', value: `${grandAQty} ${unit}`, cellClass: 'text-right tabular-nums' },
    { header: 'A Rate', value: formatRupee(avgARate), cellClass: 'text-right tabular-nums' },
    {
      header: 'A Amount',
      value: formatRupee(grandATotal),
      cellClass: 'text-right font-bold tabular-nums',
      headClass: 'text-right',
    },
    { header: 'B Qty', value: `${grandBQty} ${unit}`, cellClass: 'text-right tabular-nums' },
    { header: 'B Rate', value: formatRupee(avgBRate), cellClass: 'text-right tabular-nums' },
    {
      header: 'B Amount',
      value: formatRupee(grandBTotal),
      cellClass: 'text-right font-bold tabular-nums',
      headClass: 'text-right',
    },
    {
      header: 'Total Qty',
      value: `${totalQty} ${unit}`,
      cellClass: 'text-right font-semibold tabular-nums',
      headClass: 'text-right',
    },
    {
      header: 'Total',
      value: formatRupee(totalRupees),
      cellClass: 'text-right text-red-600 font-semibold tabular-nums',
      headClass: 'text-right text-red-600',
    },
  ]

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-[#1F2937]">Sales Summary</p>
      <div className={EXCEL_WRAP}>
        <table className={`${EXCEL_TABLE} min-w-[720px]`}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.header} className={`${EXCEL_HEAD} ${col.headClass || col.cellClass}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {columns.map((col) => (
                <td key={col.header} className={`${EXCEL_CELL} ${col.cellClass}`}>
                  {col.value}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PaymentOverviewSection({ totalRupees, deposited, balance, onUpdatePayment }) {
  const [editing, setEditing] = useState(false)
  const [tempReceived, setTempReceived] = useState(deposited)
  const [tempTotal, setTempTotal] = useState(totalRupees)

  const handleSave = () => {
    const rec = Number(tempReceived) || 0
    const tot = Number(tempTotal) || 0
    const bal = Math.max(0, tot - rec)
    onUpdatePayment?.({ totalRupees: tot, deposited: rec, balance: bal })
    setEditing(false)
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-semibold text-[#1F2937]">Payment Overview</p>
        <button
          type="button"
          onClick={() => {
            if (editing) {
              handleSave()
            } else {
              setTempReceived(deposited)
              setTempTotal(totalRupees)
              setEditing(true)
            }
          }}
          className={`${EXCEL_BTN_PRIMARY} py-0.5 px-2 text-xs font-semibold`}
        >
          {editing ? '💾 Save Overview' : '✏️ Edit Payment Overview'}
        </button>
      </div>
      <div className={EXCEL_WRAP}>
        <table className={EXCEL_TABLE}>
          <thead>
            <tr>
              <th className="border border-[#D4D4D4] px-2 py-1.5 text-left font-bold text-red-600">Total Amount</th>
              <th className="border border-[#D4D4D4] px-2 py-1.5 text-right font-bold text-emerald-700">Received</th>
              <th className="border border-[#D4D4D4] px-2 py-1.5 text-right font-bold text-red-600">Pending</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-[#D4D4D4] px-2 py-1.5 text-left font-bold text-red-600">
                {editing ? (
                  <input
                    type="number"
                    value={tempTotal}
                    onChange={(e) => setTempTotal(e.target.value)}
                    className="w-28 border border-[#217346] px-1.5 py-0.5 font-mono text-xs text-red-600 outline-none"
                  />
                ) : (
                  formatRupee(totalRupees)
                )}
              </td>
              <td className="border border-[#D4D4D4] px-2 py-1.5 text-right font-bold text-emerald-700">
                {editing ? (
                  <input
                    type="number"
                    value={tempReceived}
                    onChange={(e) => setTempReceived(e.target.value)}
                    className="w-28 border border-[#217346] px-1.5 py-0.5 font-mono text-xs text-right text-emerald-700 outline-none"
                    placeholder="Received amount"
                  />
                ) : (
                  formatRupee(deposited)
                )}
              </td>
              <td className="border border-[#D4D4D4] px-2 py-1.5 text-right font-bold text-red-600">
                {formatRupee(editing ? Math.max(0, Number(tempTotal || 0) - Number(tempReceived || 0)) : balance)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function FarmerPanelGradeChart({
  rows: initialRows = [],
  summary: initialSummary = { totalRupees: 0, deposited: 0, balance: 0 },
  title,
  onSave,
}) {
  const [chartRows, setChartRows] = useState(initialRows)
  const [summaryState, setSummaryState] = useState(initialSummary)

  const grandAQty = chartRows.reduce((s, r) => s + Number(r.gradeAQty || 0), 0)
  const grandBQty = chartRows.reduce((s, r) => s + Number(r.gradeBQty || 0), 0)
  const grandATotal = chartRows.reduce((s, r) => s + Number(r.gradeAQty || 0) * Number(r.gradeARate || 0), 0)
  const grandBTotal = chartRows.reduce((s, r) => s + Number(r.gradeBQty || 0) * Number(r.gradeBRate || 0), 0)
  const grandAB = grandATotal + grandBTotal
  const unit = chartRows[0]?.unit || 'Kg'

  const totalRupees = summaryState.totalRupees || (chartRows.length > 0 ? grandAB : 0)
  const deposited = summaryState.deposited || 0
  const balance = summaryState.balance ?? Math.max(0, totalRupees - deposited)
  const avgARate = grandAQty > 0 ? Math.round(grandATotal / grandAQty) : 0
  const avgBRate = grandBQty > 0 ? Math.round(grandBTotal / grandBQty) : 0

  const handleUpdatePayment = (newSummary) => {
    setSummaryState(newSummary)
    onSave?.(chartRows, newSummary)
  }

  const handleSaveChart = () => {
    onSave?.(chartRows, summaryState)
  }

  return (
    <section className="space-y-4">
      {title ? <h2 className="text-sm font-bold text-[#1F2937]">{title}</h2> : null}

      <PaymentOverviewSection
        totalRupees={totalRupees}
        deposited={deposited}
        balance={balance}
        onUpdatePayment={handleUpdatePayment}
      />

      <SalesSummarySection
        grandAQty={grandAQty}
        grandBQty={grandBQty}
        grandATotal={grandATotal}
        grandBTotal={grandBTotal}
        totalRupees={totalRupees}
        avgARate={avgARate}
        avgBRate={avgBRate}
        unit={unit}
      />

      <DailyChartSection
        rows={chartRows}
        setRows={setChartRows}
        unit={unit}
        onSave={handleSaveChart}
      />
    </section>
  )
}
