import { Link } from 'react-router-dom'
import { PageShell } from '../../components/layout/SegregationManagerLayout'
import { Icon } from '../../components/ui/Icon'

export default function QrSystemHubPage() {
  return (
    <PageShell
      title="Orders"
      subtitle="Select the destination for QR generation & sticker printing"
    >
      <div className="mx-auto max-w-4xl space-y-6 mt-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          
          <Link
            to="/orders/dark-store"
            className="group flex flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-green-500"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
              <Icon name="box" className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 group-hover:text-green-600 transition-colors">
              Dark Store
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Generate QR stickers for products requested by particular zone's dark stores.
            </p>
          </Link>

          <Link
            to="/orders/preorders"
            className="group flex flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-green-500"
          >
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
              <Icon name="tag" className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 group-hover:text-green-600 transition-colors">
              Preorders
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Generate QR stickers for direct preorders before dispatching.
            </p>
          </Link>

        </div>
      </div>
    </PageShell>
  )
}
