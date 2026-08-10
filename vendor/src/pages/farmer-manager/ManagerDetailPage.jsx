import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageSkeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { ConfirmDialog } from '@/components/ui/dialog'
import { useVendor } from '@/context/VendorContext'
import {
  getFarmers,
  getManagerById,
  removeFarmerFromManager,
  setFarmerStatus,
} from '@/api/farmerManagerApi'
import {
  AvatarBubble,
  FmTable,
  StatGrid,
  formatDate,
} from '@/components/farmer-manager/FmShared'
import { formatCurrency as fc } from '@/lib/utils'

export default function ManagerDetailPage() {
  const { managerId } = useParams()
  const navigate = useNavigate()
  const { toast } = useVendor()
  const [manager, setManager] = useState(null)
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [mgr, list] = await Promise.all([
        getManagerById(managerId),
        getFarmers({ managerId }),
      ])
      setManager(mgr)
      setFarmers(list)
    } catch (err) {
      setError(err.message || 'Failed to load manager')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [managerId])

  if (loading) return <PageSkeleton />
  if (error) return <ErrorState description={error} onRetry={load} />
  if (!manager) return null

  const columns = [
    { key: 'name', label: 'Farmer Name' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'farmName', label: 'Farm Name' },
    { key: 'farmLocation', label: 'Farm Location' },
    { key: 'totalProducts', label: 'Products', align: 'right' },
    { key: 'totalStock', label: 'Total Stock', align: 'right' },
    { key: 'totalOrders', label: 'Orders', align: 'right' },
    {
      key: 'totalEarnings',
      label: 'Earnings',
      align: 'right',
      render: (row) => <span className="font-bold">{fc(row.totalEarnings)}</span>,
    },
    { key: 'status', label: 'Status', type: 'badge' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => navigate(`/farmer-manager/farmers/${row.id}`)}>
            View
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/farmer-manager/farmers/${row.id}?edit=1`)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setConfirm({
                type: 'status',
                row,
                next: row.status === 'Active' ? 'Inactive' : 'Active',
              })
            }
          >
            {row.status === 'Active' ? 'Deactivate' : 'Activate'}
          </Button>
          <Button size="sm" variant="danger" onClick={() => setConfirm({ type: 'remove', row })}>
            Remove
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/farmer-manager/managers" className="text-xs font-semibold text-primary">
            ← All Managers
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <AvatarBubble name={manager.name} src={manager.profileImage} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-text-primary">{manager.name}</h1>
                <Badge variant={manager.status === 'Active' ? 'success' : 'secondary'}>{manager.status}</Badge>
              </div>
              <p className="text-sm text-text-secondary">
                {manager.mobile} · {manager.email}
              </p>
              <p className="text-xs text-text-secondary">
                {manager.address ? `${manager.address}, ` : ''}
                {manager.location} · Joined {formatDate(manager.createdAt)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate(`/farmer-manager/managers/${managerId}/edit`)}>
            Edit Manager
          </Button>
          <Button onClick={() => navigate(`/farmer-manager/managers/${managerId}/farmers/add`)}>
            <Plus className="h-4 w-4" />
            Add Farmer
          </Button>
        </div>
      </div>

      <StatGrid
        items={[
          { label: 'Total Farmers', value: manager.totalFarmers },
          { label: 'Active Farmers', value: manager.activeFarmers },
          { label: 'Total Products', value: manager.totalProducts },
          { label: 'Total Inventory', value: manager.totalInventory },
          { label: 'Total Orders', value: manager.totalOrders },
          { label: 'Total Earnings', value: fc(manager.totalEarnings) },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Manager&apos;s Farmers</CardTitle>
        </CardHeader>
        <CardContent>
          <FmTable
            columns={columns}
            rows={farmers}
            emptyTitle="No farmers assigned"
            emptyDescription="Add a farmer under this manager to get started."
            onRowClick={(row) => navigate(`/farmer-manager/farmers/${row.id}`)}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.type === 'remove' ? 'Remove Farmer' : 'Change Status'}
        description={
          confirm?.type === 'remove'
            ? `Remove ${confirm?.row?.name} from ${manager.name}?`
            : `Mark ${confirm?.row?.name} as ${confirm?.next}?`
        }
        loading={busy}
        variant={confirm?.type === 'remove' ? 'danger' : 'default'}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          setBusy(true)
          try {
            if (confirm.type === 'remove') {
              await removeFarmerFromManager(confirm.row.id)
              toast('Farmer removed from manager')
            } else {
              await setFarmerStatus(confirm.row.id, confirm.next)
              toast(`Farmer marked ${confirm.next}`)
            }
            setConfirm(null)
            await load()
          } catch (err) {
            toast(err.message || 'Action failed', 'error')
          } finally {
            setBusy(false)
          }
        }}
      />
    </div>
  )
}
