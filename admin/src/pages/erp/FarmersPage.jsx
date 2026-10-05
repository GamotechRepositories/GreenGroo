import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building,
  Check,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Landmark,
  Leaf,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Tractor,
  Trash2,
  X,
} from 'lucide-react';
import erpApi from '../../api/erpApi';

const PAGE_SIZE = 25;

const INDIAN_STATES = [
  'Maharashtra',
  'Andhra Pradesh',
  'Gujarat',
  'Karnataka',
  'Madhya Pradesh',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
];

function splitIdTwoLines(id) {
  if (!id) return ['—'];
  const s = String(id).trim();
  const parts = s.split('-');
  if (parts.length >= 3) {
    const mid = Math.ceil(parts.length / 2);
    return [parts.slice(0, mid).join('-') + '-', parts.slice(mid).join('-')];
  }
  if (s.length > 10) {
    const mid = Math.ceil(s.length / 2);
    return [s.slice(0, mid), s.slice(mid)];
  }
  return [s];
}

export default function FarmersPage() {
  const [farmers, setFarmers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [managerFilter, setManagerFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [assigningFarmerId, setAssigningFarmerId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [farmerDetails, setFarmerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsTab, setDetailsTab] = useState('Overview');

  const [addForm, setAddForm] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '123456',
    farmName: '',
    farmLocation: '',
    managerId: '',
    status: 'Active',
    address: { village: '', taluka: '', district: '', state: 'Maharashtra', pincode: '' },
  });

  const requestSeq = useRef(0);

  const loadFarmers = () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    erpApi
      .farmers({
        q: searchQ,
        status: statusFilter,
        managerId: managerFilter,
        page,
        limit: PAGE_SIZE,
      })
      .then((res) => {
        if (seq !== requestSeq.current) return;
        const data = res.data;
        const rows = data.items || [];
        const count = data.total || rows.length;
        setFarmers(rows);
        setTotal(count);
      })
      .catch((err) => {
        console.error('Failed to load farmers', err);
      })
      .finally(() => {
        if (seq === requestSeq.current) setLoading(false);
      });
  };

  const loadManagers = () => {
    erpApi
      .farmerManagers()
      .then((res) => {
        const items = res.data.items || res.data || [];
        setManagers(items);
      })
      .catch(() => setManagers([]));
  };

  useEffect(() => {
    loadManagers();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQ(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    loadFarmers();
  }, [searchQ, statusFilter, managerFilter, page]);

  const handleCopyId = (e, text) => {
    e.preventDefault();
    e.stopPropagation();
    if (!text || text === '—') return;
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleOpenViewModal = (farmer) => {
    setSelectedFarmer(farmer);
    setFarmerDetails(null);
    setDetailsTab('Overview');
    setLoadingDetails(true);
    const fid = farmer.farmerId || farmer.id || farmer.sourceId;
    erpApi
      .farmer(fid)
      .then((res) => {
        setFarmerDetails(res.data);
      })
      .catch((err) => {
        console.error('Failed to load farmer full info', err);
      })
      .finally(() => {
        setLoadingDetails(false);
      });
  };

  const handleCloseViewModal = () => {
    setSelectedFarmer(null);
    setFarmerDetails(null);
  };

  const handleAssignManager = async (farmerId, managerId) => {
    setAssigningFarmerId(farmerId);
    try {
      await erpApi.assignFarmerManager(farmerId, managerId || '');
      loadFarmers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign manager');
    } finally {
      setAssigningFarmerId(null);
    }
  };

  const handleDeleteFarmer = async (farmer) => {
    const name = farmer.fullName || farmer.name || 'this farmer';
    const mobile = farmer.mobile ? ` (${farmer.mobile})` : '';
    const confirmMsg = `Are you sure you want to delete farmer "${name}"${mobile}?\nThis will remove all associated products, inventory, and records.`;
    if (!window.confirm(confirmMsg)) return;

    const fid = farmer.farmerId || farmer.id || farmer.sourceId;
    setDeletingId(fid);
    try {
      await erpApi.deleteFarmer(fid);
      loadFarmers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete farmer');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateFarmer = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.mobile) {
      setAddError('Farmer Name and Mobile Number are required');
      return;
    }
    if (addForm.mobile.trim().length !== 10) {
      setAddError('Mobile number must be 10 digits');
      return;
    }
    setSubmittingAdd(true);
    setAddError('');
    try {
      await erpApi.createFarmer(addForm);
      setShowAddModal(false);
      setAddForm({
        name: '',
        mobile: '',
        email: '',
        password: '123456',
        farmName: '',
        farmLocation: '',
        managerId: '',
        status: 'Active',
        address: { village: '', taluka: '', district: '', state: 'Maharashtra', pincode: '' },
      });
      loadFarmers();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add farmer');
    } finally {
      setSubmittingAdd(false);
    }
  };

  const STATUS_BADGE = (status) => {
    const s = String(status || 'Active').toLowerCase();
    const map = {
      active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      inactive: 'bg-gray-100 text-gray-700 border-gray-200',
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      rejected: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    const label = status || 'Active';
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize border ${
          map[s] || 'bg-gray-100 text-gray-700 border-gray-200'
        }`}
      >
        {label}
      </span>
    );
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startItem = total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endItem = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-3.5 p-4 sm:p-5">
      {/* Top Header & Actions in One Single Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">All Farmers</h1>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search farmer name or mobile…"
            className="w-56 max-w-xs rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#217346] focus:ring-1 focus:ring-[#217346]"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-[#217346] focus:ring-1 focus:ring-[#217346]"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending">Pending</option>
          </select>
          <select
            value={managerFilter}
            onChange={(e) => {
              setManagerFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-[#217346] focus:ring-1 focus:ring-[#217346]"
          >
            <option value="">All Managers</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setAddError('');
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#217346] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#1a5c38] transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Farmer
          </button>
        </div>
      </div>

      {/* Table - Responsive & Fits 1 Screen */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-xs">
        <table className="w-full table-fixed text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/90">
              {[
                { label: 'Farmer ID', width: 'w-[15%]' },
                { label: 'Farmer', width: 'w-[19%]' },
                { label: 'Mobile', width: 'w-[11%]' },
                { label: 'Farm', width: 'w-[10%]' },
                { label: 'Manager', width: 'w-[10%]' },
                { label: 'Products', width: 'w-[6%]' },
                { label: 'Status', width: 'w-[8%]' },
                { label: 'Assign Manager', width: 'w-[11%]' },
                { label: 'Action', width: 'w-[10%]' },
              ].map((h) => (
                <th
                  key={h.label}
                  className={`${h.width} px-2.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-700 truncate`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#217346]" />
                  <p className="mt-1.5 text-xs">Loading farmers…</p>
                </td>
              </tr>
            ) : farmers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-xs text-gray-400">
                  No farmers found
                </td>
              </tr>
            ) : (
              farmers.map((f) => {
                const fid = f.farmerId || f.id || f.sourceId;
                const name = f.fullName || f.name || 'Unnamed';
                const code = f.farmerCode || f.farmerId || f.id || '—';
                const initial =
                  f.initials ||
                  name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((s) => s[0])
                    .join('')
                    .toUpperCase() ||
                  'F';
                const productsVal = f.totalProducts ?? f.productCount ?? 0;

                return (
                  <tr key={fid} className="transition hover:bg-gray-50/80">
                    <td className="px-2.5 py-1.5 leading-tight">
                      <div className="group/id flex items-center justify-between gap-1">
                        <Link
                          to={`/erp/farmers/${encodeURIComponent(fid)}`}
                          className="inline-block font-mono text-[11px] font-semibold text-[#217346] hover:underline"
                          title={code}
                        >
                          {splitIdTwoLines(code).map((line, i) => (
                            <span key={i} className="block leading-snug">
                              {line}
                            </span>
                          ))}
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => handleCopyId(e, code)}
                          title={copiedId === code ? 'Copied!' : 'Copy Farmer ID'}
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-emerald-50 hover:text-[#217346] transition"
                        >
                          {copiedId === code ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-60 group-hover/id:opacity-100" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-2.5 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#E8F5E9] text-[10px] font-bold text-[#217346]">
                          {initial}
                        </div>
                        <Link
                          to={`/erp/farmers/${encodeURIComponent(fid)}`}
                          className="truncate text-xs font-semibold text-gray-900 hover:text-[#217346]"
                          title={name}
                        >
                          {name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-2.5 py-2 text-xs font-medium text-gray-800 truncate" title={f.mobile || '—'}>
                      {f.mobile || '—'}
                    </td>
                    <td className="px-2.5 py-2 text-xs text-gray-700">
                      <span className="block truncate" title={f.farmName || '—'}>
                        {f.farmName || '—'}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-xs text-gray-700">
                      <span className="block truncate" title={f.managerName || '—'}>
                        {f.managerName || '—'}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-center text-xs font-semibold text-gray-800">
                      {productsVal}
                    </td>
                    <td className="px-2.5 py-2">{STATUS_BADGE(f.status)}</td>
                    <td className="px-2.5 py-2">
                      <select
                        value={f.managerId || ''}
                        disabled={assigningFarmerId === fid}
                        onChange={(e) => handleAssignManager(fid, e.target.value)}
                        className="w-full truncate rounded border border-gray-300 bg-white px-1.5 py-1 text-[11px] font-medium text-gray-800 outline-none focus:border-[#217346] focus:ring-1 focus:ring-[#217346] disabled:opacity-50"
                      >
                        <option value="">Unassigned</option>
                        {managers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2.5 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenViewModal(f)}
                          title="View All Farmer Info"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#E8F5E9] text-[#217346] hover:bg-[#d5eed5] transition shadow-2xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === fid}
                          onClick={() => handleDeleteFarmer(f)}
                          title="Delete Farmer"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition shadow-2xs"
                        >
                          {deletingId === fid ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
          <span>
            Showing {startItem}–{endItem} of {total} farmers
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-gray-300 bg-white px-2.5 py-1 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="font-medium text-gray-700 px-1">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-gray-300 bg-white px-2.5 py-1 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* + Add Farmer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Add New Farmer</h3>
                <p className="text-xs text-gray-500">Create a new farmer profile in the registry</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {addError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateFarmer} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Farmer Name *</label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="e.g. Prajwal Nehe"
                    className="w-full border border-gray-200 px-3 py-1.5 outline-none focus:border-[#217346]"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={addForm.mobile}
                    onChange={(e) => setAddForm({ ...addForm, mobile: e.target.value.replace(/\D/g, '') })}
                    placeholder="10-digit mobile"
                    className="w-full border border-gray-200 px-3 py-1.5 outline-none focus:border-[#217346]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Email (Optional)</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="farmer@example.com"
                    className="w-full border border-gray-200 px-3 py-1.5 outline-none focus:border-[#217346]"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Farm Name</label>
                  <input
                    type="text"
                    value={addForm.farmName}
                    onChange={(e) => setAddForm({ ...addForm, farmName: e.target.value })}
                    placeholder="e.g. Krushna Farm"
                    className="w-full border border-gray-200 px-3 py-1.5 outline-none focus:border-[#217346]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Assign Manager</label>
                  <select
                    value={addForm.managerId}
                    onChange={(e) => setAddForm({ ...addForm, managerId: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-1.5 outline-none focus:border-[#217346]"
                  >
                    <option value="">Unassigned</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-gray-700">Status</label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-1.5 outline-none focus:border-[#217346]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <p className="mb-2 font-semibold text-gray-800">Location Details</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-gray-600">Village</label>
                    <input
                      type="text"
                      value={addForm.address.village}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          address: { ...addForm.address, village: e.target.value },
                        })
                      }
                      placeholder="Village name"
                      className="w-full border border-gray-200 px-3 py-1.5 outline-none focus:border-[#217346]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-gray-600">Taluka</label>
                    <input
                      type="text"
                      value={addForm.address.taluka}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          address: { ...addForm.address, taluka: e.target.value },
                        })
                      }
                      placeholder="Taluka"
                      className="w-full border border-gray-200 px-3 py-1.5 outline-none focus:border-[#217346]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-gray-600">District</label>
                    <input
                      type="text"
                      value={addForm.address.district}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          address: { ...addForm.address, district: e.target.value },
                        })
                      }
                      placeholder="District"
                      className="w-full border border-gray-200 px-3 py-1.5 outline-none focus:border-[#217346]"
                    />
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-gray-600">State</label>
                    <select
                      value={addForm.address.state}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          address: { ...addForm.address, state: e.target.value },
                        })
                      }
                      className="w-full border border-gray-200 px-3 py-1.5 outline-none focus:border-[#217346]"
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-gray-600">Pincode</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={addForm.address.pincode}
                      onChange={(e) =>
                        setAddForm({
                          ...addForm,
                          address: { ...addForm.address, pincode: e.target.value.replace(/\D/g, '') },
                        })
                      }
                      placeholder="6-digit pincode"
                      className="w-full border border-gray-200 px-3 py-1.5 outline-none focus:border-[#217346]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded border border-gray-200 px-3.5 py-1.5 font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="rounded bg-[#217346] px-4 py-1.5 font-semibold text-white hover:bg-[#1a5c38] disabled:opacity-50"
                >
                  {submittingAdd ? 'Saving…' : 'Save Farmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Farmer All Info Modal */}
      {selectedFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5 backdrop-blur-xs">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/90 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9] text-sm font-bold text-[#217346] shadow-xs">
                  {selectedFarmer.initials || selectedFarmer.name?.charAt(0) || 'F'}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                      {selectedFarmer.fullName || selectedFarmer.name}
                    </h2>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      {selectedFarmer.status || 'Active'}
                    </span>
                    {selectedFarmer.kycStatus ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-800">
                        KYC: {selectedFarmer.kycStatus}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-500">
                      {selectedFarmer.farmerCode || selectedFarmer.farmerId || selectedFarmer.id}
                    </span>
                    <button
                      type="button"
                      onClick={(e) =>
                        handleCopyId(
                          e,
                          selectedFarmer.farmerCode || selectedFarmer.farmerId || selectedFarmer.id
                        )
                      }
                      title="Copy Farmer ID"
                      className="text-gray-400 hover:text-[#217346]"
                    >
                      {copiedId ===
                      (selectedFarmer.farmerCode || selectedFarmer.farmerId || selectedFarmer.id) ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/erp/farmers/${encodeURIComponent(
                    selectedFarmer.farmerId || selectedFarmer.id || selectedFarmer.sourceId
                  )}`}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Open 360 Page
                  <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                </Link>
                <button
                  type="button"
                  onClick={handleCloseViewModal}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-gray-100 bg-white px-5">
              {['Overview', 'Farm & Location', 'Crops & Products', 'Documents & KYC'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDetailsTab(t)}
                  className={`border-b-2 px-3.5 py-2.5 text-xs font-semibold transition ${
                    detailsTab === t
                      ? 'border-[#217346] text-[#217346]'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 text-xs text-gray-700">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-14 text-gray-400">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#217346]" />
                  Loading complete details…
                </div>
              ) : (
                <>
                  {/* OVERVIEW TAB */}
                  {detailsTab === 'Overview' && (
                    <div className="space-y-4">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                        {[
                          {
                            label: 'Farms',
                            val: farmerDetails?.farms?.length ?? selectedFarmer.farmCount ?? 0,
                            icon: Tractor,
                          },
                          {
                            label: 'Crops',
                            val: farmerDetails?.crops?.length ?? selectedFarmer.cropCount ?? 0,
                            icon: Leaf,
                          },
                          {
                            label: 'Products',
                            val:
                              farmerDetails?.products?.length ??
                              selectedFarmer.totalProducts ??
                              selectedFarmer.productCount ??
                              0,
                            icon: Package,
                          },
                          {
                            label: 'Orders',
                            val: farmerDetails?.orders?.length ?? selectedFarmer.orderCount ?? 0,
                            icon: ShoppingCart,
                          },
                          {
                            label: 'Documents',
                            val:
                              farmerDetails?.documents?.length ?? selectedFarmer.documentCount ?? 0,
                            icon: FileText,
                          },
                          {
                            label: 'Earnings',
                            val: `₹${Number(
                              farmerDetails?.payments ??
                                selectedFarmer.totalEarnings ??
                                selectedFarmer.earnings ??
                                0
                            ).toLocaleString('en-IN')}`,
                            icon: Landmark,
                          },
                        ].map((s) => {
                          const Icon = s.icon;
                          return (
                            <div
                              key={s.label}
                              className="rounded-xl border border-gray-100 bg-gray-50/70 p-3"
                            >
                              <div className="flex items-center justify-between text-gray-400">
                                <span className="text-[10px] font-semibold uppercase">{s.label}</span>
                                <Icon className="h-3.5 w-3.5 text-[#217346]" />
                              </div>
                              <p className="mt-1 text-base font-bold text-gray-900">{s.val}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Info Sections */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Basic & Contact Info */}
                        <div className="rounded-xl border border-gray-200/80 bg-white p-4 space-y-3">
                          <h3 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                            <Phone className="h-3.5 w-3.5 text-[#217346]" /> Contact & Profile
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between border-b border-gray-50 pb-1.5">
                              <span className="text-gray-500">Full Name</span>
                              <span className="font-semibold text-gray-800">
                                {farmerDetails?.farmer?.fullName || selectedFarmer.fullName || selectedFarmer.name}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 pb-1.5">
                              <span className="text-gray-500">Mobile</span>
                              <span className="font-semibold text-gray-800">
                                {farmerDetails?.farmer?.mobile || selectedFarmer.mobile || '—'}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 pb-1.5">
                              <span className="text-gray-500">Email</span>
                              <span className="text-gray-800">
                                {farmerDetails?.farmer?.email || selectedFarmer.email || '—'}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 pb-1.5">
                              <span className="text-gray-500">Vendor</span>
                              <span className="text-gray-800">
                                {farmerDetails?.farmer?.vendorName || selectedFarmer.vendorName || 'GreenGroo Master'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Registered On</span>
                              <span className="text-gray-700">
                                {selectedFarmer.createdAt
                                  ? new Date(selectedFarmer.createdAt).toLocaleDateString('en-IN')
                                  : '—'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Farm & Manager Info */}
                        <div className="rounded-xl border border-gray-200/80 bg-white p-4 space-y-3">
                          <h3 className="font-bold text-gray-900 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                            <Tractor className="h-3.5 w-3.5 text-[#217346]" /> Farm & Manager
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between border-b border-gray-50 pb-1.5">
                              <span className="text-gray-500">Farm Name</span>
                              <span className="font-semibold text-gray-800">
                                {farmerDetails?.farmer?.farmName || selectedFarmer.farmName || '—'}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 pb-1.5">
                              <span className="text-gray-500">Location</span>
                              <span className="text-gray-800">
                                {[
                                  farmerDetails?.farmer?.village || selectedFarmer.village,
                                  farmerDetails?.farmer?.taluka || selectedFarmer.taluka,
                                  farmerDetails?.farmer?.district || selectedFarmer.district,
                                ]
                                  .filter(Boolean)
                                  .join(', ') || '—'}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 pb-1.5">
                              <span className="text-gray-500">Assigned Manager</span>
                              <span className="font-semibold text-[#217346]">
                                {farmerDetails?.farmer?.managerName || selectedFarmer.managerName || 'Unassigned'}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 pb-1.5">
                              <span className="text-gray-500">KYC Status</span>
                              <span className="font-semibold text-gray-800">
                                {farmerDetails?.farmer?.kycStatus || selectedFarmer.kycStatus || 'Pending'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Bank Status</span>
                              <span className="font-semibold text-gray-800">
                                {farmerDetails?.farmer?.bankStatus || selectedFarmer.bankStatus || 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* FARM & LOCATION TAB */}
                  {detailsTab === 'Farm & Location' && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <h4 className="font-bold text-gray-900 mb-3">Address & Geographical Details</h4>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          <div className="rounded-lg bg-gray-50 p-2.5">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase">Village</span>
                            <p className="mt-0.5 font-semibold text-gray-800">
                              {farmerDetails?.farmer?.village || selectedFarmer.village || '—'}
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-2.5">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase">Taluka</span>
                            <p className="mt-0.5 font-semibold text-gray-800">
                              {farmerDetails?.farmer?.taluka || selectedFarmer.taluka || '—'}
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-2.5">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase">District</span>
                            <p className="mt-0.5 font-semibold text-gray-800">
                              {farmerDetails?.farmer?.district || selectedFarmer.district || '—'}
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-2.5">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase">State</span>
                            <p className="mt-0.5 font-semibold text-gray-800">
                              {farmerDetails?.farmer?.state || selectedFarmer.state || 'Maharashtra'}
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-2.5">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase">Pincode</span>
                            <p className="mt-0.5 font-semibold text-gray-800">
                              {farmerDetails?.farmer?.pincode || '—'}
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-2.5">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase">Farm Name</span>
                            <p className="mt-0.5 font-semibold text-gray-800">
                              {farmerDetails?.farmer?.farmName || selectedFarmer.farmName || '—'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Farms List */}
                      {farmerDetails?.farms?.length ? (
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                          <h4 className="font-bold text-gray-900 mb-2">Registered Farms ({farmerDetails.farms.length})</h4>
                          <div className="divide-y divide-gray-100">
                            {farmerDetails.farms.map((fm) => (
                              <div key={fm._id || fm.farmId} className="py-2.5 flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-gray-800">{fm.farmName || 'Farm Record'}</p>
                                  <p className="text-[11px] text-gray-400 font-mono">{fm.farmId}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-gray-700">{fm.area ? `${fm.area} ${fm.areaUnit || 'Acre'}` : 'Area N/A'}</p>
                                  <p className="text-[11px] text-gray-500">{fm.soilType || fm.farmType || 'Natural'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* CROPS & PRODUCTS TAB */}
                  {detailsTab === 'Crops & Products' && (
                    <div className="space-y-4">
                      {/* Crops */}
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                          <Leaf className="h-4 w-4 text-[#217346]" /> Active Crops ({farmerDetails?.crops?.length || 0})
                        </h4>
                        {!farmerDetails?.crops?.length ? (
                          <p className="text-gray-400 py-3">No active crops registered for this farmer.</p>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {farmerDetails.crops.map((c) => (
                              <div key={c._id || c.cropId || c.id} className="py-2 flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-gray-800">{c.cropName || c.name}</p>
                                  <p className="text-[11px] text-gray-400">{c.variety || 'Standard'} · {c.category || 'Veg'}</p>
                                </div>
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                  {c.status || 'Active'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Products */}
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                          <Package className="h-4 w-4 text-[#217346]" /> Products Catalog ({farmerDetails?.products?.length || 0})
                        </h4>
                        {!farmerDetails?.products?.length ? (
                          <p className="text-gray-400 py-3">No products cataloged for this farmer.</p>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {farmerDetails.products.map((p) => (
                              <div key={p._id || p.productId || p.id} className="py-2 flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-gray-800">{p.productName || p.name}</p>
                                  <p className="text-[11px] text-gray-400">Stock: {p.stock ?? 0} {p.unit || 'Kg'}</p>
                                </div>
                                <span className="font-semibold text-[#217346]">
                                  ₹{p.price || p.basePrice || 0}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DOCUMENTS & KYC TAB */}
                  {detailsTab === 'Documents & KYC' && (
                    <div className="space-y-4">
                      {/* Bank info */}
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                          <Landmark className="h-4 w-4 text-[#217346]" /> Bank Account Verification
                        </h4>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-lg bg-gray-50 p-2.5">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase">Account Holder</span>
                            <p className="mt-0.5 font-semibold text-gray-800">
                              {farmerDetails?.farmer?.bankAccount?.accountHolder || selectedFarmer.fullName || '—'}
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-2.5">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase">Bank Name</span>
                            <p className="mt-0.5 font-semibold text-gray-800">
                              {farmerDetails?.farmer?.bankAccount?.bankName || '—'}
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-2.5">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase">Account Number</span>
                            <p className="mt-0.5 font-mono text-gray-800">
                              {farmerDetails?.farmer?.bankAccount?.accountNumber ? `••••${String(farmerDetails.farmer.bankAccount.accountNumber).slice(-4)}` : '—'}
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-2.5">
                            <span className="text-[10px] text-gray-400 font-semibold uppercase">IFSC Code</span>
                            <p className="mt-0.5 font-mono text-gray-800">
                              {farmerDetails?.farmer?.bankAccount?.ifsc || '—'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Documents */}
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-[#217346]" /> Submitted Documents ({farmerDetails?.documents?.length || 0})
                        </h4>
                        {!farmerDetails?.documents?.length ? (
                          <p className="text-gray-400 py-3">No documents uploaded yet.</p>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {farmerDetails.documents.map((doc) => (
                              <div key={doc._id || doc.documentId || doc.id} className="py-2.5 flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-gray-800">{doc.documentType || doc.title || 'Farmer Document'}</p>
                                  <p className="text-[11px] text-gray-400">{doc.documentNumber || 'Doc Record'}</p>
                                </div>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    doc.status === 'Approved'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : doc.status === 'Rejected'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {doc.status || 'Pending'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/80 px-5 py-3">
              <Link
                to={`/erp/farmers/${encodeURIComponent(
                  selectedFarmer.farmerId || selectedFarmer.id || selectedFarmer.sourceId
                )}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#217346] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1a5c38] transition"
              >
                Open Complete 360 Profile
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={handleCloseViewModal}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
