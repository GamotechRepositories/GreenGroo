import { useMemo, useState } from 'react'
import InventoryRequestTabs from '../../components/inventory-requests/InventoryRequestTabs'
import InventoryRequestTable from '../../components/inventory-requests/InventoryRequestTable'
import { PageShell } from '../../components/layout/SegregationManagerLayout'
import { INVENTORY_REQUESTS } from '../../data/inventoryRequests'

export default function InventoryRequestsPage() {
  const [activeTab, setActiveTab] = useState('all')

  const filteredRequests = useMemo(() => {
    if (activeTab === 'all') return INVENTORY_REQUESTS
    return INVENTORY_REQUESTS.filter((request) => request.status === activeTab)
  }, [activeTab])

  const counts = useMemo(
    () => ({
      all: INVENTORY_REQUESTS.length,
      pending: INVENTORY_REQUESTS.filter((r) => r.status === 'pending').length,
      approved: INVENTORY_REQUESTS.filter((r) => r.status === 'approved').length,
      rejected: INVENTORY_REQUESTS.filter((r) => r.status === 'rejected').length,
    }),
    [],
  )

  return (
    <PageShell
      title="Inventory Requests"
      subtitle="Review and manage stock requests from delivery managers"
    >
      <div className="rounded-xl bg-white shadow-sm">
        <InventoryRequestTabs
          activeTab={activeTab}
          counts={counts}
          onTabChange={setActiveTab}
        />
        <InventoryRequestTable requests={filteredRequests} />
      </div>
    </PageShell>
  )
}
