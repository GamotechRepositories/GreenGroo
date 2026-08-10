import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageSkeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { useVendor } from '@/context/VendorContext'
import { getFarmers, getManagers } from '@/api/farmerManagerApi'
import { FmTable, PageToolbar } from '@/components/farmer-manager/FmShared'
import { formatCurrency } from '@/lib/utils'

export default function FarmersListPage() {
  const navigate = useNavigate()
  const { can } = useVendor()
  const [rows, setRows] = useState([])
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [managerId, setManagerId] = useState('')
  const [location, setLocation] = useState('')

  const locations = useMemo(
    () => [...new Set(rows.map((r) => r.farmLocation).filter(Boolean))],
    [rows],
  )

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [farmers, mgrs] = await Promise.all([
        getFarmers({ q, status, managerId, location }),
        getManagers(),
      ])
      setRows(farmers)
      setManagers(mgrs)
    } catch (err) {
      setError(err.message || 'Failed to load farmers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [q, status, managerId, location])

  if (!can('farmerManager.view')) {
    return <Card><CardContent className="p-8 text-center text-sm">Access restricted</CardContent></Card>
  }

  const columns = [
    { key: 'name', label: 'Farmer Name' },
    { key: 'managerName', label: 'Manager Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'farmName', label: 'Farm Name' },
    { key: 'farmLocation', label: 'Farm Location' },
    { key: 'totalProducts', label: 'Products', align: 'right' },
    { key: 'totalInventory', label: 'Inventory', align: 'right' },
    { key: 'totalOrders', label: 'Orders', align: 'right' },
    {
      key: 'totalEarnings',
      label: 'Earnings',
      align: 'right',
      render: (row) => <span className="font-bold">{formatCurrency(row.totalEarnings)}</span>,
    },
    { key: 'status', label: 'Status', type: 'badge' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => navigate(`/farmer-manager/farmers/${row.id}`)}>
            View
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Farmer Manager</p>
        <h1 className="text-xl font-bold text-text-primary">All Farmers</h1>
        <p className="text-sm text-text-secondary">All farmers belonging to this vendor, with their manager.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Farmers</CardTitle>
        </CardHeader>
        <CardContent>
          <PageToolbar>
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <Input
                className="pl-9"
                placeholder="Search farmer, manager, mobile, farm..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={managerId} onChange={(e) => setManagerId(e.target.value)} className="w-[180px]">
              <option value="">All Managers</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-[140px]">
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
            <Select value={location} onChange={(e) => setLocation(e.target.value)} className="w-[180px]">
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </Select>
          </PageToolbar>

          {loading ? (
            <PageSkeleton />
          ) : error ? (
            <ErrorState description={error} onRetry={load} />
          ) : (
            <FmTable
              columns={columns}
              rows={rows}
              emptyTitle="No farmers found"
              emptyDescription="Farmers will appear here once assigned to managers."
              onRowClick={(row) => navigate(`/farmer-manager/farmers/${row.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
