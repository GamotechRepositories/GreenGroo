import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageShell } from '../../components/layout/SegregationManagerLayout'
import { staffApi } from '../../api/staffApi'
import { Icon } from '../../components/ui/Icon'

const REQUEST_STATUS = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
  inprocessed: "bg-blue-100 text-blue-800 border-blue-200",
  packed: "bg-purple-100 text-purple-800 border-purple-200",
  completed: "bg-green-200 text-green-900 border-green-300",
};

export default function QrSystemDarkStorePage() {
  const navigate = useNavigate()
  const [stores, setStores] = useState([])
  const [loadingStores, setLoadingStores] = useState(true)
  
  const [selectedZone, setSelectedZone] = useState('')
  const [selectedStore, setSelectedStore] = useState(null)
  
  const [requests, setRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(false)

  // Details Modal state
  const [viewingRequest, setViewingRequest] = useState(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Fetch dark stores on mount
  useEffect(() => {
    staffApi.listDarkStores()
      .then(data => {
        setStores(data || [])
        setLoadingStores(false)
      })
      .catch(err => {
        console.error("Failed to load dark stores", err)
        setLoadingStores(false)
      })
  }, [])

  // Group stores by city (zone)
  const zones = useMemo(() => {
    const grouped = {}
    stores.forEach(store => {
      const zone = store.city || 'Unknown Zone'
      if (!grouped[zone]) grouped[zone] = []
      grouped[zone].push(store)
    })
    return grouped
  }, [stores])

  const loadRequests = () => {
    if (!selectedStore) return;
    setLoadingRequests(true)
    staffApi.inventoryRequests()
      .then(allRequests => {
        const storeRequests = (allRequests || []).filter(r => r.managerId === selectedStore.id)
        setRequests(storeRequests)
        setLoadingRequests(false)
      })
      .catch(err => {
        console.error("Failed to load inventory requests", err)
        setLoadingRequests(false)
      })
  }

  // Fetch inventory requests when a store is selected
  useEffect(() => {
    if (!selectedStore) {
      setRequests([])
      return
    }
    loadRequests();
  }, [selectedStore])

  const resetToZones = () => {
    setSelectedZone('')
    setSelectedStore(null)
  }

  const resetToStores = () => {
    setSelectedStore(null)
  }

  const handleUpdateStatus = async (newStatus) => {
    if (!viewingRequest) return;
    setIsUpdatingStatus(true);
    try {
      await staffApi.updateInventoryRequest(viewingRequest.id || viewingRequest._id, { status: newStatus });
      setViewingRequest({ ...viewingRequest, status: newStatus });
      loadRequests();
    } catch (error) {
      console.error("Failed to update status", error);
      alert("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <PageShell
      title="Dark Store Requests"
      subtitle="Manage inventory requests and generate QR stickers"
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link to="/orders" className="font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Orders Hub
          </Link>
          
          {selectedZone && (
            <>
              <span className="text-slate-300">/</span>
              <button onClick={resetToZones} className="font-medium text-slate-500 hover:text-slate-900 transition-colors">
                Zones
              </button>
            </>
          )}

          {selectedStore && (
            <>
              <span className="text-slate-300">/</span>
              <button onClick={resetToStores} className="font-medium text-slate-500 hover:text-slate-900 transition-colors">
                {selectedZone}
              </button>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-green-700">{selectedStore.storeName}</span>
            </>
          )}
        </div>
      </div>

      {loadingStores ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-green-600" />
        </div>
      ) : !selectedZone ? (
        // Step 1: Show Zones
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Select an Active Zone</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Object.keys(zones).length === 0 && (
              <p className="text-slate-500 col-span-full">No active zones available.</p>
            )}
            {Object.keys(zones).map(zone => (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className="group flex flex-col items-start justify-between rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-green-500 text-left"
              >
                <div className="flex w-full items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                    <Icon name="mapPin" className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {zones[zone].length} Stores
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 group-hover:text-green-600 transition-colors">
                  {zone}
                </h4>
              </button>
            ))}
          </div>
        </div>
      ) : !selectedStore ? (
        // Step 2: Show Dark Stores in selected zone
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Select Dark Store in {selectedZone}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {zones[selectedZone].length === 0 && (
              <p className="text-slate-500 col-span-full">No stores found in this zone.</p>
            )}
            {zones[selectedZone].map(store => (
              <button
                key={store.id}
                onClick={() => setSelectedStore(store)}
                className="group flex flex-col items-start justify-between rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-green-500 text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100 mb-4">
                  <Icon name="box" className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 group-hover:text-green-600 transition-colors line-clamp-1">
                  {store.storeName}
                </h4>
                <p className="mt-1 text-xs text-slate-500 line-clamp-1">{store.area}</p>
                <p className="mt-2 text-xs font-medium text-slate-600 flex items-center gap-1">
                  <Icon name="user" className="h-3 w-3" /> {store.name}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        // Step 3: Show Requests
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Inventory Requests
              </h3>
              <p className="text-xs text-slate-500 mt-1">Requested by {selectedStore.name} ({selectedStore.storeName})</p>
            </div>
            {loadingRequests && <span className="text-sm text-slate-500">Loading requests...</span>}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-100 bg-white text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Request #</th>
                  <th className="px-6 py-4 font-medium">Item Name</th>
                  <th className="px-6 py-4 font-medium">Total Qty</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {!loadingRequests && requests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      No inventory requests found for this store.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req._id || req.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate(`/orders/dark-store/${req._id || req.id}`)}>
                      <td className="px-6 py-4 font-medium text-slate-900">{req.requestNumber}</td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{req.productName}</p>
                        <p className="text-xs text-slate-500">SKU: {req.sku}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {req.quantity} {req.unit}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize border ${
                          REQUEST_STATUS[req.status] || REQUEST_STATUS.pending
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/orders/dark-store/${req._id || req.id}`); }}
                          className="rounded-lg bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-100 transition-colors"
                        >
                          View Details & Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


    </PageShell>
  )
}

