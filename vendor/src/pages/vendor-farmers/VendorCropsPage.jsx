import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Search,
  Sprout,
  User,
} from "lucide-react";
import { vendorApi } from "../../api/vendorApi";
import CopyId, { CopyButton } from "../../components/ui/CopyId";

const PANEL = "rounded-xl border border-gray-200 bg-white shadow-sm";
const INPUT =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#217346]";

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
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
}

export default function VendorCropsPage() {
  const [farmers, setFarmers] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [expandedFarmers, setExpandedFarmers] = useState(new Set());
  const [deleteModal, setDeleteModal] = useState({ open: false, crop: null });
  const [deleting, setDeleting] = useState(false);

  const loadCrops = async () => {
    try {
      const res = await vendorApi.getCrops();
      const data = res?.data || res;
      const farmerList = Array.isArray(data?.farmers) ? data.farmers : [];
      const list = Array.isArray(data) ? data : data?.crops || [];
      setFarmers(farmerList);
      setCrops(list);
      const ids = new Set();
      farmerList.forEach((f) => {
        if (f.id) ids.add(f.id);
        if (f.farmerId) ids.add(f.farmerId);
      });
      list.forEach((c) => {
        if (c.farmerId) ids.add(c.farmerId);
      });
      setExpandedFarmers(ids);
    } catch (err) {
      toast.error(err.message || "Failed to load crops");
      setFarmers([]);
      setCrops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCrops();
  }, []);

  const getFarmerInfo = (farmerId) => {
    const f = farmers.find((item) => item.id === farmerId || item.farmerId === farmerId || item.farmerCode === farmerId);
    return {
      id: f?.id || farmerId,
      name: f?.name || f?.farmerName || "Farmer",
      mobile: f?.mobile || f?.phone || "",
      farmLocation: f?.farmLocation || f?.farmName || f?.location || "",
      farmerCode: f?.farmerCode || f?.farmerId || f?.id || farmerId,
    };
  };

  const filteredCrops = useMemo(() => {
    const q = search.trim().toLowerCase();
    return crops.filter((crop) => {
      const fid = crop.farmerId || crop.farmer_id || "";
      if (selectedFarmerId && fid !== selectedFarmerId) {
        const farmer = farmers.find((f) => f.id === selectedFarmerId || f.farmerId === selectedFarmerId);
        const aliases = [farmer?.id, farmer?.farmerId, farmer?.farmerCode].filter(Boolean);
        if (!aliases.includes(fid)) return false;
      }
      if (!q) return true;
      const fInfo = getFarmerInfo(fid);
      const cId = formatCropBusinessId(crop);
      return [
        crop.cropName,
        crop.name,
        crop.variety,
        crop.season,
        crop.category,
        cId,
        fInfo.name,
        fInfo.farmerCode,
        fInfo.mobile,
        crop.farmerName,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [crops, farmers, search, selectedFarmerId]);

  const farmerGroups = useMemo(() => {
    const map = new Map();
    filteredCrops.forEach((crop) => {
      const rawId = crop.farmerId || crop.farmer_id || "other";
      const fInfo = getFarmerInfo(rawId);
      const fid = fInfo.id || rawId;
      if (!map.has(fid)) {
        map.set(fid, {
          farmerId: fid,
          farmerName: crop.farmerName || fInfo.name || "Farmer",
          mobile: crop.farmerMobile || fInfo.mobile,
          farmLocation: crop.farmerLocation || fInfo.farmLocation,
          farmerCode: crop.farmerCode || fInfo.farmerCode,
          crops: [],
        });
      }
      map.get(fid).crops.push(crop);
    });
    return Array.from(map.values()).sort((a, b) => b.crops.length - a.crops.length || a.farmerName.localeCompare(b.farmerName));
  }, [filteredCrops, farmers]);

  const toggleFarmerExpand = (farmerId) => {
    setExpandedFarmers((prev) => {
      const next = new Set(prev);
      if (next.has(farmerId)) next.delete(farmerId);
      else next.add(farmerId);
      return next;
    });
  };

  const expandAll = () => setExpandedFarmers(new Set(farmerGroups.map((g) => g.farmerId)));
  const collapseAll = () => setExpandedFarmers(new Set());

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
      <div className="space-y-4 p-4 sm:space-y-5 sm:p-6 lg:p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-20 w-48 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Farmer Crops</h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              Farmer-Wise
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Each farmer and the crops they are growing.</p>
        </div>
        <Link
          to="/vendor/farmer-crops/add"
          className="inline-flex h-9 items-center justify-center rounded-xl bg-[#217346] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#1a5c38]"
        >
          + Add Crop
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <div className={`${PANEL} border-l-4 border-l-blue-600 p-3 sm:p-4`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-500">Farmers with crops</span>
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-1 text-xl font-extrabold text-slate-800 sm:text-2xl">{farmerGroups.length}</p>
        </div>
        <div className={`${PANEL} border-l-4 border-l-emerald-600 p-3 sm:p-4`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-500">Total crops</span>
            <Sprout className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-1 text-xl font-extrabold text-emerald-700 sm:text-2xl">{filteredCrops.length}</p>
        </div>
        <div className={`${PANEL} col-span-2 border-l-4 border-l-[#217346] p-3 sm:col-span-1 sm:p-4`}>
          <span className="text-[11px] font-medium text-gray-500">Registered farmers</span>
          <p className="mt-1 text-xl font-extrabold text-[#217346] sm:text-2xl">{farmers.length}</p>
        </div>
      </div>

      <div className={`${PANEL} p-3 sm:p-4 space-y-3`}>
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search farmer name, crop, variety, or crop ID…"
              className={`${INPUT} pl-9`}
            />
          </div>
          <select
            value={selectedFarmerId}
            onChange={(e) => setSelectedFarmerId(e.target.value)}
            className={`${INPUT} lg:w-64`}
          >
            <option value="">All farmers ({farmers.length})</option>
            {farmers.map((f) => (
              <option key={f.id || f.farmerId} value={f.id || f.farmerId}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5 border-t border-gray-100 pt-2.5 text-[11px] text-gray-500">
          <button type="button" onClick={expandAll} className="hover:text-emerald-700 hover:underline">
            Expand All
          </button>
          <span>·</span>
          <button type="button" onClick={collapseAll} className="hover:text-emerald-700 hover:underline">
            Collapse All
          </button>
        </div>
      </div>

      {crops.length === 0 ? (
        <div className={`${PANEL} p-12 text-center`}>
          <Sprout className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-base font-semibold text-gray-800">No crops added yet</p>
          <p className="mt-1 text-xs text-gray-500">Crops appear here farmer-wise after a farmer adds them and you approve the request.</p>
          <Link
            to="/vendor/farmer-crop-requests"
            className="mt-4 inline-flex text-xs font-semibold text-[#217346] hover:underline"
          >
            View crop requests
          </Link>
        </div>
      ) : farmerGroups.length === 0 ? (
        <div className={`${PANEL} p-8 text-center`}>
          <p className="text-sm font-semibold text-gray-700">No matching farmers</p>
          <p className="mt-1 text-xs text-gray-500">Try a different search or farmer filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {farmerGroups.map((group) => {
            const isExpanded = expandedFarmers.has(group.farmerId);
            return (
              <div
                key={group.farmerId}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-gray-300"
              >
                <div
                  onClick={() => toggleFarmerExpand(group.farmerId)}
                  className="flex cursor-pointer flex-col gap-2.5 bg-gradient-to-r from-emerald-50/50 via-white to-gray-50/60 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#217346] text-base font-bold text-white shadow-sm">
                      {String(group.farmerName || "F").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/vendor/all-farmers/${group.farmerId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-bold text-slate-900 hover:text-[#217346] hover:underline"
                        >
                          {group.farmerName}
                        </Link>
                        <CopyId
                          value={group.farmerCode || group.farmerId}
                          className="shrink-0"
                          textClassName="font-mono text-[10px] text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded font-semibold"
                        />
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                        {group.mobile ? (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {group.mobile}
                          </span>
                        ) : null}
                        {group.farmLocation ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            {group.farmLocation}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2.5 sm:justify-end">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700">
                        {group.crops.length} {group.crops.length === 1 ? "Crop" : "Crops"}
                      </span>
                      {group.crops.slice(0, 3).map((crop) => (
                        <span
                          key={cropKey(crop)}
                          className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-100 sm:inline"
                        >
                          {crop.cropName}
                          {crop.variety ? ` · ${crop.variety}` : ""}
                        </span>
                      ))}
                      {group.crops.length > 3 ? (
                        <span className="hidden text-[10px] font-semibold text-gray-500 sm:inline">+{group.crops.length - 3}</span>
                      ) : null}
                    </div>
                    <button type="button" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="border-t border-gray-100">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-bold text-gray-600">
                            <th className="px-3.5 py-2.5">Crop</th>
                            <th className="px-3.5 py-2.5">Variety</th>
                            <th className="px-3.5 py-2.5">Crop ID</th>
                            <th className="px-3.5 py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {group.crops.map((crop) => {
                            const id = cropKey(crop);
                            const fId = group.farmerId;
                            const cropIdLabel = formatCropBusinessId(crop);
                            const viewUrl = `/vendor/all-farmers/${encodeURIComponent(fId)}/crops/${encodeURIComponent(id)}`;
                            const editUrl = `${viewUrl}/edit`;
                            return (
                              <tr key={id} className="hover:bg-slate-50/60">
                                <td className="px-3.5 py-2.5">
                                  <div className="flex items-center gap-2.5">
                                    <CropPhoto
                                      src={crop.media?.mainPhoto || crop.photos?.[0] || crop.image}
                                      name={crop.cropName || crop.name}
                                      className="h-9 w-9 shrink-0 rounded-lg border border-slate-200"
                                    />
                                    <span className="font-bold text-slate-900">{crop.cropName || crop.name || "Crop"}</span>
                                  </div>
                                </td>
                                <td className="px-3.5 py-2.5">
                                  {crop.variety ? (
                                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 ring-1 ring-emerald-100">
                                      {crop.variety}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                                <td className="px-3.5 py-2.5">
                                  <div className="flex items-center gap-1">
                                    <span className="font-mono text-[10px] text-emerald-800">{cropIdLabel}</span>
                                    <CopyButton value={cropIdLabel} className="h-3.5 w-3.5 text-slate-400" />
                                  </div>
                                </td>
                                <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                                  <Link
                                    to={viewUrl}
                                    className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    View
                                  </Link>
                                  <Link
                                    to={editUrl}
                                    className="ml-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    Edit
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteModal({ open: true, crop: { ...crop, farmerId: fId } })}
                                    className="ml-1 rounded border border-red-200 bg-white px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {deleteModal.open && deleteModal.crop ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDeleteModal({ open: false, crop: null })}
        >
          <div className="w-full max-w-md space-y-4 rounded-xl bg-white p-5 text-xs shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-[#1F2937]">Delete Crop</h3>
              <button type="button" className="text-gray-400 hover:text-gray-600" onClick={() => setDeleteModal({ open: false, crop: null })}>
                ✕
              </button>
            </div>
            <p className="text-slate-700">
              Delete{" "}
              <strong className="text-slate-900">
                {deleteModal.crop.cropName || deleteModal.crop.name}
              </strong>
              {deleteModal.crop.variety ? ` (${deleteModal.crop.variety})` : ""}?
            </p>
            <p className="rounded-lg border border-red-100 bg-red-50 p-2.5 text-red-600">
              This will remove the crop record and any linked crop planning data.
            </p>
            <div className="flex items-center justify-end gap-2 border-t pt-2">
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
      ) : null}
    </div>
  );
}
