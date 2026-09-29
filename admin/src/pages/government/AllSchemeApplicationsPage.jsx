import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  FileText,
  LayoutList,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  Tractor,
  Users,
  XCircle,
} from 'lucide-react';
import opsApi from '../../api/opsApi';
import { useLive } from '../../realtime/useLive';
import { BTN, BTN_PRIMARY, INPUT, PAGE_KICKER, PAGE_SUB, PAGE_TITLE, PANEL, TH } from '../../utils/ui';
import { AppStatusBadge, ApplicationStatusModal } from './schemeApplicationShared';

const NEW_WINDOW_MS = 24 * 60 * 60 * 1000;

const isAccepted = (status) => status === 'accepted' || status === 'approved';

function appliedTime(app) {
  const t = new Date(app.appliedAt || app.createdAt || 0).getTime();
  return Number.isFinite(t) ? t : 0;
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isNewApplication(app) {
  return app.status === 'pending' && Date.now() - appliedTime(app) < NEW_WINDOW_MS;
}

function farmerKey(app) {
  return String(app.farmerId || app.farmerPhone || app.farmerName || app._id);
}

function farmerLocation(app) {
  return [app.farmerVillage, app.farmerTaluka, app.farmerDistrict].filter(Boolean).join(', ');
}

function matchesSearch(app, q) {
  if (!q) return true;
  return [
    app.farmerName,
    app.farmerPhone,
    app.farmerId,
    app.farmerVillage,
    app.farmerTaluka,
    app.farmerDistrict,
    app.schemeTitle,
    app.schemeCategory,
  ].some((v) => String(v || '').toLowerCase().includes(q));
}

export default function AllSchemeApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [scheme, setScheme] = useState('all');
  const [view, setView] = useState('farmers'); // 'farmers' | 'list'
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [selectedApp, setSelectedApp] = useState(null);

  const load = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await opsApi.list('govt-schemes/applications');
      const rows = Array.isArray(res.data) ? res.data : [];
      setApps([...rows].sort((a, b) => appliedTime(b) - appliedTime(a)));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load farmer scheme applications');
    } finally {
      setLoading(false);
    }
  };

  useLive(load, []);

  const schemeOptions = useMemo(() => {
    const titles = new Set(apps.map((a) => a.schemeTitle).filter(Boolean));
    return [...titles].sort((a, b) => a.localeCompare(b));
  }, [apps]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps.filter((a) => {
      if (status === 'accepted' ? !isAccepted(a.status) : status !== 'all' && a.status !== status) return false;
      if (scheme !== 'all' && a.schemeTitle !== scheme) return false;
      return matchesSearch(a, q);
    });
  }, [apps, search, status, scheme]);

  const farmers = useMemo(() => {
    const groups = new Map();
    for (const app of filtered) {
      const key = farmerKey(app);
      if (!groups.has(key)) groups.set(key, { key, profile: app, apps: [] });
      groups.get(key).apps.push(app);
    }
    return [...groups.values()];
  }, [filtered]);

  const stats = useMemo(
    () => ({
      farmers: new Set(apps.map(farmerKey)).size,
      total: apps.length,
      pending: apps.filter((a) => a.status === 'pending').length,
      accepted: apps.filter((a) => isAccepted(a.status)).length,
      rejected: apps.filter((a) => a.status === 'rejected').length,
    }),
    [apps]
  );

  const toggleFarmer = (key) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDelete = async (app) => {
    if (!window.confirm(`Delete ${app.farmerName || 'this farmer'}'s application for "${app.schemeTitle}"?`)) return;
    try {
      await opsApi.remove('govt-schemes/applications', app._id);
      await load({ silent: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete application');
    }
  };

  const actionButtons = (app) => (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => setSelectedApp(app)}
        className={`${BTN_PRIMARY} px-2.5 py-1 text-xs font-medium`}
        title="Update Status"
      >
        <Edit3 className="mr-1 h-3.5 w-3.5" />
        Update Status
      </button>
      <button
        type="button"
        onClick={() => handleDelete(app)}
        className={`${BTN} p-1.5 text-rose-700 hover:bg-rose-50`}
        title="Delete Application"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  const schemeCell = (app) => (
    <div className="min-w-[180px]">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-semibold text-slate-900">{app.schemeTitle || 'Scheme'}</p>
        {isNewApplication(app) && (
          <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">New</span>
        )}
      </div>
      <p className="text-xs text-slate-500">{app.schemeCategory || 'Government Scheme'}</p>
      {app.subsidyAmount && <p className="mt-0.5 text-xs font-medium text-emerald-700">Subsidy: {app.subsidyAmount}</p>}
    </div>
  );

  const remarksCell = (app) => (
    <div className="max-w-[240px] space-y-1 text-xs">
      {app.notes && (
        <p className="text-slate-700">
          <span className="font-semibold text-slate-500">शेतकरी:</span> {app.notes}
        </p>
      )}
      {app.adminNotes ? (
        <p className="rounded bg-slate-100 p-1 font-medium text-slate-800">
          <span className="font-semibold text-slate-500">Admin Note:</span> {app.adminNotes}
        </p>
      ) : (
        <p className="italic text-slate-400">No admin notes yet</p>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={PAGE_KICKER}>Government</p>
          <h1 className={PAGE_TITLE}>All Applications (सर्व अर्ज)</h1>
          <p className={PAGE_SUB}>
            Every farmer and the government schemes they applied for. New submissions from the farmer app appear here
            automatically.
          </p>
        </div>
        <button type="button" onClick={() => load()} className={BTN}>
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Farmers Applied', value: stats.farmers, icon: Tractor, color: 'text-slate-900' },
          { label: 'Total Applications', value: stats.total, icon: FileText, color: 'text-slate-900' },
          { label: 'Pending (प्रलंबित)', value: stats.pending, icon: Clock, color: 'text-amber-600' },
          { label: 'Accepted (मंजूर)', value: stats.accepted, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Rejected (अमान्य)', value: stats.rejected, icon: XCircle, color: 'text-rose-600' },
        ].map((item) => (
          <div key={item.label} className={`${PANEL} flex items-center justify-between px-4 py-3`}>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className={`mt-1 text-2xl font-bold ${item.color}`}>{item.value}</p>
            </div>
            <item.icon className={`h-8 w-8 opacity-20 ${item.color}`} />
          </div>
        ))}
      </div>

      <div className={`${PANEL} p-4`}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by farmer name, mobile, village, or scheme..."
              className={`${INPUT} pl-9`}
            />
          </div>
          <select value={scheme} onChange={(e) => setScheme(e.target.value)} className={`${INPUT} w-auto min-w-[180px]`}>
            <option value="all">All Schemes</option>
            {schemeOptions.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${INPUT} w-auto min-w-[160px]`}>
            <option value="all">All Status</option>
            <option value="pending">Pending (प्रलंबित)</option>
            <option value="accepted">Accepted / Approved (मंजूर)</option>
            <option value="rejected">Rejected (अमान्य)</option>
          </select>
          <div className="flex rounded-xl border border-slate-200 p-0.5">
            {[
              { key: 'farmers', label: 'Farmer-wise', icon: Users },
              { key: 'list', label: 'All List', icon: LayoutList },
            ].map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => setView(v.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  view === v.key ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <v.icon className="h-3.5 w-3.5" />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading farmer applications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Users className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">
              {apps.length ? 'No applications match these filters.' : 'No farmer applications submitted yet.'}
            </p>
            <p className="text-xs text-slate-400">
              When a farmer taps “Submit Application” in the farmer app, it will appear here.
            </p>
          </div>
        ) : view === 'farmers' ? (
          <div className="space-y-3">
            {farmers.map(({ key, profile, apps: farmerApps }) => {
              const open = !collapsed.has(key);
              const pending = farmerApps.filter((a) => a.status === 'pending').length;
              const accepted = farmerApps.filter((a) => isAccepted(a.status)).length;
              const rejected = farmerApps.filter((a) => a.status === 'rejected').length;
              const location = farmerLocation(profile);
              return (
                <div key={key} className="overflow-hidden rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => toggleFarmer(key)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 bg-slate-50/80 px-4 py-3 text-left hover:bg-slate-100/70"
                  >
                    <div className="flex items-center gap-3">
                      {open ? (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      )}
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                        {(profile.farmerName || 'F').trim().charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{profile.farmerName || 'Farmer'}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {profile.farmerPhone || profile.farmerId || '—'}
                          </span>
                          {(location || profile.landAcres) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              {location}
                              {profile.landAcres ? `${location ? ' • ' : ''}${profile.landAcres} Acres` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-slate-700">
                        {farmerApps.length} {farmerApps.length === 1 ? 'application' : 'applications'}
                      </span>
                      {pending > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">{pending} pending</span>}
                      {accepted > 0 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">{accepted} accepted</span>
                      )}
                      {rejected > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-800">{rejected} rejected</span>}
                    </div>
                  </button>

                  {open && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-100">
                        <thead>
                          <tr>
                            <th className={TH}>Scheme Applied</th>
                            <th className={TH}>Submitted On</th>
                            <th className={TH}>Status</th>
                            <th className={TH}>Farmer / Admin Remarks</th>
                            <th className={`${TH} text-right`}>Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {farmerApps.map((app) => (
                            <tr key={app._id} className="hover:bg-slate-50/70">
                              <td className="px-3 py-3">{schemeCell(app)}</td>
                              <td className="px-3 py-3 text-xs text-slate-600">{formatDateTime(app.appliedAt || app.createdAt)}</td>
                              <td className="px-3 py-3">
                                <AppStatusBadge status={app.status} />
                              </td>
                              <td className="px-3 py-3">{remarksCell(app)}</td>
                              <td className="px-3 py-3">{actionButtons(app)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50/80">
                  <th className={TH}>Farmer</th>
                  <th className={TH}>Scheme Applied</th>
                  <th className={TH}>Submitted On</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Farmer / Admin Remarks</th>
                  <th className={`${TH} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((app) => {
                  const location = farmerLocation(app);
                  return (
                    <tr key={app._id} className="hover:bg-slate-50/70">
                      <td className="px-3 py-3">
                        <div className="min-w-[180px]">
                          <p className="text-sm font-bold text-slate-900">{app.farmerName || 'Farmer'}</p>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-600">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{app.farmerPhone || app.farmerId || '—'}</span>
                          </div>
                          {location && (
                            <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              <span>{location}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">{schemeCell(app)}</td>
                      <td className="px-3 py-3 text-xs text-slate-600">{formatDateTime(app.appliedAt || app.createdAt)}</td>
                      <td className="px-3 py-3">
                        <AppStatusBadge status={app.status} />
                      </td>
                      <td className="px-3 py-3">{remarksCell(app)}</td>
                      <td className="px-3 py-3">{actionButtons(app)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedApp && (
        <ApplicationStatusModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onSaved={() => load({ silent: true })}
        />
      )}
    </div>
  );
}
