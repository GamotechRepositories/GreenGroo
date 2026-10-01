import { useAuth } from '../../context/AuthContext'
import { Icon } from '../../components/ui/Icon'

export default function ProfilePage() {
  const { staff } = useAuth()

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <div className="h-32 bg-gradient-to-r from-green-500 to-green-600"></div>
        <div className="relative px-6 pb-6 pt-16 sm:px-10 sm:pb-10">
          <div className="absolute -top-12 left-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-green-100 text-3xl font-bold text-green-700 shadow-md sm:left-10 sm:h-28 sm:w-28 sm:text-4xl">
            {staff?.name ? staff.name.charAt(0).toUpperCase() : 'U'}
          </div>
          
          <div className="mt-2 sm:mt-0 sm:ml-32 sm:flex sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{staff?.name || 'Segregation Manager'}</h2>
              <p className="mt-1 flex items-center text-sm text-slate-500">
                <Icon name="user" className="mr-1.5 h-4 w-4" />
                {staff?.role ? staff.role.replace('_', ' ').toUpperCase() : 'SEGREGATION MANAGER'}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                Active Account
              </span>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-slate-500">Email Address</dt>
                <dd className="mt-1 text-sm text-slate-900">{staff?.email || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Phone Number</dt>
                <dd className="mt-1 text-sm text-slate-900">{staff?.phone || 'Not provided'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Department</dt>
                <dd className="mt-1 text-sm text-slate-900">{staff?.department || 'Operations'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Member Since</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {staff?.createdAt ? new Date(staff.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-10">
        <h3 className="text-lg font-bold text-slate-900">Preferences & Settings</h3>
        <p className="mt-1 text-sm text-slate-500">Update your account preferences.</p>
        
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div>
            <p className="font-medium text-slate-900">Password</p>
            <p className="text-sm text-slate-500">Change your login password.</p>
          </div>
          <button
            type="button"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            onClick={() => alert('Change password functionality coming soon!')}
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  )
}
