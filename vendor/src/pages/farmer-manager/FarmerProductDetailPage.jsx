import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageSkeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { getFarmerProduct } from '@/api/farmerManagerApi'
import { formatDate } from '@/components/farmer-manager/FmShared'
import { ExcelStatusBadge } from '@/components/farmer-manager/ExcelUi'
import {
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
} from '@/components/farmer-manager/excelStyles'

export default function FarmerProductDetailPage() {
  const { farmerId, productId } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setProduct(await getFarmerProduct(farmerId, productId))
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
  if (!product) return null

  return (
    <div className="mx-auto max-w-4xl space-y-3 font-[Segoe_UI,Calibri,system-ui,sans-serif] text-[12px]">
      <div>
        <Link
          to={`/farmer-manager/farmers/${farmerId}?tab=Products`}
          className="text-xs font-semibold text-[#217346] hover:underline"
        >
          ← Back to farmer products
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className={EXCEL_PAGE_TITLE}>{product.name}</h1>
          <ExcelStatusBadge status={product.status} />
        </div>
        <p className={EXCEL_PAGE_SUB}>
          {product.farmerName} · Manager: {product.managerName}
        </p>
      </div>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Product Information</h2>
        <dl className="grid gap-0 sm:grid-cols-2">
          <Info label="Category" value={product.category} />
          <Info label="Sub Category" value={product.subCategory} />
          <Info label="Farmer" value={product.farmerName} />
          <Info label="Manager" value={product.managerName} />
          <Info label="Farm Location" value={product.farmLocation} />
          <Info label="Harvest Date" value={formatDate(product.harvestDate)} />
          <Info
            label="Produce Type"
            value={product.produceType === 'organic' ? 'Organic' : 'Non-Organic'}
          />
          <Info label="Unit" value={product.unit} />
          <div className="border border-[#D4D4D4] px-3 py-2 sm:col-span-2">
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Description</dt>
            <dd className="mt-0.5 text-xs font-semibold text-[#1F2937]">{product.description || '—'}</dd>
          </div>
        </dl>
      </section>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Grades (Quantity only)</h2>
        <div className="grid gap-0 sm:grid-cols-2">
          {product.grades?.length ? (
            product.grades.map((g) => (
              <div key={g.id || g.label} className="border border-[#D4D4D4] px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">{g.label}</p>
                <p className="mt-1 text-lg font-bold text-[#1F2937]">
                  {g.quantity} <span className="text-xs font-semibold text-[#6B7280]">{product.unit}</span>
                </p>
              </div>
            ))
          ) : (
            <p className="px-3 py-6 text-xs text-[#6B7280]">No grades available.</p>
          )}
        </div>
      </section>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="border border-[#D4D4D4] px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">{label}</dt>
      <dd className="mt-0.5 text-xs font-semibold text-[#1F2937]">{value || '—'}</dd>
    </div>
  )
}
