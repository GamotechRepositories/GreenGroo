import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Lock, Search, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageSkeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { useVendor } from '@/context/VendorContext'
import { getFarmers, getManagers, updateFarmerLoginStatus, updateFarmerPassword } from '@/api/farmerManagerApi'
import { FmTable, PageToolbar } from '@/components/farmer-manager/FmShared'
import { EXCEL_BTN_DANGER, EXCEL_BTN_OUTLINE, EXCEL_BTN_PRIMARY, EXCEL_INPUT, EXCEL_PANEL } from '@/components/farmer-manager/excelStyles'
import { formatCurrency } from '@/lib/utils'

export default function FarmersListPage() {
  const navigate = useNavigate()
  const { can, toast, vendor } = useVendor()
  const [rows, setRows] = useState([])
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [managerId, setManagerId] = useState('')
  const [location, setLocation] = useState('')

  // Credentials Modal State
  const [credentialsModal, setCredentialsModal] = useState(null) // selected farmer
  const [newPassword, setNewPassword] = useState('')
  const [savingCreds, setSavingCreds] = useState(false)

  const locations = useMemo(
    () => [...new Set(rows.map((r) => r.farmLocation).filter(Boolean))],
    [rows],
  )

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const currentVendorId = vendor?.id || vendor?._id
      const [farmers, mgrs] = await Promise.all([
        getFarmers({ q, status, managerId, location, vendorId: currentVendorId }),
        getManagers({ vendorId: currentVendorId }),
      ])
      setRows(Array.isArray(farmers) ? farmers : (farmers?.data || []))
      setManagers(Array.isArray(mgrs) ? mgrs : (mgrs?.data || []))
    } catch (err) {
      console.error('Failed to load farmers:', err)
      setError(err.message || 'Failed to load farmers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [q, status, managerId, location, vendor?.id, vendor?._id])

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 4) {
      toast('Password must be at least 4 characters long', 'error')
      return
    }
    setSavingCreds(true)
    try {
      await updateFarmerPassword(credentialsModal.id, newPassword)
      toast('Farmer password updated successfully')
      setNewPassword('')
    } catch (err) {
      toast(err.message || 'Failed to update password', 'error')
    } finally {
      setSavingCreds(false)
    }
  }

  const handleToggleLoginStatus = async () => {
    setSavingCreds(true)
    try {
      const nextStatus = !credentialsModal.loginEnabled
      const updated = await updateFarmerLoginStatus(credentialsModal.id, nextStatus)
      setCredentialsModal(updated)
      setRows((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
      toast(`Farmer login ${nextStatus ? 'enabled' : 'disabled'}`)
    } catch (err) {
      toast(err.message || 'Failed to update login status', 'error')
    } finally {
      setSavingCreds(false)
    }
  }

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
      key: 'loginEnabled',
      label: 'Login Status',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
            row.loginEnabled !== false
              ? 'bg-[#E8F5E9] text-[#217346]'
              : 'bg-[#FEE2E2] text-[#DC2626]'
          }`}
        >
          {row.loginEnabled !== false ? 'Enabled' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => navigate(`/farmer-manager/farmers/${row.id}`)}>
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCredentialsModal(row)
              setNewPassword('')
            }}
          >
            Credentials
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
        <p className="text-sm text-text-secondary">All farmers belonging to this vendor, with credentials management.</p>
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

      {credentialsModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-md ${EXCEL_PANEL} p-5 space-y-4`}>
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-text-primary">Farmer Credentials Management</h3>
                <p className="text-xs text-text-secondary">{credentialsModal.name} ({credentialsModal.mobile})</p>
              </div>
              <button
                type="button"
                onClick={() => setCredentialsModal(null)}
                className="text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            <div className="rounded border bg-[#F9FAFB] p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-semibold text-text-secondary">Mobile / Login ID:</span>
                <span className="font-bold text-text-primary">{credentialsModal.mobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-text-secondary">Password:</span>
                <span className="font-mono text-text-primary">••••••••</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t">
                <span className="font-semibold text-text-secondary">Login Access:</span>
                <span
                  className={`inline-flex items-center gap-1 font-bold ${
                    credentialsModal.loginEnabled !== false ? 'text-[#217346]' : 'text-[#DC2626]'
                  }`}
                >
                  {credentialsModal.loginEnabled !== false ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text-primary">Farmer Login Status</span>
                <Button
                  size="sm"
                  variant={credentialsModal.loginEnabled !== false ? 'destructive' : 'default'}
                  onClick={handleToggleLoginStatus}
                  disabled={savingCreds}
                >
                  {credentialsModal.loginEnabled !== false ? 'Disable Login' : 'Enable Login'}
                </Button>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-2 pt-2 border-t">
                <label className="block text-xs font-semibold text-text-secondary">Reset / Change Password</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password (min 4 chars)"
                    className={EXCEL_INPUT}
                    required
                  />
                  <button type="submit" disabled={savingCreds} className={EXCEL_BTN_PRIMARY}>
                    Reset
                  </button>
                </div>
              </form>
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                type="button"
                onClick={() => setCredentialsModal(null)}
                className={EXCEL_BTN_OUTLINE}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
