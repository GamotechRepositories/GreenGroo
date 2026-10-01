import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { PageShell } from './SegregationManagerLayout'
import { useAuth } from '../../context/AuthContext'
import { Icon } from '../ui/Icon'

export default function ProfileLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const getPageInfo = () => {
    if (location.pathname.startsWith('/profile')) return { title: 'My Profile', subtitle: 'View and manage your account details.' }
    if (location.pathname.startsWith('/policies')) return { title: 'Policies', subtitle: 'Policies published by admin for your role.' }
    if (location.pathname.startsWith('/settings')) return { title: 'Settings', subtitle: 'Manage your application preferences.' }
    if (location.pathname.startsWith('/leave')) return { title: 'Apply for Leave', subtitle: 'Request leave with one or more dates.' }
    return { title: 'Account', subtitle: 'Manage your account' }
  }
  
  const { title, subtitle } = getPageInfo()

  return (
    <PageShell title={title} subtitle={subtitle}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          
          <div className="lg:col-span-3 space-y-6">
            <Outlet />
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sticky top-24">
              <h3 className="text-base font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="flex flex-col space-y-2">
                <Link
                  to="/profile"
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${location.pathname === '/profile' ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${location.pathname === '/profile' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon name="user" size="sm" />
                  </span>
                  My Profile
                </Link>

                <Link
                  to="/policies"
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${location.pathname === '/policies' ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${location.pathname === '/policies' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon name="clipboard" size="sm" />
                  </span>
                  Company Policies
                </Link>
                
                <Link
                  to="/settings"
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${location.pathname === '/settings' ? 'bg-green-50 text-green-700' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${location.pathname === '/settings' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon name="settings" size="sm" />
                  </span>
                  Account Settings
                </Link>

                <Link
                  to="/leave"
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${location.pathname === '/leave' ? 'bg-orange-50 text-orange-700' : 'text-slate-700 hover:bg-orange-50 hover:text-orange-700'}`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${location.pathname === '/leave' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon name="calendar" size="sm" />
                  </span>
                  Apply for Leave
                </Link>

                <div className="my-2 border-t border-slate-100"></div>

                <button
                  onClick={() => {
                    logout()
                    navigate('/login', { replace: true })
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                    <Icon name="power" size="sm" />
                  </span>
                  Logout securely
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageShell>
  )
}
