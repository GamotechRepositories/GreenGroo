import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageSkeleton } from '@/components/ui/skeleton'
import { useVendor } from '@/context/VendorContext'
import { createFarmer, getManagerById } from '@/api/farmerManagerApi'

const EMPTY = {
  name: '',
  profileImage: '',
  mobile: '',
  email: '',
  password: '',
  confirmPassword: '',
  farmName: '',
  farmLocation: '',
  farmAddress: '',
  farmArea: '',
  farmType: 'Organic',
  status: 'Active',
  loginEnabled: true,
  documents: {
    aadhaar: '',
    pan: '',
    address: '',
    bank: '',
    other: '',
  },
  bank: {
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    ifsc: '',
  },
}

export default function FarmerFormPage() {
  const { managerId } = useParams()
  const navigate = useNavigate()
  const { toast, can } = useVendor()
  const [manager, setManager] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const mgr = await getManagerById(managerId)
        setManager(mgr)
      } catch (err) {
        toast(err.message || 'Manager not found', 'error')
        navigate('/farmer-manager/managers')
      } finally {
        setLoading(false)
      }
    })()
  }, [managerId, navigate, toast])

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const setDoc = (key, value) =>
    setForm((prev) => ({ ...prev, documents: { ...prev.documents, [key]: value } }))
  const setBank = (key, value) => setForm((prev) => ({ ...prev, bank: { ...prev.bank, [key]: value } }))

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.mobile.trim()) {
      toast('Farmer name and mobile are required', 'error')
      return
    }
    if (!form.password) {
      toast('Password is required for farmer login', 'error')
      return
    }
    if (form.password.length < 4) {
      toast('Password must be at least 4 characters long', 'error')
      return
    }
    if (form.password !== form.confirmPassword) {
      toast('Password and Confirm Password do not match', 'error')
      return
    }
    setSaving(true)
    try {
      const created = await createFarmer({ ...form, managerId })
      toast('Farmer added under manager with login credentials')
      navigate(`/farmer-manager/farmers/${created.id}`)
    } catch (err) {
      toast(err.message || 'Failed to add farmer', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!can('farmerManager.create') && !can('farmerManager.view')) {
    return <Card><CardContent className="p-8 text-center text-sm">Access restricted</CardContent></Card>
  }
  if (loading) return <PageSkeleton />

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to={`/farmer-manager/managers/${managerId}`} className="text-xs font-semibold text-primary">
            ← {manager?.name || 'Manager'}
          </Link>
          <h1 className="text-xl font-bold text-text-primary">Add Farmer</h1>
          <p className="text-sm text-text-secondary">
            New farmer will be assigned to <strong>{manager?.name}</strong>
          </p>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Create Farmer'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Farmer Name">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </Field>
          <Field label="Profile Image URL">
            <Input value={form.profileImage} onChange={(e) => set('profileImage', e.target.value)} />
          </Field>
          <Field label="Mobile Number">
            <Input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} required placeholder="10-digit mobile" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login Credentials</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Password">
            <Input
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              placeholder="Minimum 4 characters"
              required
            />
          </Field>
          <Field label="Confirm Password">
            <Input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => set('confirmPassword', e.target.value)}
              placeholder="Re-enter password"
              required
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Farm Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Farm Name">
            <Input value={form.farmName} onChange={(e) => set('farmName', e.target.value)} />
          </Field>
          <Field label="Farm Location">
            <Input value={form.farmLocation} onChange={(e) => set('farmLocation', e.target.value)} />
          </Field>
          <Field label="Farm Address" className="sm:col-span-2">
            <Input value={form.farmAddress} onChange={(e) => set('farmAddress', e.target.value)} />
          </Field>
          <Field label="Farm Area">
            <Input value={form.farmArea} onChange={(e) => set('farmArea', e.target.value)} placeholder="e.g. 5 acres" />
          </Field>
          <Field label="Farm Type">
            <Select value={form.farmType} onChange={(e) => set('farmType', e.target.value)}>
              <option value="Organic">Organic</option>
              <option value="Non-Organic">Non-Organic</option>
              <option value="Mixed">Mixed</option>
              <option value="Conventional">Conventional</option>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Aadhaar / ID Proof">
            <Input value={form.documents.aadhaar} onChange={(e) => setDoc('aadhaar', e.target.value)} />
          </Field>
          <Field label="PAN">
            <Input value={form.documents.pan} onChange={(e) => setDoc('pan', e.target.value)} />
          </Field>
          <Field label="Address Proof">
            <Input value={form.documents.address} onChange={(e) => setDoc('address', e.target.value)} />
          </Field>
          <Field label="Bank Details">
            <Input value={form.documents.bank} onChange={(e) => setDoc('bank', e.target.value)} />
          </Field>
          <Field label="Other Documents" className="sm:col-span-2">
            <Input value={form.documents.other} onChange={(e) => setDoc('other', e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Account Holder">
            <Input value={form.bank.accountHolder} onChange={(e) => setBank('accountHolder', e.target.value)} />
          </Field>
          <Field label="Bank Name">
            <Input value={form.bank.bankName} onChange={(e) => setBank('bankName', e.target.value)} />
          </Field>
          <Field label="Account Number">
            <Input value={form.bank.accountNumber} onChange={(e) => setBank('accountNumber', e.target.value)} />
          </Field>
          <Field label="IFSC">
            <Input value={form.bank.ifsc} onChange={(e) => setBank('ifsc', e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={form.status} onChange={(e) => set('status', e.target.value)} className="max-w-xs">
            <option value="Pending">Pending</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </CardContent>
      </Card>
    </form>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold text-text-secondary">{label}</span>
      {children}
    </label>
  )
}
