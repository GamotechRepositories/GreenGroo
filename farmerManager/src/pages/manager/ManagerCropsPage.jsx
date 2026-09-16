import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getManagerAllCrops,
  deleteManagerFarmerCrop,
} from "../../api/farmerApi";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import CopyId, { CopyButton } from "../../components/ui/CopyId";
import {
  EXCEL_BTN,
  EXCEL_BTN_DANGER,
  EXCEL_BTN_PRIMARY,
  EXCEL_CELL,
  EXCEL_HEAD,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_TABLE,
  EXCEL_WRAP,
} from "../../utils/excelStyles";
import {
  formatCropBusinessId,
} from "../../utils/cropLinks";

function cropKey(crop) {
  return crop.cropId || crop.id;
}

function CropPhoto({ src, name, className }) {
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

function farmerIdOf(crop) {
  return String(crop.farmerId || crop.farmer_id || "").trim();
}

function ManagerCropsPage() {
  const navigate = useNavigate();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState({ open: false, crop: null });
  const [deleting, setDeleting] = useState(false);

  const loadCrops = async () => {
    try {
      const res = await getManagerAllCrops();
      const list = Array.isArray(res) ? res : res?.crops || [];
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
    return { total: crops.length };
  }, [crops]);

  const filteredCrops = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return crops;
    return crops.filter((crop) => {
      const cId = formatCropBusinessId(crop);
      const values = [
        crop.cropName,
        crop.name,
        crop.variety,
        crop.season,
        cId,
      ].filter(Boolean);

      return values.some((v) => String(v).toLowerCase().includes(q));
    });
  }, [crops, search]);

  const handleDelete = async () => {
    if (!deleteModal.crop) return;
    const { farmerId, id, cropId: cId } = deleteModal.crop;
    const targetCropId = cId || id;
    setDeleting(true);
    try {
      await deleteManagerFarmerCrop(farmerId, targetCropId);
      toast.success("Crop deleted successfully");
      setDeleteModal({ open: false, crop: null });
      loadCrops();
    } catch (err) {
      toast.error(err.message || "Failed to delete crop");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingState rows={8} />;

  return (
    <div className="space-y-4 p-4 sm:space-y-5 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>All Crops</h1>
          <p className={EXCEL_PAGE_SUB}>
            Manage and track all crops registered in the system.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/manager/crops/add"
            className={`${EXCEL_BTN_PRIMARY} inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold shadow-sm`}
          >
            <span>+ Add Crop</span>
          </Link>
        </div>
      </div>

      {/* Stat Card & Search Bar in One Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm min-w-[180px]">
          <span className="text-[11px] font-normal uppercase tracking-wider text-slate-500">Total Registered Crops</span>
          <p className="mt-0.5 text-xl font-bold text-slate-900">{stats.total}</p>
        </div>

        <div className="w-full sm:max-w-md">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm focus-within:border-[#217346]">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search crop, variety, ID…"
              className="w-full bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-xs text-gray-500 hover:text-gray-700 font-semibold shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Crops List */}
      {crops.length === 0 ? (
        <EmptyState
          title="No crops added yet"
          description="Click + Add Crop to record a farmer's crop details."
          action={
            <Link to="/manager/crops/add" className={`${EXCEL_BTN_PRIMARY} mt-2`}>
              + Add Crop
            </Link>
          }
        />
      ) : filteredCrops.length === 0 ? (
        <EmptyState title="No matching crops" description="Try adjusting your search options." />
      ) : (
        <div className="space-y-2">
          {/* Mobile View: Cards */}
          <div className="block lg:hidden space-y-3">
            {filteredCrops.map((crop) => {
              const id = cropKey(crop);
              const fId = farmerIdOf(crop);
              const cropIdLabel = formatCropBusinessId(crop);
              const viewUrl = fId ? `/manager/farmers/${encodeURIComponent(fId)}/crops/${encodeURIComponent(id)}` : `/manager/crops`;
              const editUrl = fId ? `/manager/farmers/${encodeURIComponent(fId)}/crops/${encodeURIComponent(id)}/edit` : `/manager/crops/add`;

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
                        <h3 className="text-sm font-bold text-slate-900 truncate">{crop.cropName || crop.name || "Crop"}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {crop.variety && (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-medium text-emerald-800 border border-emerald-200">
                              {crop.variety}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-[10.5px] text-slate-500">{cropIdLabel}</span>
                            <CopyButton value={cropIdLabel} className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    </div>
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
                <col className="w-[32%]" />
                <col className="w-[28%]" />
                <col className="w-[20%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead className="bg-[#E8F0EA] sticky top-0 z-10 border-b border-[#9CA3AF]">
                <tr>
                  <th className="border border-[#9CA3AF] px-2 py-2 text-center text-xs font-semibold text-[#374151]">#</th>
                  <th className="border border-[#9CA3AF] px-3 py-2 text-left text-xs font-semibold text-[#374151]">Crop</th>
                  <th className="border border-[#9CA3AF] px-3 py-2 text-left text-xs font-semibold text-[#374151]">Variety</th>
                  <th className="border border-[#9CA3AF] px-2 py-2 text-center text-xs font-semibold text-[#374151]">Crop ID</th>
                  <th className="border border-[#9CA3AF] px-2 py-2 text-center text-xs font-semibold text-[#374151]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCrops.map((crop, idx) => {
                  const id = cropKey(crop);
                  const fId = farmerIdOf(crop);
                  const cropIdLabel = formatCropBusinessId(crop);
                  const viewUrl = fId ? `/manager/farmers/${encodeURIComponent(fId)}/crops/${encodeURIComponent(id)}` : `/manager/crops`;
                  const editUrl = fId ? `/manager/farmers/${encodeURIComponent(fId)}/crops/${encodeURIComponent(id)}/edit` : `/manager/crops/add`;
                  const zebra = idx % 2 === 0 ? "bg-white hover:bg-emerald-50/60" : "bg-[#F9FAFB] hover:bg-emerald-50/60";

                  return (
                    <tr key={id} className={`transition-colors ${zebra}`}>
                      <td className="border border-[#9CA3AF] px-2 py-2 text-center text-slate-400 font-normal">{idx + 1}</td>
                      <td className="border border-[#9CA3AF] px-3 py-2 text-left">
                        <div className="flex items-center gap-2.5">
                          <CropPhoto
                            src={crop.media?.mainPhoto || crop.image}
                            name={crop.cropName || crop.name}
                            className="h-8 w-8 shrink-0 rounded border border-slate-200"
                          />
                          <span className="font-semibold text-slate-900 text-xs truncate">
                            {crop.cropName || crop.name || "Crop"}
                          </span>
                        </div>
                      </td>
                      <td className="border border-[#9CA3AF] px-3 py-2 text-left">
                        {crop.variety ? (
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-200 inline-block">
                            {crop.variety}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="border border-[#9CA3AF] px-2 py-2 text-center font-mono text-[11px] text-slate-600">
                        <div className="flex items-center justify-center gap-1">
                          <span className="truncate">{cropIdLabel}</span>
                          <CopyButton value={cropIdLabel} className="h-3.5 w-3.5 text-slate-400" />
                        </div>
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
        <Modal
          title="Delete Crop"
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, crop: null })}
        >
          <div className="space-y-4 text-xs">
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
            <div className="flex items-center justify-end gap-2 pt-2">
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
        </Modal>
      )}
    </div>
  );
}

export default ManagerCropsPage;
