import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  cancelManagerCropRequest,
  deleteManagerFarmerCrop,
  getManagerAllCrops,
  getManagerMyCrops,
} from "../../api/farmerApi";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
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
  createManagerProductPath,
  formatCropBusinessId,
  managerCropPath,
} from "../../utils/cropLinks";

const STATUS_STYLES = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Rejected: "border-red-200 bg-red-50 text-red-600",
  Cancelled: "border-slate-200 bg-slate-50 text-slate-500",
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function cropKey(crop) {
  return crop.cropId || crop.id;
}

function farmerIdOf(crop) {
  return String(crop.farmerId || crop.farmer_id || "").trim();
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
      loading="lazy"
      decoding="async"
      className={`object-cover ${className}`}
      onError={() => setBroken(true)}
    />
  );
}

function groupByFarmer(list) {
  const map = new Map();
  for (const crop of list) {
    const key = farmerIdOf(crop) || crop.farmerName || "unknown";
    if (!map.has(key)) {
      map.set(key, { farmerId: farmerIdOf(crop), farmerName: crop.farmerName || "Farmer", items: [] });
    }
    map.get(key).items.push(crop);
  }
  return Array.from(map.values()).sort((a, b) => a.farmerName.localeCompare(b.farmerName));
}

function ManagerMyCropsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalog, setCatalog] = useState([]);
  const [requests, setRequests] = useState([]);
  const [plantings, setPlantings] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteCrop, setDeleteCrop] = useState(null);
  const selectedFarmerId = searchParams.get("farmerId") || "";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mine, planted] = await Promise.all([getManagerMyCrops(), getManagerAllCrops()]);
      setCatalog(mine?.crops || []);
      setRequests(mine?.requests || []);
      setPlantings(Array.isArray(planted) ? planted : planted?.crops || []);
      setFarmers(Array.isArray(planted?.farmers) ? planted.farmers : []);
    } catch (err) {
      toast.error(err.message || "Failed to load My Crops");
      setCatalog([]);
      setRequests([]);
      setPlantings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredPlantings = useMemo(() => {
    if (!selectedFarmerId) return plantings;
    return plantings.filter((crop) => farmerIdOf(crop) === selectedFarmerId);
  }, [plantings, selectedFarmerId]);

  const groups = useMemo(() => groupByFarmer(filteredPlantings), [filteredPlantings]);
  const pendingCount = requests.filter((row) => row.status === "Pending").length;
  const addPath = selectedFarmerId
    ? `/manager/farmers/${encodeURIComponent(selectedFarmerId)}/crops/add`
    : "/manager/crops/add";

  const cancelRequest = async (request) => {
    if (!window.confirm(`Cancel the request for "${request.cropName}"?`)) return;
    try {
      await cancelManagerCropRequest(request.id);
      toast.success("Request cancelled");
      await load();
    } catch (err) {
      toast.error(err.message || "Failed to cancel request");
    }
  };

  const onDelete = async () => {
    if (!deleteCrop) return;
    try {
      await deleteManagerFarmerCrop(farmerIdOf(deleteCrop), cropKey(deleteCrop));
      toast.success("Crop deleted");
      setDeleteCrop(null);
      await load();
    } catch (err) {
      toast.error(err.message || "Failed to delete crop");
    }
  };

  return (
    <div className="w-full min-w-0 space-y-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className={EXCEL_PAGE_TITLE}>My Crops</h1>
          <p className={`${EXCEL_PAGE_SUB} hidden sm:block`}>
            Crops the collection centre accepted for you. Add them to a farmer after approval.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link to="/manager/crops" className={`${EXCEL_BTN} h-9 px-3 text-sm sm:h-10 sm:px-4`}>
            All Crops
          </Link>
          <Link to={addPath} className={`${EXCEL_BTN_PRIMARY} h-9 px-3 text-sm sm:h-10 sm:px-4`}>
            Add Crop
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingState rows={6} />
      ) : (
        <>
          <section className={EXCEL_WRAP}>
            <div className="border-b border-slate-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-emerald-800">
              Approved Crops ({catalog.length})
            </div>
            {catalog.length === 0 ? (
              <div className="px-4 py-8">
                <EmptyState
                  title="No approved crops yet"
                  description="Request a crop from All Crops. After the collection centre accepts it, it will appear here."
                  action={
                    <Link to="/manager/crops" className={EXCEL_BTN_PRIMARY}>
                      Request from All Crops
                    </Link>
                  }
                />
              </div>
            ) : (
              <table className={EXCEL_TABLE}>
                <thead>
                  <tr>
                    <th className={EXCEL_HEAD}>Crop</th>
                    <th className={EXCEL_HEAD}>Variety</th>
                    <th className={`${EXCEL_HEAD} hidden sm:table-cell`}>Category</th>
                    <th className={`${EXCEL_HEAD} hidden md:table-cell`}>Approved</th>
                  </tr>
                </thead>
                <tbody>
                  {catalog.map((crop) => (
                    <tr key={crop.cropId || crop.id}>
                      <td className={EXCEL_CELL}>
                        <p className="font-semibold text-slate-900">{crop.cropName}</p>
                        <p className="font-mono text-[10px] text-emerald-700">{crop.cropId}</p>
                      </td>
                      <td className={EXCEL_CELL}>{crop.variety || "—"}</td>
                      <td className={`${EXCEL_CELL} hidden sm:table-cell`}>{crop.category || "—"}</td>
                      <td className={`${EXCEL_CELL} hidden md:table-cell`}>{formatDate(crop.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className={EXCEL_WRAP}>
            <div className="border-b border-slate-100 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-emerald-800">
              My Requests ({requests.length}){pendingCount ? ` · ${pendingCount} pending` : ""}
            </div>
            {requests.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">No requests sent yet.</p>
            ) : (
              <table className={EXCEL_TABLE}>
                <thead>
                  <tr>
                    <th className={EXCEL_HEAD}>Crop</th>
                    <th className={`${EXCEL_HEAD} hidden sm:table-cell`}>Sent</th>
                    <th className={EXCEL_HEAD}>Status</th>
                    <th className={`${EXCEL_HEAD} hidden md:table-cell`}>Remarks</th>
                    <th className={EXCEL_HEAD} />
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="align-top">
                      <td className={EXCEL_CELL}>
                        <p className="font-semibold text-slate-900">
                          {request.cropName}
                          {request.variety ? <span className="font-normal text-slate-500"> · {request.variety}</span> : null}
                        </p>
                        {request.notes ? <p className="text-[10px] text-slate-500">Note: {request.notes}</p> : null}
                      </td>
                      <td className={`${EXCEL_CELL} hidden sm:table-cell`}>{formatDate(request.createdAt)}</td>
                      <td className={EXCEL_CELL}>
                        <span
                          className={`inline-block rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${
                            STATUS_STYLES[request.status] || STATUS_STYLES.Cancelled
                          }`}
                        >
                          {request.status === "Pending" ? "Pending approval" : request.status}
                        </span>
                      </td>
                      <td className={`${EXCEL_CELL} hidden md:table-cell`}>{request.vendorRemarks || "—"}</td>
                      <td className={`${EXCEL_CELL} text-right`}>
                        {request.status === "Pending" ? (
                          <button
                            type="button"
                            onClick={() => cancelRequest(request)}
                            className="text-[11px] font-semibold text-red-600 hover:underline"
                          >
                            Cancel
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-800">Farmer plantings</h2>
              <select
                className={`${EXCEL_INPUT} max-w-xs`}
                value={selectedFarmerId}
                onChange={(e) => {
                  const next = new URLSearchParams(searchParams);
                  if (e.target.value) next.set("farmerId", e.target.value);
                  else next.delete("farmerId");
                  setSearchParams(next, { replace: true });
                }}
              >
                <option value="">All Farmers</option>
                {farmers.map((farmer) => (
                  <option key={farmer.id || farmer.farmerId} value={farmer.id || farmer.farmerId}>
                    {farmer.name}
                  </option>
                ))}
              </select>
            </div>

            {groups.length === 0 ? (
              <EmptyState
                title="No farmer crops yet"
                description="After a crop is approved in My Crops, add it for a farmer."
                action={
                  <Link to={addPath} className={EXCEL_BTN_PRIMARY}>
                    Add Crop
                  </Link>
                }
              />
            ) : (
              groups.map((group) => (
                <section key={group.farmerId || group.farmerName} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={group.farmerId ? `/manager/farmers/${encodeURIComponent(group.farmerId)}` : "/manager/farmers"}
                      className="text-sm font-bold text-[#217346] hover:underline"
                    >
                      {group.farmerName}
                    </Link>
                    <span className="text-[11px] text-slate-500">
                      {group.items.length} crop{group.items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((crop) => {
                      const id = cropKey(crop);
                      const farmerId = farmerIdOf(crop);
                      return (
                        <article key={`${group.farmerId}-${id}`} className={`${EXCEL_PANEL} p-2.5`}>
                          <div className="flex items-center gap-2.5">
                            <CropPhoto
                              src={crop.photos?.[0] || crop.media?.mainPhoto || crop.image}
                              name={crop.cropName || crop.name}
                              className="h-14 w-14 shrink-0 rounded-xl"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {crop.cropName}
                                {crop.variety ? <span className="font-normal text-slate-500"> · {crop.variety}</span> : null}
                              </p>
                              <p className="font-mono text-[10px] text-emerald-700">{formatCropBusinessId(crop)}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <Link to={managerCropPath(farmerId, id)} className={`${EXCEL_BTN} h-8 px-2.5 text-[11px]`}>
                              View
                            </Link>
                            <Link to={managerCropPath(farmerId, id, "/edit")} className={`${EXCEL_BTN} h-8 px-2.5 text-[11px]`}>
                              Edit
                            </Link>
                            <Link to={createManagerProductPath(farmerId, crop)} className={`${EXCEL_BTN_PRIMARY} h-8 px-2.5 text-[11px]`}>
                              Product
                            </Link>
                            <button
                              type="button"
                              className={`${EXCEL_BTN_DANGER} h-8 px-2.5 text-[11px]`}
                              onClick={() => setDeleteCrop(crop)}
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </section>
        </>
      )}

      <Modal
        open={Boolean(deleteCrop)}
        title="Delete crop?"
        onClose={() => setDeleteCrop(null)}
        footer={
          <>
            <button type="button" className={EXCEL_BTN} onClick={() => setDeleteCrop(null)}>
              Cancel
            </button>
            <button type="button" className={EXCEL_BTN_DANGER} onClick={onDelete}>
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          {deleteCrop ? `${deleteCrop.cropName || "This crop"} will be removed from ${deleteCrop.farmerName || "the farmer"}.` : ""}
        </p>
      </Modal>
    </div>
  );
}

export default ManagerMyCropsPage;
