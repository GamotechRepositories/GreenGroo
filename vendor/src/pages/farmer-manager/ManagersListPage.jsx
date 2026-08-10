import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageSkeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { ConfirmDialog } from '@/components/ui/dialog'
import { useVendor } from '@/context/VendorContext'
import {
  deleteManager,
  getManagers,
  setManagerStatus,
} from '@/api/farmerManagerApi'
import { AvatarBubble, FmTable, PageToolbar, formatDate } from '@/components/farmer-manager/FmShared'

export default function ManagersListPage() {
  const navigate = useNavigate()
  const { toast, can } = useVendor()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setRows(await getManagers({ q, status }))
    } catch (err) {
      setError(err.message || 'Failed to load managers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [q, status])

  if (!can('farmerManager.view')) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-text-secondary">Access restricted</CardContent>
      </Card>
    )
  }

  const columns = [
    {
      key: 'name',
      label: 'Manager',
      render: (row) => (
        <div className="flex items-center gap-3">
          <AvatarBubble name={row.name} src={row.profileImage} size="sm" />
          <div>
            <p className="font-semibold">{row.name}</p>
            <p className="text-xs text-text-secondary">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'mobile', label: 'Mobile' },
    { key: 'location', label: 'Location' },
    { key: 'totalFarmers', label: 'Total Farmers', align: 'right' },
    { key: 'activeFarmers', label: 'Active Farmers', align: 'right' },
    { key: 'totalProducts', label: 'Total Products', align: 'right' },
    { key: 'totalOrders', label: 'Total Orders', align: 'right' },
    { key: 'status', label: 'Status', type: 'badge' },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => navigate(`/farmer-manager/managers/${row.id}`)}>
            View
          </Button>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/farmer-manager/managers/${row.id}/edit`)}>
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
          <Button size="sm" variant="danger" onClick={() => setConfirm({ type: 'delete', row })}>
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Farmer Manager</p>
          <h1 className="text-xl font-bold text-text-primary">All Managers</h1>
        </div>
        {can('farmerManager.create') ? (
          <Button asChild={false} onClick={() => navigate('/farmer-manager/managers/add')}>
            <Plus className="h-4 w-4" />
            Add Manager
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Managers</CardTitle>
        </CardHeader>
        <CardContent>
          <PageToolbar>
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <Input
                className="pl-9"
                placeholder="Search manager..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-[160px]">
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
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
              emptyTitle="No managers yet"
              emptyDescription="Add your first Farmer Manager to start assigning farmers."
              onRowClick={(row) => navigate(`/farmer-manager/managers/${row.id}`)}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.type === 'delete' ? 'Delete Manager' : 'Change Status'}
        description={
          confirm?.type === 'delete'
            ? `Delete ${confirm?.row?.name}? This cannot be undone.`
            : `Mark ${confirm?.row?.name} as ${confirm?.next}?`
        }
        confirmLabel={confirm?.type === 'delete' ? 'Delete' : 'Confirm'}
        variant={confirm?.type === 'delete' ? 'danger' : 'default'}
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          setBusy(true)
          try {
            if (confirm.type === 'delete') {
              await deleteManager(confirm.row.id)
              toast('Manager deleted')
            } else {
              await setManagerStatus(confirm.row.id, confirm.next)
              toast(`Manager marked ${confirm.next}`)
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
