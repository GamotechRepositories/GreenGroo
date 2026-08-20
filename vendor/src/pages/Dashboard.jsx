import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Sprout,
  Users,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Package,
  Plus,
  RefreshCw,
  Search,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'
import { useVendor } from '@/context/VendorContext'
import { getManagers, getFarmers } from '@/api/farmerManagerApi'

export default function Dashboard() {
  const { vendor } = useVendor()
  const [managers, setManagers] = useState([])
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      const currentVendorId = vendor?.id || vendor?._id
      const [mgrRes, fmrRes] = await Promise.all([
        getManagers({ vendorId: currentVendorId }),
        getFarmers({ vendorId: currentVendorId }),
      ])
      setManagers(Array.isArray(mgrRes) ? mgrRes : mgrRes.data || [])
      setFarmers(Array.isArray(fmrRes) ? fmrRes : fmrRes.data || [])
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [vendor?.id, vendor?._id])

  const activeManagersCount = managers.filter((m) => (m.status || 'Active').toLowerCase() === 'active').length
  const activeFarmersCount = farmers.filter((f) => (f.status || 'Active').toLowerCase() === 'active').length
  const totalProductsCount = farmers.reduce((sum, f) => sum + (f.productsCount || f.products?.length || 0), 0)

  const filteredManagers = managers.filter((m) => {
    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()
    return (
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.toLowerCase().includes(q) ||
      m.location?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              Farmer Manager Portal
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Vendor Verified
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-text-secondary mt-1">
            Welcome back, <span className="font-bold text-text-primary">{vendor.name}</span> · {vendor.store}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/farmer-manager/managers/add"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Farmer Manager</span>
          </Link>
          <Link
            to="/farmer-manager/farmers"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-text-primary text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Users className="h-4 w-4 text-emerald-600" />
            <span>View Farmers ({farmers.length})</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-bold uppercase tracking-wider">Farmer Managers</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Sprout className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-black text-text-primary">{managers.length}</p>
          <p className="mt-1 text-xs text-text-secondary">
            <span className="font-bold text-emerald-600">{activeManagersCount} active</span> managers assigned
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-bold uppercase tracking-wider">Registered Farmers</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-black text-text-primary">{farmers.length}</p>
          <p className="mt-1 text-xs text-text-secondary">
            <span className="font-bold text-blue-600">{activeFarmersCount} active</span> crop producers
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-bold uppercase tracking-wider">Farmer Products</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-black text-text-primary">{totalProductsCount}</p>
          <p className="mt-1 text-xs text-text-secondary">Fresh crops & organic produce items</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-xs font-bold uppercase tracking-wider">Network Health</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">100%</p>
          <p className="mt-1 text-xs text-text-secondary">All manager nodes operating smoothly</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Managers Directory */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-4 rounded-2xl border border-border">
            <div>
              <h2 className="text-base font-bold text-text-primary">Farmer Managers Directory</h2>
              <p className="text-xs text-text-secondary">Active managers supervising local farmer clusters</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search managers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-background border border-border text-xs text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-emerald-500/30 w-48"
                />
              </div>
              <button
                onClick={loadData}
                className="p-2 rounded-xl border border-border hover:bg-muted text-text-secondary"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center rounded-2xl border border-border bg-card">
              <RefreshCw className="h-7 w-7 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-text-secondary mt-2">Loading managers directory...</p>
            </div>
          ) : filteredManagers.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card">
              <Sprout className="h-10 w-10 text-text-secondary mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-text-primary">No Farmer Managers Found</p>
              <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
                Start by adding your first Farmer Manager to oversee regional farmer onboarding.
              </p>
              <Link
                to="/farmer-manager/managers/add"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
              >
                <Plus className="h-4 w-4" />
                <span>Add Manager</span>
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                      <th className="py-3 px-4">Manager Name</th>
                      <th className="py-3 px-4">Contact info</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4 text-center">Farmers</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {filteredManagers.map((mgr) => (
                      <tr key={mgr.id || mgr._id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                              {mgr.name?.charAt(0) || 'M'}
                            </div>
                            <div>
                              <p className="font-bold text-text-primary">{mgr.name}</p>
                              <span className="font-mono text-[10px] text-text-secondary">
                                ID: {mgr.id || mgr._id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-medium text-text-primary">{mgr.phone || '—'}</p>
                          <p className="text-[11px] text-text-secondary">{mgr.email || '—'}</p>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-text-secondary">
                          {mgr.location || mgr.district || mgr.state || 'India'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
                            {mgr.farmersCount || (mgr.farmers ? mgr.farmers.length : 0)} Farmers
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              (mgr.status || 'Active').toLowerCase() === 'active'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            }`}
                          >
                            {mgr.status || 'Active'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/farmer-manager/managers/${mgr.id || mgr._id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                          >
                            <span>Manage</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Recent Farmers & Quick Links */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Panel */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Sprout className="h-4 w-4 text-emerald-600" />
              <span>Quick Operations</span>
            </h3>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <Link
                to="/farmer-manager/managers/add"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-border text-xs font-bold text-text-primary group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <UserPlus className="h-4 w-4 text-emerald-600" />
                  <span>Onboard New Manager</span>
                </div>
                <ChevronRight className="h-4 w-4 text-text-secondary group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/farmer-manager/farmers"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-border text-xs font-bold text-text-primary group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>View All Farmers Directory</span>
                </div>
                <ChevronRight className="h-4 w-4 text-text-secondary group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                to="/farmer-manager/managers"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-border text-xs font-bold text-text-primary group transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  <span>Manager Assignments & Status</span>
                </div>
                <ChevronRight className="h-4 w-4 text-text-secondary group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Registered Farmers Preview */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span>Recent Farmers ({farmers.length})</span>
              </h3>
              <Link to="/farmer-manager/farmers" className="text-xs font-bold text-emerald-600 hover:underline">
                View all
              </Link>
            </div>

            {farmers.length === 0 ? (
              <p className="text-xs text-text-secondary py-4 text-center">No farmers registered yet.</p>
            ) : (
              <div className="space-y-2.5">
                {farmers.slice(0, 5).map((f) => (
                  <div
                    key={f.id || f._id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-border/70"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {f.name?.charAt(0) || 'F'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-primary line-clamp-1">{f.name}</p>
                        <p className="text-[10px] text-text-secondary">{f.location || f.state || 'Farmer'}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                      {f.productsCount || f.products?.length || 0} Products
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
