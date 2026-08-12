import { useMemo, useState } from 'react'
import { EXCEL_BTN_OUTLINE, EXCEL_BTN_PRIMARY, EXCEL_CELL, EXCEL_HEAD, EXCEL_TABLE, EXCEL_WRAP } from './excelStyles'

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

function getGradeData(row, gName) {
  if (Array.isArray(row.grades) && row.grades.length > 0) {
    const gObj = row.grades.find((g) => g.name === gName)
    const qty = gObj?.quantity != null ? Number(gObj.quantity) : 0
    const rate = gObj?.rate !== null && gObj?.rate !== undefined && gObj?.rate !== '' ? Number(gObj.rate) : null
    return { qty, rate, amount: qty * (rate || 0) }
  }
  if (gName === 'A Grade' || gName.startsWith('A')) {
    const qty = Number(row.gradeAQty || 0)
    const rate = row.gradeARate != null && row.gradeARate !== '' ? Number(row.gradeARate) : null
    return { qty, rate, amount: qty * (rate || 0) }
  }
  if (gName === 'B Grade' || gName.startsWith('B')) {
    const qty = Number(row.gradeBQty || 0)
    const rate = row.gradeBRate != null && row.gradeBRate !== '' ? Number(row.gradeBRate) : null
    return { qty, rate, amount: qty * (rate || 0) }
  }
  return { qty: 0, rate: null, amount: 0 }
}

