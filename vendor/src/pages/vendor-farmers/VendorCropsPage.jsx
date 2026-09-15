import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { vendorApi } from "../../api/vendorApi";
import CopyId, { CopyButton } from "../../components/ui/CopyId";

const PANEL = "rounded-xl border border-gray-200 bg-white shadow-sm";
const INPUT =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#217346]";

function cropKey(crop) {
  return crop.cropId || crop.id;
}

function formatCropBusinessId(crop) {
  const raw = crop?.cropId || crop?.id || "";
  const str = String(raw).trim();
  if (!str) return "—";
  if (!/^[a-f0-9]{24}$/i.test(str)) return str;
  return `CRP-${str.slice(-6).toUpperCase()}`;
}

function CropPhoto({ src, name, className = "" }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className={`flex items-center justify-center bg-emerald-50 text-emerald-800 ${className}`}>
        <span className="text-sm font-bold">{String(name || "Crop").slice(0, 1).toUpperCase()}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name || "Crop"}
      className={`object-cover ${className}`}
      onError={() => setBroken(true)}
    />
  );
}

function StatusBadge({ status = "Growing" }) {
  const s = String(status || "").toLowerCase();
  if (s === "growing") {
    return <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200/60">Growing</span>;
  }
  if (s === "harvested") {
    return <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">Harvested</span>;
  }
  if (s === "planned") {
    return <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200/60">Planned</span>;
  }
  return <span className="rounded bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-700 border border-gray-200">{status}</span>;
}

