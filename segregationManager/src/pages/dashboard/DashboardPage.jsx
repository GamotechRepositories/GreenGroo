import { Link } from 'react-router-dom'
import { PageShell } from '../../components/layout/SegregationManagerLayout'



export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      subtitle="Product segregation & inventory overview"
    >
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900">Product Segregation Management</h2>
        <p className="mt-1 text-sm text-gray-500">
          Monitor incoming produce, grading, inventory status, and store requests from one place.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-500">
        <p>No active modules available.</p>
      </div>
    </PageShell>
  )
}
