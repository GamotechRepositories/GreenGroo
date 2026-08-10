import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { PageSkeleton } from '@/components/ui/skeleton'
import { useVendor } from '@/context/VendorContext'
import { createManager, getManagerById, updateManager } from '@/api/farmerManagerApi'

const EMPTY = {
  name: '',
  profileImage: '',
  mobile: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  authType: 'password',
  password: '',
  status: 'Active',
}

export default function ManagerFormPage() {
  const { managerId } = useParams()
  const isEdit = Boolean(managerId)
  const navigate = useNavigate()
  const { toast, can } = useVendor()
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    ;(async () => {
      try {
        const data = await getManagerById(managerId)
        setForm({
          name: data.name || '',
          profileImage: data.profileImage || '',
          mobile: data.mobile || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          authType: data.authType || 'password',
          password: '',
          status: data.status || 'Active',
        })
      } catch (err) {
        toast(err.message || 'Manager not found', 'error')
        navigate('/farmer-manager/managers')
      } finally {
        setLoading(false)
      }
    })()
  }, [isEdit, managerId, navigate, toast])

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.mobile.trim() || !form.email.trim()) {
      toast('Name, mobile and email are required', 'error')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        await updateManager(managerId, form)
        toast('Manager updated')
        navigate(`/farmer-manager/managers/${managerId}`)
      } else {
        const created = await createManager(form)
        toast('Manager created')
        navigate(`/farmer-manager/managers/${created.id}`)
      }
    } catch (err) {
      toast(err.message || 'Failed to save manager', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!can(isEdit ? 'farmerManager.edit' : 'farmerManager.create') && !can('farmerManager.view')) {
    return <Card><CardContent className="p-8 text-center text-sm">Access restricted</CardContent></Card>
  }

  if (loading) return <PageSkeleton />

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/farmer-manager/managers" className="text-xs font-semibold text-primary">
            ← All Managers
          </Link>
          <h1 className="text-xl font-bold text-text-primary">{isEdit ? 'Edit Manager' : 'Add Manager'}</h1>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Update Manager' : 'Create Manager'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Manager Name">
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </Field>
          <Field label="Profile Image URL">
            <Input value={form.profileImage} onChange={(e) => set('profileImage', e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Mobile Number">
            <Input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} required />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Input value={form.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label="State">
            <Input value={form.state} onChange={(e) => set('state', e.target.value)} />
          </Field>
          <Field label="Pincode">
            <Input value={form.pincode} onChange={(e) => set('pincode', e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Login</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="Auth Type">
            <Select value={form.authType} onChange={(e) => set('authType', e.target.value)}>
              <option value="password">Password</option>
              <option value="otp">OTP</option>
            </Select>
          </Field>
          {form.authType === 'password' ? (
            <Field label={isEdit ? 'Password (leave blank to keep)' : 'Password'}>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="••••••••"
              />
            </Field>
          ) : (
            <Field label="Login">
              <Input value={form.mobile || form.email} readOnly className="bg-muted" />
            </Field>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={form.status} onChange={(e) => set('status', e.target.value)} className="max-w-xs">
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
