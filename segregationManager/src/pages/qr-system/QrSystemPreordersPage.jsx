import { Link } from 'react-router-dom'
import { PageShell } from '../../components/layout/SegregationManagerLayout'

export default function QrSystemPreordersPage() {
  return (
    <PageShell
      title="Preorders QR Generation"
      subtitle="Generate QR stickers for direct preorders"
    >
      <div className="mb-4">
        <Link to="/qr-system" className="text-sm font-medium text-green-600 hover:text-green-700">
          ← Back to QR System Hub
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-500">
        <p className="text-base font-medium text-gray-900 mb-2">Preorders QR Module</p>
        <p>This module is pending implementation.</p>
      </div>
    </PageShell>
  )
}
