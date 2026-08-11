import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageSkeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { useVendor } from '@/context/VendorContext'
import { deleteFarmerProduct, getFarmerProduct, updateFarmerProduct } from '@/api/farmerManagerApi'
import { formatDate } from '@/components/farmer-manager/FmShared'
import { ExcelStatusBadge } from '@/components/farmer-manager/ExcelUi'
import {
  EXCEL_BTN,
  EXCEL_BTN_DANGER,
  EXCEL_BTN_OUTLINE,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
  EXCEL_SELECT,
} from '@/components/farmer-manager/excelStyles'
import { formatCurrency as fc } from '@/lib/utils'

function getDayName(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-US', { weekday: 'long' })
  } catch {
    return ''
  }
}

// Seamless Excel Sheet Input Cell Style (Spinners hidden & scroll disabled)
const CELL_INPUT = "w-full h-full bg-transparent px-2 py-1.5 text-xs border-0 outline-none focus:bg-[#E8F5E9] focus:ring-2 focus:ring-[#217346] font-mono text-[#1F2937] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

export default function FarmerProductDetailPage() {
  const { farmerId, productId } = useParams()
  const navigate = useNavigate()
  const { toast } = useVendor()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editModal, setEditModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(null)

  // Daily Chart Spreadsheet Rows
  const [dailyEntries, setDailyEntries] = useState([])
  const [dailyFilter, setDailyFilter] = useState('All days')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const p = await getFarmerProduct(farmerId, productId)
      setProduct(p)

      const gAQty = p.grades?.[0]?.quantity ?? p.gradeAQty ?? 30
      const gARate = p.gradeARate ?? p.grades?.[0]?.rate ?? 60
      const gBQty = p.grades?.[1]?.quantity ?? p.gradeBQty ?? 15
      const gBRate = p.gradeBRate ?? p.grades?.[1]?.rate ?? 49
      const gCQty = p.grades?.[2]?.quantity ?? 0
      const gCRate = p.gradeCRate ?? 35

      const rec = p.receivedAmount ?? 1775
      const pend = p.pendingAmount ?? 760

      setForm({
        name: p.name || 'Spinach',
        category: p.category || 'Vegetables',
        subCategory: p.subCategory || 'Fresh Leafy',
        description: p.description || '',
        image: p.image || p.imageUrl || '',
        unit: p.unit || 'Bundle',
        harvestDate: p.harvestDate ? p.harvestDate.split('T')[0] : '2026-08-07',
        produceType: p.produceType || 'organic',
        farmLocation: p.farmLocation || 'Pune, Maharashtra',
        status: p.status || 'Approved',
        gradeAQty: gAQty,
        gradeARate: gARate,
        gradeBQty: gBQty,
        gradeBRate: gBRate,
        gradeCQty: gCQty,
        gradeCRate: gCRate,
        receivedAmount: rec,
        pendingAmount: pend,
      })

      if (p.dailyEntries && p.dailyEntries.length) {
        setDailyEntries(p.dailyEntries)
      } else {
        setDailyEntries([
          {
            id: 1,
            date: '2026-08-10',
            day: 'Monday',
            aQty: 17,
            aRate: 60,
            bQty: 8,
            bRate: 50,
          },
          {
            id: 2,
            date: '2026-08-09',
            day: 'Sunday',
            aQty: 14,
            aRate: 60,
            bQty: 7,
            bRate: 48,
          },
        ])
      }
    } catch (err) {
      setError(err.message || 'Product not found')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [farmerId, productId])

  if (loading) return <PageSkeleton />
  if (error) return <ErrorState description={error} onRetry={load} />
  if (!product || !form) return null

  const imageSrc = product.image || product.imageUrl || '/categories/grocery.webp'
  const unit = form.unit || 'Bundle'

  // Excel Cell Change in Daily Chart Table
  const handleDailyCellChange = (index, field, value) => {
    setDailyEntries((prev) => {
      const copy = [...prev]
      const row = { ...copy[index], [field]: value }
      if (field === 'date') {
        row.day = getDayName(value) || row.day
      }
      copy[index] = row
      return copy
    })
  }

  // Insert NEW COMPLETELY EMPTY ROW (All fields Date, Day, Qty, Rate, Amounts empty!)
  const handleAddDailyRow = () => {
    const newRow = {
      id: Date.now(),
      date: '',
      day: '',
      aQty: '',
      aRate: '',
      bQty: '',
      bRate: '',
    }
    setDailyEntries([newRow, ...dailyEntries])
    toast('New empty row added to Excel sheet')
  }

  const handleDeleteDailyRow = (index) => {
    setDailyEntries((prev) => prev.filter((_, i) => i !== index))
    toast('Excel row deleted')
  }

  // Calculate Aggregates from Excel Table
  const totalAQty = dailyEntries.reduce((s, r) => s + (Number(r.aQty) || 0), 0)
  const totalAAmount = dailyEntries.reduce(
    (s, r) => s + (Number(r.aQty) || 0) * (Number(r.aRate) || 0),
    0,
  )
  const avgARate = totalAQty > 0 ? Math.round(totalAAmount / totalAQty) : Number(form.gradeARate) || 0

  const totalBQty = dailyEntries.reduce((s, r) => s + (Number(r.bQty) || 0), 0)
  const totalBAmount = dailyEntries.reduce(
    (s, r) => s + (Number(r.bQty) || 0) * (Number(r.bRate) || 0),
    0,
  )
  const avgBRate = totalBQty > 0 ? Math.round(totalBAmount / totalBQty) : Number(form.gradeBRate) || 0

  const totalQty = totalAQty + totalBQty
  const totalAmount = totalAAmount + totalBAmount

  const receivedAmount = Number(form.receivedAmount) || Math.round(totalAmount * 0.7)
  const pendingAmount = Math.max(0, totalAmount - receivedAmount)

  const isOutOfStock = totalQty <= 0

  const handleSaveAllProductDetails = async (e) => {
    if (e) e.preventDefault()
    setBusy(true)
    try {
      const grades = [
        { id: 'g-a', label: 'Grade A', quantity: totalAQty, rate: avgARate },
        { id: 'g-b', label: 'Grade B', quantity: totalBQty, rate: avgBRate },
      ]

      await updateFarmerProduct(farmerId, productId, {
        name: form.name,
        category: form.category,
        subCategory: form.subCategory,
        description: form.description,
        image: form.image,
        unit: form.unit,
        harvestDate: form.harvestDate,
        produceType: form.produceType,
        farmLocation: form.farmLocation,
        status: form.status,
        gradeARate: avgARate,
        gradeBRate: avgBRate,
        receivedAmount,
        pendingAmount,
        dailyEntries,
        grades,
      })

      toast('Saved Excel Daily Chart & Product Details')
      setEditModal(false)
      await load()
    } catch (err) {
      toast(err.message || 'Failed to update product', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteProduct = async () => {
    setBusy(true)
    try {
      await deleteFarmerProduct(farmerId, productId)
      toast('Product deleted successfully')
      navigate(`/farmer-manager/farmers/${farmerId}?tab=Products`)
    } catch (err) {
      toast(err.message || 'Delete failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-3 font-[Segoe_UI,Calibri,system-ui,sans-serif] text-[12px]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={`/farmer-manager/farmers/${farmerId}?tab=Products`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#6B7280] hover:text-[#217346]"
          >
            ‹ Back to products
          </Link>
          <h1 className={EXCEL_PAGE_TITLE}>{form.name}</h1>
          <ExcelStatusBadge status={form.status} />
          <span className="text-xs text-[#6B7280]">{form.category}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`${EXCEL_BTN_PRIMARY} py-1 px-3 font-semibold`}
            onClick={() => setEditModal(true)}
          >
            Edit Product
          </button>
          <button
            type="button"
            className={`${EXCEL_BTN_DANGER} py-1 px-2.5`}
            onClick={() => setDeleteModal(true)}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Main Product Banner */}
      <div className="flex flex-wrap items-center gap-6 rounded border border-[#D4D4D4] bg-white p-4 shadow-sm">
        <div className="h-24 w-28 shrink-0 overflow-hidden rounded border border-[#D4D4D4] bg-[#FAFAFA]">
          <img
            src={imageSrc}
            alt={form.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/categories/grocery.webp'
            }}
          />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-4 text-xs sm:grid-cols-4">
          <div>
            <span className="block font-semibold text-[#6B7280]">Harvest Date</span>
            <span className="mt-0.5 block font-semibold text-[#1F2937]">{formatDate(form.harvestDate)}</span>
          </div>
          <div>
            <span className="block font-semibold text-[#6B7280]">Farm Location</span>
            <span className="mt-0.5 block font-semibold text-[#1F2937]">{form.farmLocation || '—'}</span>
          </div>
          <div>
            <span className="block font-semibold text-[#6B7280]">Type</span>
            <span className="mt-0.5 block font-semibold text-[#1F2937]">
              {form.produceType === 'organic' ? 'Organic' : 'Non-Organic'}
            </span>
          </div>
          <div>
            <span className="block font-semibold text-[#6B7280]">Available Qty</span>
            <span className="mt-0.5 block font-semibold text-[#1F2937]">
              {totalQty} {unit}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Overview Panel */}
      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Payment Overview</h2>
        <div className="grid grid-cols-3 border-t border-[#D4D4D4] bg-white text-xs">
          <div className="border-r border-[#D4D4D4] p-3">
            <span className="block text-[11px] font-bold text-[#DC2626]">Total Amount</span>
            <span className="mt-1 block text-base font-extrabold text-[#DC2626]">
              {fc(totalAmount)}
            </span>
          </div>
          <div className="border-r border-[#D4D4D4] p-3">
            <span className="block text-[11px] font-bold text-[#16A34A]">Received</span>
            <span className="mt-1 block text-base font-extrabold text-[#16A34A]">
              {fc(receivedAmount)}
            </span>
          </div>
          <div className="p-3">
            <span className="block text-[11px] font-bold text-[#DC2626]">Pending</span>
            <span className="mt-1 block text-base font-extrabold text-[#DC2626]">
              {fc(pendingAmount)}
            </span>
          </div>
        </div>
      </section>

      {/* Sales Summary Panel */}
      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Sales Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#D4D4D4] bg-[#F2F2F2] text-[11px] font-semibold text-[#374151]">
                <th className="px-3 py-2 text-center">A Qty</th>
                <th className="px-3 py-2 text-center">A Rate</th>
                <th className="px-3 py-2 text-right">A Amount</th>
                <th className="px-3 py-2 text-center">B Qty</th>
                <th className="px-3 py-2 text-center">B Rate</th>
                <th className="px-3 py-2 text-right">B Amount</th>
                <th className="px-3 py-2 text-center">Total Qty</th>
                <th className="px-3 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#D4D4D4] bg-white font-medium text-[#1F2937]">
                <td className="px-3 py-2.5 text-center">{totalAQty} {unit}</td>
                <td className="px-3 py-2.5 text-center">₹{avgARate}</td>
                <td className="px-3 py-2.5 text-right font-bold">{fc(totalAAmount)}</td>
                <td className="px-3 py-2.5 text-center">{totalBQty} {unit}</td>
                <td className="px-3 py-2.5 text-center">₹{avgBRate}</td>
                <td className="px-3 py-2.5 text-right font-bold">{fc(totalBAmount)}</td>
                <td className="px-3 py-2.5 text-center font-bold">{totalQty} {unit}</td>
                <td className="px-3 py-2.5 text-right font-extrabold text-[#DC2626]">
                  {fc(totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Excel Grid Editable Daily Chart Panel */}
      <section className={EXCEL_PANEL}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D4D4D4] bg-[#217346] px-3 py-2 text-white">
          <h2 className="font-bold text-xs flex items-center gap-1.5">
            📊 Daily Chart — Grade A / B (Excel Grid Spreadsheet)
          </h2>
          <div className="flex items-center gap-2">
            <select
              className="bg-white text-[#1F2937] border border-[#D4D4D4] px-2 py-1 text-xs rounded"
              value={dailyFilter}
              onChange={(e) => setDailyFilter(e.target.value)}
            >
              <option value="All days">All days</option>
              <option value="This week">This week</option>
              <option value="This month">This month</option>
            </select>
            <button
              type="button"
              onClick={handleAddDailyRow}
              className="bg-white text-[#217346] hover:bg-[#F3F4F6] font-bold text-xs py-1 px-3 rounded shadow-sm transition-all"
            >
              + Add Excel Row
            </button>
            <button
              type="button"
              onClick={handleSaveAllProductDetails}
              className="bg-[#15803D] hover:bg-[#166534] text-white border border-white/30 font-bold text-xs py-1 px-3 rounded transition-all"
              disabled={busy}
            >
              {busy ? 'Saving...' : '💾 Save Excel Chart'}
            </button>
          </div>
        </div>

        {/* Real Excel Sheet Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-[#D4D4D4] text-left text-xs min-w-[950px]">
            <thead>
              <tr className="bg-[#E6F2EB] text-[#1F2937] text-[11px] font-bold">
                <th className="border border-[#D4D4D4] px-2 py-2 text-center w-10">Sr.</th>
                <th className="border border-[#D4D4D4] px-2 py-2 text-left w-36">Date</th>
                <th className="border border-[#D4D4D4] px-2 py-2 text-left w-28">Day</th>
                <th className="border border-[#D4D4D4] px-2 py-2 text-right w-28">A Qty ({unit})</th>
                <th className="border border-[#D4D4D4] px-2 py-2 text-right w-24">A Rate (₹)</th>
                <th className="border border-[#D4D4D4] px-2 py-2 text-right w-28">A Amount</th>
                <th className="border border-[#D4D4D4] px-2 py-2 text-right w-28">B Qty ({unit})</th>
                <th className="border border-[#D4D4D4] px-2 py-2 text-right w-24">B Rate (₹)</th>
                <th className="border border-[#D4D4D4] px-2 py-2 text-right w-28">B Amount</th>
                <th className="border border-[#D4D4D4] px-2 py-2 text-right text-[#DC2626] w-28">Total</th>
                <th className="border border-[#D4D4D4] px-2 py-2 text-center w-12">Del</th>
              </tr>
            </thead>
            <tbody>
              {dailyEntries.map((row, idx) => {
                const aQty = Number(row.aQty) || 0
                const aRate = Number(row.aRate) || 0
                const aAmt = aQty * aRate

                const bQty = Number(row.bQty) || 0
                const bRate = Number(row.bRate) || 0
                const bAmt = bQty * bRate

                const rowTotal = aAmt + bAmt

                return (
                  <tr key={row.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-[#F9FBF9]"}>
                    <td className="border border-[#D4D4D4] px-2 py-1.5 text-center font-bold text-[#6B7280] bg-[#F2F2F2]">
                      {idx + 1}
                    </td>
                    <td className="border border-[#D4D4D4] p-0">
                      <input
                        type="date"
                        className={CELL_INPUT}
                        value={row.date || ''}
                        onChange={(e) => handleDailyCellChange(idx, 'date', e.target.value)}
                      />
                    </td>
                    <td className="border border-[#D4D4D4] p-0">
                      <input
                        type="text"
                        className={CELL_INPUT}
                        value={row.day || ''}
                        onChange={(e) => handleDailyCellChange(idx, 'day', e.target.value)}
                        placeholder="Day"
                      />
                    </td>
                    <td className="border border-[#D4D4D4] p-0">
                      <input
                        type="number"
                        min="0"
                        className={`${CELL_INPUT} text-right font-medium`}
                        value={row.aQty ?? ''}
                        onChange={(e) => handleDailyCellChange(idx, 'aQty', e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder=""
                      />
                    </td>
                    <td className="border border-[#D4D4D4] p-0">
                      <input
                        type="number"
                        min="0"
                        className={`${CELL_INPUT} text-right font-medium`}
                        value={row.aRate ?? ''}
                        onChange={(e) => handleDailyCellChange(idx, 'aRate', e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder=""
                      />
                    </td>
                    <td className="border border-[#D4D4D4] px-2 py-1.5 text-right font-bold text-[#1F2937] tabular-nums bg-[#F9F9F9]">
                      {aAmt === 0 && (row.aQty === '' || row.aRate === '') ? '—' : fc(aAmt)}
                    </td>
                    <td className="border border-[#D4D4D4] p-0">
                      <input
                        type="number"
                        min="0"
                        className={`${CELL_INPUT} text-right font-medium`}
                        value={row.bQty ?? ''}
                        onChange={(e) => handleDailyCellChange(idx, 'bQty', e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder=""
                      />
                    </td>
                    <td className="border border-[#D4D4D4] p-0">
                      <input
                        type="number"
                        min="0"
                        className={`${CELL_INPUT} text-right font-medium`}
                        value={row.bRate ?? ''}
                        onChange={(e) => handleDailyCellChange(idx, 'bRate', e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder=""
                      />
                    </td>
                    <td className="border border-[#D4D4D4] px-2 py-1.5 text-right font-bold text-[#1F2937] tabular-nums bg-[#F9F9F9]">
                      {bAmt === 0 && (row.bQty === '' || row.bRate === '') ? '—' : fc(bAmt)}
                    </td>
                    <td className="border border-[#D4D4D4] px-2 py-1.5 text-right font-extrabold text-[#DC2626] tabular-nums bg-[#FEF2F2]">
                      {rowTotal === 0 && row.aQty === '' && row.bQty === '' ? '—' : fc(rowTotal)}
                    </td>
                    <td className="border border-[#D4D4D4] p-0 text-center bg-white">
                      <button
                        type="button"
                        onClick={() => handleDeleteDailyRow(idx)}
                        className="w-full h-full py-1 px-2 text-[#DC2626] hover:bg-[#FEE2E2] font-bold text-xs transition-colors"
                        title="Delete row"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#E6F2EB] font-bold text-xs border-t border-[#D4D4D4]">
                <td colSpan={3} className="border border-[#D4D4D4] px-3 py-2 text-left">
                  Total Summary
                </td>
                <td className="border border-[#D4D4D4] px-2 py-2 text-right font-bold tabular-nums">{totalAQty} {unit}</td>
                <td className="border border-[#D4D4D4] px-2 py-2 text-right tabular-nums">₹{avgARate}</td>
                <td className="border border-[#D4D4D4] px-2 py-2 text-right font-bold tabular-nums">{fc(totalAAmount)}</td>
                <td className="border border-[#D4D4D4] px-2 py-2 text-right font-bold tabular-nums">{totalBQty} {unit}</td>
                <td className="border border-[#D4D4D4] px-2 py-2 text-right tabular-nums">₹{avgBRate}</td>
                <td className="border border-[#D4D4D4] px-2 py-2 text-right font-bold tabular-nums">{fc(totalBAmount)}</td>
                <td className="border border-[#D4D4D4] px-2 py-2 text-right font-extrabold text-[#DC2626] tabular-nums">{fc(totalAmount)}</td>
                <td className="border border-[#D4D4D4]"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Edit Product Modal */}
      {editModal ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSaveAllProductDetails}
            className={`${EXCEL_PANEL} w-full max-w-3xl max-h-[92vh] overflow-y-auto`}
          >
            <div className="flex items-center justify-between border-b border-[#D4D4D4] bg-[#217346] px-3 py-2 text-white">
              <h3 className="font-bold text-sm">✏️ Edit Product Details</h3>
              <button
                type="button"
                onClick={() => setEditModal(false)}
                className="text-white hover:opacity-80"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 p-3 text-xs">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Product Name">
                  <input
                    className={EXCEL_INPUT}
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </Field>
                <Field label="Category">
                  <select
                    className={EXCEL_SELECT}
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains & Pulses">Grains & Pulses</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Spices">Spices</option>
                  </select>
                </Field>
                <Field label="Sub Category">
                  <input
                    className={EXCEL_INPUT}
                    value={form.subCategory}
                    onChange={(e) => setForm((p) => ({ ...p, subCategory: e.target.value }))}
                  />
                </Field>
                <Field label="Harvest Date">
                  <input
                    type="date"
                    className={EXCEL_INPUT}
                    value={form.harvestDate}
                    onChange={(e) => setForm((p) => ({ ...p, harvestDate: e.target.value }))}
                  />
                </Field>
                <Field label="Farm Location">
                  <input
                    className={EXCEL_INPUT}
                    value={form.farmLocation}
                    onChange={(e) => setForm((p) => ({ ...p, farmLocation: e.target.value }))}
                  />
                </Field>
                <Field label="Produce Type">
                  <select
                    className={EXCEL_SELECT}
                    value={form.produceType}
                    onChange={(e) => setForm((p) => ({ ...p, produceType: e.target.value }))}
                  >
                    <option value="organic">Organic</option>
                    <option value="non-organic">Non-Organic</option>
                  </select>
                </Field>
                <Field label="Unit">
                  <select
                    className={EXCEL_SELECT}
                    value={form.unit}
                    onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                  >
                    <option value="Bundle">Bundle</option>
                    <option value="Kg">Kg</option>
                    <option value="Litre">Litre</option>
                    <option value="Gram">Gram</option>
                    <option value="Ton">Ton</option>
                    <option value="Piece">Piece</option>
                  </select>
                </Field>
                <Field label="Product Status">
                  <select
                    className={EXCEL_SELECT}
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Draft">Draft</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </Field>
                <Field label="Received Amount (₹)">
                  <input
                    type="number"
                    min="0"
                    className={EXCEL_INPUT}
                    value={form.receivedAmount}
                    onChange={(e) => setForm((p) => ({ ...p, receivedAmount: e.target.value }))}
                  />
                </Field>
                <Field label="Image URL / Photo" className="sm:col-span-2 lg:col-span-3">
                  <input
                    className={EXCEL_INPUT}
                    value={form.image}
                    onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                    placeholder="https://example.com/photo.jpg"
                  />
                </Field>
                <Field label="Description" className="sm:col-span-2 lg:col-span-3">
                  <textarea
                    rows={2}
                    className={EXCEL_INPUT}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  />
                </Field>
              </div>
            </div>

            <div className="flex justify-end gap-1.5 border-t border-[#D4D4D4] px-3 py-2 bg-[#F9F9F9]">
              <button
                type="button"
                className={EXCEL_BTN_OUTLINE}
                disabled={busy}
                onClick={() => setEditModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className={EXCEL_BTN_PRIMARY} disabled={busy}>
                {busy ? 'Saving...' : 'Save Product Changes'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      {deleteModal ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className={`${EXCEL_PANEL} w-full max-w-sm`}>
            <h3 className={EXCEL_PANEL_HEAD}>Delete Product</h3>
            <div className="p-3 text-xs space-y-2">
              <p>Are you sure you want to delete <strong>{form.name}</strong>?</p>
              <p className="text-[#DC2626]">This action cannot be undone.</p>
            </div>
            <div className="flex justify-end gap-1.5 border-t border-[#D4D4D4] px-3 py-2 bg-[#F9F9F9]">
              <button
                type="button"
                className={EXCEL_BTN_OUTLINE}
                disabled={busy}
                onClick={() => setDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={EXCEL_BTN_DANGER}
                disabled={busy}
                onClick={handleDeleteProduct}
              >
                {busy ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">{label}</span>
      {children}
    </label>
  )
}