export default function VendorCropsPage() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState({ open: false, crop: null });
  const [deleting, setDeleting] = useState(false);

  const loadCrops = async () => {
    try {
      const res = await vendorApi.getCrops();
      const data = res?.data || res;
      const list = Array.isArray(data) ? data : data?.crops || [];
      setCrops(list);
    } catch (err) {
      toast.error(err.message || "Failed to load crops");
      setCrops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrops();
  }, []);

  const stats = useMemo(() => {
    const total = crops.length;
    let growing = 0;
    let harvested = 0;
    let planned = 0;
    crops.forEach((c) => {
      const s = String(c.status || "").toLowerCase();
      if (s === "growing") growing += 1;
      else if (s === "harvested") harvested += 1;
      else if (s === "planned") planned += 1;
    });
    return { total, growing, harvested, planned };
  }, [crops]);

  const filteredCrops = useMemo(() => {
    const q = search.trim().toLowerCase();
    return crops.filter((crop) => {
      if (statusFilter !== "all" && String(crop.status || "").toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (!q) return true;

      const cId = formatCropBusinessId(crop);
      const values = [
        crop.cropName,
        crop.name,
        crop.variety,
        crop.season,
        crop.status,
        cId,
      ].filter(Boolean);

      return values.some((v) => String(v).toLowerCase().includes(q));
    });
  }, [crops, search, statusFilter]);

  const handleDelete = async () => {
    if (!deleteModal.crop) return;
    const { farmerId, id, cropId: cId } = deleteModal.crop;
    const targetCropId = cId || id;
    setDeleting(true);
    try {
      await vendorApi.deleteFarmerCrop(farmerId, targetCropId);
      toast.success("Crop deleted successfully");
      setDeleteModal({ open: false, crop: null });
      loadCrops();
    } catch (err) {
      toast.error(err.message || "Failed to delete crop");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Crops</h1>
          <p className="text-xs text-gray-500">
            Manage and track all crops registered in the system.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/vendor/crops/add"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#217346] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1B5E38] transition-colors"
          >
            <span>+ Add Crop</span>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <span className="text-[11px] font-normal uppercase tracking-wider text-gray-500">Total Crops</span>
          <p className="mt-0.5 text-xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 shadow-sm">
          <span className="text-[11px] font-normal uppercase tracking-wider text-blue-700">🌱 Growing</span>
          <p className="mt-0.5 text-xl font-bold text-blue-900">{stats.growing}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 shadow-sm">
          <span className="text-[11px] font-normal uppercase tracking-wider text-emerald-700">🌾 Harvested</span>
          <p className="mt-0.5 text-xl font-bold text-emerald-900">{stats.harvested}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 shadow-sm">
          <span className="text-[11px] font-normal uppercase tracking-wider text-amber-700">📅 Planned</span>
          <p className="mt-0.5 text-xl font-bold text-amber-900">{stats.planned}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className={`${PANEL} p-3 space-y-3`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search crop, variety, ID…"
              className={`${INPUT} max-w-md`}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-xs text-gray-500 hover:text-gray-700 font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mr-1">Status:</span>
          {[
            { id: "all", label: "All" },
            { id: "growing", label: "Growing" },
            { id: "harvested", label: "Harvested" },
            { id: "planned", label: "Planned" },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  active
                    ? "bg-[#217346] text-white shadow-sm"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
          {(statusFilter !== "all" || search) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setSearch("");
              }}
              className="text-xs text-red-600 hover:underline font-semibold ml-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Crops List */}
      {crops.length === 0 ? (
        <div className={`${PANEL} p-8 text-center`}>
          <p className="text-sm font-semibold text-gray-700">No crops added yet</p>
          <p className="text-xs text-gray-500 mt-1">Click + Add Crop to record a farmer's crop details.</p>
          <Link
            to="/vendor/crops/add"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#217346] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1B5E38] transition-colors mt-3"
          >
            + Add Crop
          </Link>
        </div>
      ) : filteredCrops.length === 0 ? (
        <div className={`${PANEL} p-8 text-center`}>
          <p className="text-sm font-semibold text-gray-700">No matching crops</p>
          <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filter options.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Mobile View: Cards */}
          <div className="block lg:hidden space-y-3">
            {filteredCrops.map((crop) => {
              const id = cropKey(crop);
              const fId = crop.farmerId || crop.farmer_id || "";
              const cropIdLabel = formatCropBusinessId(crop);
              const viewUrl = fId ? `/vendor/all-farmers/${encodeURIComponent(fId)}/crops/${encodeURIComponent(id)}` : `/vendor/crops`;
              const editUrl = fId ? `/vendor/all-farmers/${encodeURIComponent(fId)}/crops/${encodeURIComponent(id)}/edit` : `/vendor/crops/add`;

              return (
                <div
                  key={id}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2.5 shadow-sm hover:border-emerald-500 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CropPhoto
                        src={crop.media?.mainPhoto || crop.image}
                        name={crop.cropName || crop.name}
                        className="h-10 w-10 shrink-0 rounded-lg border border-slate-200"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 truncate">{crop.cropName || crop.name || "Crop"}</h3>
                          {crop.variety && (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10.5px] font-normal text-emerald-800 border border-emerald-200">
                              {crop.variety}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-[10.5px] text-slate-500">{cropIdLabel}</span>
                          <CopyButton value={cropIdLabel} className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={crop.status || "Growing"} />
                  </div>

                  <div className="flex items-center justify-end gap-1.5 text-xs pt-2 border-t border-slate-100 bg-slate-50/60 -mx-3.5 -mb-3.5 p-3 rounded-b-xl">
                    <Link
                      to={viewUrl}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      View
                    </Link>
                    <Link
                      to={editUrl}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteModal({ open: true, crop })}
                      className="rounded border border-red-200 bg-white px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop View: Full Spreadsheet Table */}
          <div className="hidden lg:block overflow-hidden border border-[#9CA3AF] rounded-lg bg-white shadow-sm">
            <table className="w-full table-fixed border-collapse text-xs">
              <colgroup>
                <col className="w-[6%]" />
                <col className="w-[44%]" />
                <col className="w-[22%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead className="bg-[#E8F0EA] sticky top-0 z-10 border-b border-[#9CA3AF]">
                <tr>
                  <th className="border border-[#9CA3AF] px-2 py-2 text-center text-xs font-semibold text-[#374151]">#</th>
                  <th className="border border-[#9CA3AF] px-2.5 py-2 text-left text-xs font-semibold text-[#374151]">Crop & Variety</th>
                  <th className="border border-[#9CA3AF] px-2 py-2 text-center text-xs font-semibold text-[#374151]">Crop ID</th>
                  <th className="border border-[#9CA3AF] px-2 py-2 text-center text-xs font-semibold text-[#374151]">Status</th>
                  <th className="border border-[#9CA3AF] px-2 py-2 text-center text-xs font-semibold text-[#374151]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCrops.map((crop, idx) => {
                  const id = cropKey(crop);
                  const fId = crop.farmerId || crop.farmer_id || "";
                  const cropIdLabel = formatCropBusinessId(crop);
                  const viewUrl = fId ? `/vendor/all-farmers/${encodeURIComponent(fId)}/crops/${encodeURIComponent(id)}` : `/vendor/crops`;
                  const editUrl = fId ? `/vendor/all-farmers/${encodeURIComponent(fId)}/crops/${encodeURIComponent(id)}/edit` : `/vendor/crops/add`;
                  const zebra = idx % 2 === 0 ? "bg-white hover:bg-emerald-50/60" : "bg-[#F9FAFB] hover:bg-emerald-50/60";

                  return (
                    <tr key={id} className={`transition-colors ${zebra}`}>
                      <td className="border border-[#9CA3AF] px-2 py-2 text-center text-slate-400 font-normal">{idx + 1}</td>
                      <td className="border border-[#9CA3AF] px-2.5 py-2 text-left">
                        <div className="flex items-center gap-2">
                          <CropPhoto
                            src={crop.media?.mainPhoto || crop.image}
                            name={crop.cropName || crop.name}
                            className="h-8 w-8 shrink-0 rounded border border-slate-200"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              <p className="font-normal text-slate-900 text-xs truncate">{crop.cropName || crop.name}</p>
                              {crop.variety && (
                                <span className="rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-normal text-emerald-800 border border-emerald-200">
                                  {crop.variety}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="border border-[#9CA3AF] px-2 py-2 text-center font-mono text-[11px] text-slate-600">
                        <div className="flex items-center justify-center gap-1">
                          <span className="truncate">{cropIdLabel}</span>
                          <CopyButton value={cropIdLabel} className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </td>
                      <td className="border border-[#9CA3AF] px-2 py-2 text-center">
                        <StatusBadge status={crop.status || "Growing"} />
                      </td>
                      <td className="border border-[#9CA3AF] px-2 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            to={viewUrl}
                            className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            View
                          </Link>
                          <Link
                            to={editUrl}
                            className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteModal({ open: true, crop })}
                            title="Delete Crop"
                            className="rounded border border-red-200 bg-white px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.crop && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDeleteModal({ open: false, crop: null })}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-[#1F2937]">Delete Crop</h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => setDeleteModal({ open: false, crop: null })}
              >
                ✕
              </button>
            </div>
            <p className="text-slate-700">
              Are you sure you want to delete crop{" "}
              <strong className="text-slate-900">
                {deleteModal.crop.cropName || deleteModal.crop.name}
              </strong>{" "}
              ({deleteModal.crop.variety || "General"})?
            </p>
            <p className="text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
              ⚠️ This will remove the crop record and any linked crop planning data.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, crop: null })}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete Crop"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