function RowEditModal({ row, dynamicGrades, unit, onSave, onClose }) {
  const [date, setDate] = useState(row.date || new Date().toISOString().split('T')[0])
  const [rejectionQty, setRejectionQty] = useState(row.rejectionQty || 0)
  const [gradesData, setGradesData] = useState(() => {
    return dynamicGrades.map((gName) => {
      const existing = getGradeData(row, gName)
      return {
        name: gName,
        quantity: existing.qty || 0,
        rate: existing.rate !== null ? existing.rate : '',
      }
    })
  })

  const weekday = getDayOfWeek(date) || row.weekday || '—'

  const handleGradeChange = (gIndex, field, value) => {
    setGradesData((prev) => {
      const copy = [...prev]
      copy[gIndex] = { ...copy[gIndex], [field]: value === '' ? '' : Number(value) }
      return copy
    })
  }

  const grandTotal = useMemo(() => {
    return gradesData.reduce((sum, g) => sum + (Number(g.quantity) || 0) * (Number(g.rate) || 0), 0)
  }, [gradesData])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...row,
      date,
      weekday,
      grades: gradesData.map(g => ({
        name: g.name,
        quantity: Number(g.quantity) || 0,
        rate: g.rate === '' ? null : Number(g.rate),
      })),
      rejectionQty: Number(rejectionQty) || 0,
    })
  }

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl border border-[#D4D4D4] animate-fadeIn">
        <div className="flex items-center justify-between border-b border-[#D4D4D4] bg-[#217346] px-4 py-3 text-white">
          <h3 className="text-sm font-bold flex items-center gap-2">
            ✏️ Enter Rates & Edit Earning Record
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white font-bold text-base"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 bg-[#F9FBF9] p-3 rounded border border-[#E5E7EB]">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-[#D4D4D4] bg-white px-2 py-1.5 font-mono text-xs text-[#1F2937] outline-none focus:border-[#217346]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">Day</label>
              <div className="w-full border border-[#E5E7EB] bg-[#F3F4F6] px-2 py-1.5 text-xs font-semibold text-[#374151]">
                {weekday}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-[#1F2937]">
                Grade Quantities & Pricing Rates (₹/{unit})
              </label>
              <span className="text-[10px] text-[#217346] font-semibold bg-[#E8F5E9] px-2 py-0.5 rounded">
                Click rate box to type amount
              </span>
            </div>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {gradesData.map((g, idx) => {
                const subtotal = (Number(g.quantity) || 0) * (Number(g.rate) || 0)
                return (
                  <div key={g.name || idx} className="flex items-center gap-2 bg-[#F9F9F9] p-2 rounded border border-[#E5E7EB]">
                    <div className="w-24 font-bold text-[#1F2937] text-xs">{g.name}</div>
                    <div className="w-28">
                      <span className="block text-[9px] text-[#6B7280] font-semibold">Qty ({unit})</span>
                      <input
                        type="number"
                        min="0"
                        value={g.quantity}
                        onChange={(e) => handleGradeChange(idx, 'quantity', e.target.value)}
                        className="w-full border border-[#D4D4D4] bg-white px-2 py-1 text-right font-medium text-xs outline-none focus:border-[#217346]"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="block text-[9px] text-[#217346] font-bold">Rate (₹/{unit})</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={g.rate}
                        onChange={(e) => handleGradeChange(idx, 'rate', e.target.value)}
                        placeholder="Enter rate ₹"
                        className="w-full border-2 border-[#217346] bg-white px-2 py-1 text-right font-bold text-xs text-[#217346] outline-none focus:ring-2 focus:ring-[#217346]"
                        autoFocus={idx === 0}
                      />
                    </div>
                    <div className="w-24 text-right">
                      <span className="block text-[9px] text-[#6B7280] font-semibold">Subtotal</span>
                      <span className="font-bold text-[#1F2937] tabular-nums text-xs">{formatRupee(subtotal)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#FEF2F2] p-3 rounded border border-[#FCA5A5]">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-red-700">Rejection Qty ({unit})</label>
              <input
                type="number"
                min="0"
                value={rejectionQty}
                onChange={(e) => setRejectionQty(e.target.value)}
                className="w-28 border border-red-300 bg-white px-2 py-1 text-right font-bold text-xs text-red-600 outline-none focus:border-red-500 mt-0.5"
              />
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-red-700">Calculated Total</span>
              <span className="text-base font-extrabold text-red-600 tabular-nums">{formatRupee(grandTotal)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={onClose}
              className={EXCEL_BTN_OUTLINE}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${EXCEL_BTN_PRIMARY} px-4 py-1.5 text-xs font-bold`}
            >
              💾 Save Rates & Update Row
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DailyChartSection({ rows, setRows, unit, onSave }) {
  const [query, setQuery] = useState('')
  const [dayFilter, setDayFilter] = useState('')
  const [pageSize, setPageSize] = useState(24)
  const [editingRow, setEditingRow] = useState(null)

  const dynamicGrades = useMemo(() => {
    const set = new Set()
    rows.forEach((r) => {
      if (Array.isArray(r.grades) && r.grades.length > 0) {
        r.grades.forEach((g) => {
          if (g.name) set.add(g.name)
        })
      } else {
        if (r.gradeAQty != null || r.gradeARate != null) set.add('A Grade')
        if (r.gradeBQty != null || r.gradeBRate != null) set.add('B Grade')
      }
    })
    if (set.size === 0) {
      set.add('A Grade')
      set.add('B Grade')
    }
    return Array.from(set)
  }, [rows])

  const handleCellGradeChange = (rowIndex, gName, field, value) => {
    setRows((prev) => {
      const copy = [...prev]
      const row = { ...copy[rowIndex] }
      let grades = Array.isArray(row.grades) ? [...row.grades] : []

      let gIndex = grades.findIndex((g) => g.name === gName)
      if (gIndex === -1) {
        grades.push({ name: gName, quantity: 0, rate: 0, [field]: Number(value) || 0 })
      } else {
        grades[gIndex] = { ...grades[gIndex], [field]: Number(value) || 0 }
      }
      row.grades = grades

      if (gName === 'A Grade' || gName.startsWith('A')) {
        if (field === 'quantity') row.gradeAQty = Number(value) || 0
        if (field === 'rate') row.gradeARate = Number(value) || 0
      } else if (gName === 'B Grade' || gName.startsWith('B')) {
        if (field === 'quantity') row.gradeBQty = Number(value) || 0
        if (field === 'rate') row.gradeBRate = Number(value) || 0
      }

      copy[rowIndex] = row
      onSave?.(copy)
      return copy
    })
  }

  const handleRowFieldChange = (rowIndex, field, value) => {
    setRows((prev) => {
      const copy = [...prev]
      const row = { ...copy[rowIndex], [field]: value }
      if (field === 'date') {
        row.weekday = getDayOfWeek(value) || row.weekday
      }
      copy[rowIndex] = row
      onSave?.(copy)
      return copy
    })
  }

  const handleSaveModalRow = (updatedRow) => {
    if (editingRow == null) return
    const index = editingRow.index
    setRows((prev) => {
      const copy = [...prev]
      copy[index] = updatedRow
      onSave?.(copy)
      return copy
    })
    setEditingRow(null)
  }

  const handleAddRow = () => {
    const today = new Date().toISOString().split('T')[0]
    const newRow = {
      srNo: rows.length + 1,
      date: today,
      weekday: getDayOfWeek(today),
      unit: unit || 'Kg',
      grades: dynamicGrades.map((g) => ({ name: g, quantity: 0, rate: null })),
      rejectionQty: 0,
    }
    const updated = [newRow, ...rows]
    setRows(updated)
    setEditingRow({ index: 0, row: newRow })
  }

  const handleDeleteRow = (index) => {
    setRows((prev) => {
      const copy = prev.filter((_, i) => i !== index)
      onSave?.(copy)
      return copy
    })
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
    const gradeTotals = {}
    dynamicGrades.forEach((gName) => {
      const gQty = filteredRows.reduce((sum, r) => sum + getGradeData(r, gName).qty, 0)
      const gAmt = filteredRows.reduce((sum, r) => sum + getGradeData(r, gName).amount, 0)
      const avgRate = gQty > 0 ? Math.round(gAmt / gQty) : 0
      gradeTotals[gName] = { qty: gQty, rate: avgRate, amount: gAmt }
    })
    const totalRejection = filteredRows.reduce((sum, r) => sum + Number(r.rejectionQty || 0), 0)
    const grandTotal = dynamicGrades.reduce((sum, gName) => sum + gradeTotals[gName].amount, 0)

    return { gradeTotals, totalRejection, grandTotal }
  }, [filteredRows, dynamicGrades])

  const colSpanCount = 3 + dynamicGrades.length * 3 + 2

  return (
    <div className="border border-[#D4D4D4] bg-white">
      <div className="flex flex-wrap items-center justify-between border-b border-[#D4D4D4] bg-[#217346] px-3 py-2 text-white">
        <p className="flex items-center gap-1.5 text-xs font-bold">
          <span>📊</span> Daily Chart — Dynamic Grades & Fixed Rejection (Click Row to Fill Rates)
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
              onClick={() => onSave(rows)}
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
        <span className="text-[11px] text-[#217346] font-semibold">
          💡 Click any row to open rate entry modal
        </span>
      </div>

      <div className={EXCEL_WRAP}>
        <table className="w-full min-w-[950px] border-collapse border border-[#D4D4D4] text-left text-xs">
          <thead>
            <tr className="bg-[#E6F2EB] text-[11px] font-bold text-[#1F2937]">
              <th className="w-10 border border-[#D4D4D4] px-2 py-2 text-center">Sr.</th>
              <th className="w-20 border border-[#D4D4D4] px-2 py-2 text-left">Date</th>
              <th className="w-28 border border-[#D4D4D4] px-2 py-2 text-left">Day</th>
              {dynamicGrades.map((gName) => (
                <FragmentHeader key={gName} gName={gName} unit={unit} />
              ))}
              <th className="w-20 border border-[#D4D4D4] px-2 py-2 text-right text-red-600">Rejection Qty ({unit})</th>
              <th className="w-28 border border-[#D4D4D4] px-2 py-2 text-right text-[#DC2626]">Total</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={colSpanCount} className="border border-[#D4D4D4] bg-white py-8 text-center text-[#6B7280]">
                  No records yet. Click "+ Add Excel Row" to insert an empty spreadsheet row.
                </td>
              </tr>
            ) : (
              visibleRows.map((row, idx) => {
                let rowTotal = 0
                let hasQuantity = false
                let missingRate = false

                dynamicGrades.forEach((gName) => {
                  const gData = getGradeData(row, gName)
                  if (gData.qty > 0) {
                    hasQuantity = true
                    if (gData.rate === null) missingRate = true
                  }
                })

                const isPending = hasQuantity && missingRate
                const rowBgClass = isPending ? 'bg-[#FFF3E0]' : (idx % 2 === 0 ? 'bg-white' : 'bg-[#F9FBF9]')

                return (
                  <tr
                    key={row.srNo || idx}
                    onClick={() => setEditingRow({ index: idx, row })}
                    className="hover:brightness-95 cursor-pointer transition-all group"
                    title="Click row to edit rates and quantities"
                  >
                    <td className={`border border-[#D4D4D4] px-2 py-1.5 text-center font-bold text-[#6B7280] ${rowBgClass}`}>
                      {idx + 1}
                    </td>
                    <td className={`border border-[#D4D4D4] px-2 py-1.5 font-medium text-[#1F2937] ${rowBgClass}`}>
                      {formatDate(row.date)}
                    </td>
                    <td className={`border border-[#D4D4D4] px-2 py-1.5 text-[#6B7280] font-medium ${rowBgClass}`}>
                      {getDayOfWeek(row.date) || row.weekday || '—'}
                    </td>
                    {dynamicGrades.map((gName) => {
                      const gData = getGradeData(row, gName)
                      rowTotal += gData.amount
                      return (
                        <tr key={gName} className="contents">
                          <td className={`border border-[#D4D4D4] px-2 py-1.5 text-right font-medium text-[#1F2937] ${rowBgClass}`}>
                            {gData.qty > 0 ? gData.qty : 0}
                          </td>
                          <td className={`border border-[#D4D4D4] px-2 py-1.5 text-right font-bold ${gData.rate === null ? 'text-yellow-600/60' : 'text-[#217346]'} ${rowBgClass}`}>
                            {gData.rate !== null ? gData.rate : 'Rate ₹'}
                          </td>
                          <td className={`border border-[#D4D4D4] px-2 py-1.5 text-right font-bold tabular-nums text-[#1F2937] ${rowBgClass}`}>
                            {formatRupee(gData.amount)}
                          </td>
                        </tr>
                      )
                    })}
                    <td className={`border border-[#D4D4D4] px-2 py-1.5 text-right font-bold text-red-600 ${rowBgClass}`}>
                      {row.rejectionQty || 0}
                    </td>
                    <td className={`border border-[#D4D4D4] px-2 py-1.5 text-right font-extrabold tabular-nums text-[#DC2626] ${rowBgClass}`}>
                      {formatRupee(rowTotal)}
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
                {dynamicGrades.map((gName) => {
                  const gTot = totals.gradeTotals[gName] || { qty: 0, rate: 0, amount: 0 }
                  return (
                    <tr key={gName} className="contents">
                      <td className="border border-[#D4D4D4] px-2 py-2 text-right tabular-nums">
                        {gTot.qty} {unit}
                      </td>
                      <td className="border border-[#D4D4D4] px-2 py-2 text-right tabular-nums">
                        {formatRupee(gTot.rate)}
                      </td>
                      <td className="border border-[#D4D4D4] px-2 py-2 text-right font-bold tabular-nums">
                        {formatRupee(gTot.amount)}
                      </td>
                    </tr>
                  )
                })}
                <td className="border border-[#D4D4D4] px-2 py-2 text-right font-bold text-red-600 tabular-nums">
                  {totals.totalRejection} {unit}
                </td>
                <td className="border border-[#D4D4D4] px-2 py-2 text-right font-extrabold tabular-nums text-[#DC2626]">
                  {formatRupee(totals.grandTotal)}
                </td>
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

      {editingRow ? (
        <RowEditModal
          row={editingRow.row}
          dynamicGrades={dynamicGrades}
          unit={unit}
          onSave={handleSaveModalRow}
          onClose={() => setEditingRow(null)}
        />
      ) : null}
    </div>
  )
}

function FragmentHeader({ gName, unit }) {
  return (
    <>
      <th className="w-24 border border-[#D4D4D4] px-2 py-2 text-right">{gName} Qty ({unit})</th>
      <th className="w-24 border border-[#D4D4D4] px-2 py-2 text-right text-[#217346]">{gName} Rate (₹)</th>
      <th className="w-24 border border-[#D4D4D4] px-2 py-2 text-right">{gName} Amount</th>
    </>
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
          className={`${EXCEL_BTN_PRIMARY} px-2 py-0.5 text-xs font-semibold`}
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

  const unit = chartRows[0]?.unit || 'Kg'

  const totalRupees = summaryState.totalRupees || 0
  const deposited = summaryState.deposited || 0
  const balance = summaryState.balance ?? Math.max(0, totalRupees - deposited)

  const handleUpdatePayment = (newSummary) => {
    setSummaryState(newSummary)
    onSave?.(chartRows, newSummary)
  }

  const handleSaveChart = (updatedRows = chartRows) => {
    setChartRows(updatedRows)
    onSave?.(updatedRows, summaryState)
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

      <DailyChartSection
        rows={chartRows}
        setRows={setChartRows}
        unit={unit}
        onSave={handleSaveChart}
      />
    </section>
  )
}
