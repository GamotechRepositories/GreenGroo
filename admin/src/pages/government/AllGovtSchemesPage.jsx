import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Landmark,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Edit3,
  Phone,
  MapPin,
} from 'lucide-react';
import opsApi from '../../api/opsApi';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TH } from '../../utils/ui';
import { AppStatusBadge, ApplicationStatusModal } from './schemeApplicationShared';

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  closing_soon: 'bg-amber-50 text-amber-800 ring-amber-100',
  upcoming: 'bg-violet-50 text-violet-800 ring-violet-100',
  closed: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export default function AllGovtSchemesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('schemes'); // 'schemes' | 'applications'

  // Schemes state
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  // Applications state
  const [appRows, setAppRows] = useState([]);
  const [appStats, setAppStats] = useState(null);
  const [appLoading, setAppLoading] = useState(false);
  const [appError, setAppError] = useState('');
  const [appSearch, setAppSearch] = useState('');
  const [appStatus, setAppStatus] = useState('all');

  const [selectedApp, setSelectedApp] = useState(null);

  const loadSchemes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await opsApi.list('govt-schemes', status !== 'all' ? { status } : {});
      setRows(Array.isArray(res.data) ? res.data : []);
      setStats(res.stats || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load government schemes');
    } finally {
      setLoading(false);
    }
  }, [status]);

  const loadApplications = useCallback(async () => {
    setAppLoading(true);
    setAppError('');
    try {
      const params = {};
      if (appStatus !== 'all') params.status = appStatus;
      if (appSearch.trim()) params.search = appSearch.trim();
      const res = await opsApi.list('govt-schemes/applications', params);
      setAppRows(Array.isArray(res.data) ? res.data : []);
      setAppStats(res.stats || null);
    } catch (err) {
      setAppError(err.response?.data?.message || 'Failed to load farmer scheme applications');
    } finally {
      setAppLoading(false);
    }
  }, [appStatus, appSearch]);

  useEffect(() => {
    loadSchemes();
  }, [loadSchemes]);

  useEffect(() => {
    if (activeTab === 'applications') {
      loadApplications();
    }
  }, [activeTab, loadApplications]);

  const filteredSchemes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.title, row.shortName, row.category, row.govtLevel, row.description].some((v) =>
        String(v || '').toLowerCase().includes(q)
      )
    );
  }, [rows, search]);

  const handleDeleteScheme = async (id) => {
    if (!window.confirm('Delete this government scheme?')) return;
    try {
      await opsApi.remove('govt-schemes', id);
      await loadSchemes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete scheme');
    }
  };

  const handleDeleteApp = async (id) => {
    if (!window.confirm('Delete this farmer application?')) return;
    try {
      await opsApi.remove('govt-schemes/applications', id);
      await loadApplications();
    } catch (err) {
      setAppError(err.response?.data?.message || 'Failed to delete application');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={PAGE_KICKER}>Government</p>
          <h1 className={PAGE_TITLE}>Govt Schemes & Applications</h1>
          <p className={PAGE_SUB}>Manage government schemes and review farmer applications status.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => (activeTab === 'schemes' ? loadSchemes() : loadApplications())}
            className={BTN}
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Refresh
          </button>
          <Link to="/government/schemes/create" className={BTN_PRIMARY}>
            <Plus className="mr-1.5 h-4 w-4" />
            Create Govt Scheme
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('schemes')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'schemes'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Landmark className="h-4 w-4" />
          <span>Govt Schemes (शासकीय योजना)</span>
          {stats?.total ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{stats.total}</span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === 'applications'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Farmer Applications (शेतकरी अर्ज)</span>
          {appStats?.pending ? (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
              {appStats.pending} pending
            </span>
          ) : appStats?.total ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{appStats.total}</span>
          ) : null}
        </button>
      </div>

      {/* ======================= TAB 1: SCHEMES ======================= */}
      {activeTab === 'schemes' && (
        <div className="space-y-4">
          {stats ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total Schemes', value: stats.total },
                { label: 'Active (खुले)', value: stats.active },
                { label: 'Closing Soon', value: stats.closingSoon },
                { label: 'Upcoming', value: stats.upcoming },
              ].map((item) => (
                <div key={item.label} className={`${PANEL} px-4 py-3`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{item.value ?? 0}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className={`${PANEL} p-4`}>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search schemes..."
                  className={`${INPUT} pl-9`}
                />
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`${INPUT} w-auto min-w-[160px]`}
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="closing_soon">Closing soon</option>
                <option value="upcoming">Upcoming</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {error ? (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading schemes...
              </div>
            ) : filteredSchemes.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <Landmark className="h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">No government schemes found.</p>
                <Link to="/government/schemes/create" className={BTN_PRIMARY}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create first scheme
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="bg-slate-50/80">
                      <th className={TH}>Scheme</th>
                      <th className={TH}>Category</th>
                      <th className={TH}>Level</th>
                      <th className={TH}>Benefit</th>
                      <th className={TH}>Deadline</th>
                      <th className={TH}>Status</th>
                      <th className={`${TH} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSchemes.map((row) => (
                      <tr key={row._id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-3">
                          <div className="min-w-[200px]">
                            <p className="text-sm font-semibold text-slate-900">{row.title}</p>
                            <p className="text-xs text-slate-500">{row.shortName || '—'}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">{row.category || '—'}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">{row.govtLevel || '—'}</td>
                        <td className="px-3 py-3 text-sm font-medium text-emerald-800">
                          {row.maxBenefit || row.subsidyAmount || '—'}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">{row.deadline || '—'}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                              STATUS_STYLES[row.status] || STATUS_STYLES.closed
                            }`}
                          >
                            {row.statusLabel || row.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => navigate(`/government/schemes/${row._id}/edit`)}
                              className={BTN}
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteScheme(row._id)}
                              className={`${BTN} text-rose-700 hover:bg-rose-50`}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= TAB 2: FARMER APPLICATIONS ======================= */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {appStats ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Total Applications', value: appStats.total, icon: FileText, color: 'text-slate-900' },
                { label: 'Pending (प्रलंबित)', value: appStats.pending, icon: Clock, color: 'text-amber-600' },
                { label: 'Accepted (मंजूर)', value: appStats.accepted, icon: CheckCircle2, color: 'text-emerald-600' },
                { label: 'Rejected (अमान्य)', value: appStats.rejected, icon: XCircle, color: 'text-rose-600' },
              ].map((item) => (
                <div key={item.label} className={`${PANEL} flex items-center justify-between px-4 py-3`}>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                    <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.value ?? 0}</p>
                  </div>
                  <item.icon className={`h-8 w-8 opacity-20 ${item.color}`} />
                </div>
              ))}
            </div>
          ) : null}

          <div className={`${PANEL} p-4`}>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  placeholder="Search by farmer name, mobile, village, or scheme..."
                  className={`${INPUT} pl-9`}
                />
              </div>
              <select
                value={appStatus}
                onChange={(e) => setAppStatus(e.target.value)}
                className={`${INPUT} w-auto min-w-[160px]`}
              >
                <option value="all">All Application Status</option>
                <option value="pending">Pending (प्रलंबित)</option>
                <option value="accepted">Accepted / Approved (मंजूर)</option>
                <option value="rejected">Rejected (अमान्य)</option>
              </select>
            </div>

            {appError ? (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {appError}
              </div>
            ) : null}

            {appLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading farmer applications...
              </div>
            ) : appRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <Users className="h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">No farmer applications submitted yet.</p>
                <p className="text-xs text-slate-400">
                  Applications submitted by farmers from the mobile app will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="bg-slate-50/80">
                      <th className={TH}>Farmer Details</th>
                      <th className={TH}>Scheme</th>
                      <th className={TH}>Applied Date</th>
                      <th className={TH}>Status</th>
                      <th className={TH}>Farmer / Admin Remarks</th>
                      <th className={`${TH} text-right`}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appRows.map((row) => (
                      <tr key={row._id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-3">
                          <div className="min-w-[180px]">
                            <p className="text-sm font-bold text-slate-900">{row.farmerName || 'Farmer'}</p>
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-600">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{row.farmerPhone || row.farmerId || '—'}</span>
                            </div>
                            {(row.farmerVillage || row.farmerDistrict) && (
                              <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                <MapPin className="h-3 w-3 text-slate-400" />
                                <span>
                                  {[row.farmerVillage, row.farmerTaluka, row.farmerDistrict]
                                    .filter(Boolean)
                                    .join(', ')}
                                  {row.landAcres ? ` • ${row.landAcres} Acres` : ''}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="min-w-[180px]">
                            <p className="text-sm font-semibold text-slate-900">{row.schemeTitle}</p>
                            <p className="text-xs text-slate-500">{row.schemeCategory || 'Government Scheme'}</p>
                            {row.subsidyAmount && (
                              <p className="mt-0.5 text-xs font-medium text-emerald-700">
                                Subsidy: {row.subsidyAmount}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3 text-xs text-slate-600">
                          {row.appliedAt
                            ? new Date(row.appliedAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>

                        <td className="px-3 py-3">
                          <AppStatusBadge status={row.status} />
                        </td>

                        <td className="px-3 py-3 text-xs">
                          <div className="max-w-[240px] space-y-1">
                            {row.notes && (
                              <p className="text-slate-700">
                                <span className="font-semibold text-slate-500">शेतकरी:</span> {row.notes}
                              </p>
                            )}
                            {row.adminNotes ? (
                              <p className="rounded bg-slate-100 p-1 font-medium text-slate-800">
                                <span className="font-semibold text-slate-500">Admin Note:</span> {row.adminNotes}
                              </p>
                            ) : (
                              <p className="text-slate-400 italic">No admin notes yet</p>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedApp(row)}
                              className={`${BTN_PRIMARY} py-1 px-2.5 text-xs font-medium`}
                              title="Update Status"
                            >
                              <Edit3 className="mr-1 h-3.5 w-3.5" />
                              Update Status
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteApp(row._id)}
                              className={`${BTN} text-rose-700 hover:bg-rose-50 p-1.5`}
                              title="Delete Application"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedApp && (
        <ApplicationStatusModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onSaved={loadApplications}
        />
      )}
    </div>
  );
}
