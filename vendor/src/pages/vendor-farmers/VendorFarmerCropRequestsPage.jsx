import { useCallback, useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Phone,
  RefreshCw,
  Search,
  Sprout,
  X,
  XCircle,
} from "lucide-react";
import { vendorApi } from "../../api/vendorApi";
import CopyId from "../../components/ui/CopyId";

const PANEL = "rounded-xl border border-gray-200 bg-white shadow-sm";
const INPUT =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#217346]";

const FILTERS = ["Pending", "Approved", "Rejected", "all"];

const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-800 ring-amber-200",
  Approved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Rejected: "bg-red-50 text-red-700 ring-red-200",
};

function cropLabel(row) {
  return `${row.cropName || "Crop"}${row.variety ? ` · ${row.variety}` : ""}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function VendorFarmerCropRequestsPage() {
  const [crops, setCrops] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [status, setStatus] = useState("Pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState("");
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await vendorApi.getFarmerCropRequests({ status });
      const data = res.data || {};
      setCrops(Array.isArray(data.crops) ? data.crops : []);
      setStats(data.stats || { pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load crop requests");
      setCrops([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return crops;
    return crops.filter((row) =>
      [
        row.cropName,
        row.variety,
        row.category,
        row.cropId,
        row.farmerName,
        row.farmerCode,
        row.farmerMobile,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [crops, search]);

  const approve = async (row) => {
    const farmerId = row.farmerId || row.farmerCode;
    const cropId = row.id || row.cropId;
    if (!farmerId || !cropId) return;
    setBusyId(cropId);
    setError("");
    try {
      await vendorApi.reviewFarmerCrop(farmerId, cropId, "approve");
      setToast(`Approved ${cropLabel(row)} for ${row.farmerName || "farmer"}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not approve crop request");
    } finally {
      setBusyId("");
    }
  };

  const submitReject = async (event) => {
    event.preventDefault();
    if (!rejecting) return;
    const farmerId = rejecting.farmerId || rejecting.farmerCode;
    const cropId = rejecting.id || rejecting.cropId;
    setBusyId(cropId);
    setError("");
    try {
      await vendorApi.reviewFarmerCrop(farmerId, cropId, "reject", reason);
      setToast(`Rejected ${cropLabel(rejecting)}`);
      setRejecting(null);
      setReason("");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not reject crop request");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="space-y-4 p-4 sm:space-y-5 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Farmer Crop Requests</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Crops your farmers added from the crop section wait here until you approve them.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {toast ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toast}</span>
          <button type="button" onClick={() => setToast("")} className="ml-auto text-emerald-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2.5">
        <div className={`${PANEL} border-l-4 border-l-amber-500 p-3`}>
          <div className="flex items-center justify-between text-[11px] font-medium text-amber-800">
            Pending
            <Clock className="h-4 w-4" />
          </div>
          <p className="mt-1 text-xl font-extrabold text-amber-600">{stats.pending}</p>
        </div>
        <div className={`${PANEL} border-l-4 border-l-emerald-600 p-3`}>
          <div className="flex items-center justify-between text-[11px] font-medium text-gray-500">
            Approved
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-1 text-xl font-extrabold text-emerald-700">{stats.approved}</p>
        </div>
        <div className={`${PANEL} border-l-4 border-l-red-500 p-3`}>
          <div className="flex items-center justify-between text-[11px] font-medium text-gray-500">
            Rejected
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
          <p className="mt-1 text-xl font-extrabold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      <div className={`${PANEL} flex flex-col gap-3 p-3 sm:flex-row sm:items-center`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search farmer, crop, variety, or crop ID"
            className={`${INPUT} pl-9`}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize ${
                status === item ? "bg-[#217346] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {item}
              {item === "Pending" && stats.pending ? ` (${stats.pending})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className={PANEL}>
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-[#217346]" />
            <p className="mt-3 text-sm font-medium">Loading crop requests…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Sprout className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-base font-semibold text-gray-800">No crop requests</p>
            <p className="mt-1 text-xs text-gray-500">
              {crops.length === 0
                ? "When a farmer adds a crop, the request will appear here for approval."
                : "Try a different search or status filter."}
            </p>
            <Link to="/vendor/farmer-crops" className="mt-4 inline-flex text-xs font-semibold text-[#217346] hover:underline">
              View farmer crops
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2.5">Farmer</th>
                  <th className="px-4 py-2.5">Crop</th>
                  <th className="px-4 py-2.5">Variety</th>
                  <th className="px-4 py-2.5">Requested</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const cropId = row.id || row.cropId;
                  const isBusy = busyId === cropId;
                  const approval = row.approvalStatus || "Pending";
                  return (
                    <tr key={cropId} className="border-t border-gray-100 hover:bg-gray-50/70">
                      <td className="px-4 py-3">
                        <Link
                          to={`/vendor/all-farmers/${encodeURIComponent(row.farmerId || "")}`}
                          className="font-bold text-slate-900 hover:text-[#217346] hover:underline"
                        >
                          {row.farmerName || "Farmer"}
                        </Link>
                        <div className="mt-0.5">
                          <CopyId
                            value={row.farmerCode || row.farmerId}
                            textClassName="font-mono text-[10px] text-emerald-800"
                          />
                        </div>
                        {row.farmerMobile ? (
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-500">
                            <Phone className="h-3 w-3" />
                            {row.farmerMobile}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{row.cropName}</p>
                        <p className="font-mono text-[10px] text-emerald-700">{row.cropId || row.id}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{row.variety || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(row.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${STATUS_STYLES[approval] || STATUS_STYLES.Pending}`}>
                          {approval}
                        </span>
                        {row.rejectionReason ? (
                          <p className="mt-0.5 max-w-[160px] truncate text-[10px] text-red-600" title={row.rejectionReason}>
                            {row.rejectionReason}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {approval === "Pending" ? (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => approve(row)}
                              className="inline-flex h-7 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
                            >
                              {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => {
                                setRejecting(row);
                                setReason("");
                              }}
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 text-[11px] font-bold text-red-700 hover:bg-red-100 disabled:opacity-40"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <Link
                            to={`/vendor/all-farmers/${encodeURIComponent(row.farmerId || "")}/crops/${encodeURIComponent(cropId)}`}
                            className="text-[11px] font-semibold text-[#217346] hover:underline"
                          >
                            View crop
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejecting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitReject} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Reject crop request?</h3>
            <p className="mt-1 text-sm text-gray-600">
              {cropLabel(rejecting)} from {rejecting.farmerName || "this farmer"} will not be added to farmer crops.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Reason (optional)"
              className={`${INPUT} mt-3`}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejecting(null)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                Reject request
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
