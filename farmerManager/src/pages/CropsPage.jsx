import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteManagerFarmerCrop, getManagerAllCrops } from "../api/farmerApi";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
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
} from "../utils/excelStyles";
import {
  createManagerProductPath,
  formatCropDate,
  formatCropBusinessId,
  managerCropPath,
} from "../utils/cropLinks";

const ACTION =
  "inline-flex h-7 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-1 text-[10px] font-semibold text-slate-700 whitespace-nowrap hover:bg-slate-50";
const ACTION_PRIMARY =
  "inline-flex h-7 w-full items-center justify-center rounded-md border border-emerald-700 bg-emerald-700 px-1 text-[10px] font-semibold text-white whitespace-nowrap hover:bg-emerald-800";
const ACTION_DANGER =
  "inline-flex h-7 w-full items-center justify-center rounded-md border border-red-100 bg-white px-1 text-[10px] font-semibold text-red-600 whitespace-nowrap hover:bg-red-50";
const DESKTOP_BTN =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 whitespace-nowrap hover:bg-slate-50";
const DESKTOP_BTN_PRIMARY =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-emerald-700 bg-emerald-700 px-2.5 text-[11px] font-semibold text-white whitespace-nowrap hover:bg-emerald-800";
const DESKTOP_BTN_DANGER =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-white px-2.5 text-[11px] font-semibold text-red-600 whitespace-nowrap hover:bg-red-50";
const ACTION_COL = "w-[268px] min-w-[268px]";

function cropKey(crop) {
  return crop.cropId || crop.id;
}

function farmerIdOf(crop) {
  return String(crop.farmerId || crop.farmer_id || "").trim();
}

function CropIdLabel({ crop, className = "" }) {
  const id = formatCropBusinessId(crop);
  return (
    <p className={`font-mono font-semibold tracking-wide text-emerald-700 ${className}`} title={id}>
      {id}
    </p>
  );
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

function CropActions({ crop, onDelete, compact = false }) {
  const id = cropKey(crop);
  const farmerId = farmerIdOf(crop);
  const view = managerCropPath(farmerId, id);
  const edit = managerCropPath(farmerId, id, "/edit");
  const product = createManagerProductPath(farmerId, crop);
  if (compact) {
    return (
      <div className="mt-2 grid grid-cols-4 gap-1">
        <Link to={view} className={ACTION}>View</Link>
        <Link to={edit} className={ACTION}>Edit</Link>
        <Link to={product} className={ACTION_PRIMARY}>Product</Link>
        <button type="button" className={ACTION_DANGER} onClick={() => onDelete(crop)}>Delete</button>
      </div>
    );
  }
  return (
    <div className="flex flex-nowrap items-center justify-end gap-1">
      <Link to={view} className={DESKTOP_BTN}>View</Link>
      <Link to={edit} className={DESKTOP_BTN}>Edit</Link>
      <Link to={product} className={DESKTOP_BTN_PRIMARY}>Product</Link>
      <button type="button" className={DESKTOP_BTN_DANGER} onClick={() => onDelete(crop)}>Delete</button>
    </div>
  );
}

function groupByFarmer(list) {
  const map = new Map();
  for (const crop of list) {
    const key = farmerIdOf(crop) || crop.farmerName || "unknown";
    if (!map.has(key)) {
      map.set(key, {
        farmerId: farmerIdOf(crop),
        farmerName: crop.farmerName || "Farmer",
        items: [],
      });
    }
    map.get(key).items.push(crop);
  }
  return Array.from(map.values()).sort((a, b) => a.farmerName.localeCompare(b.farmerName));
}

function CropsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [crops, setCrops] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteCrop, setDeleteCrop] = useState(null);
  const selectedFarmerId = searchParams.get("farmerId") || "";

  const load = async () => {
    setLoading(true);
    try {
      const res = await getManagerAllCrops();
      setCrops(Array.isArray(res) ? res : res?.crops || []);
      setFarmers(Array.isArray(res?.farmers) ? res.farmers : []);
    } catch (err) {
      toast.error(err.message || "Failed to load crops");
      setCrops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!selectedFarmerId) return crops;
    return crops.filter((c) => farmerIdOf(c) === selectedFarmerId);
  }, [crops, selectedFarmerId]);

  const groups = useMemo(() => groupByFarmer(filtered), [filtered]);

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

  const addPath = selectedFarmerId
    ? `/manager/farmers/${encodeURIComponent(selectedFarmerId)}/crops/add`
    : "/manager/crops/add";

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className={EXCEL_PAGE_TITLE}>My Crops</h1>
          <p className={`${EXCEL_PAGE_SUB} hidden sm:block`}>
            Crops shown farmer-wise. Adding a crop saves it on that farmer only.
          </p>
        </div>
        <Link to={addPath} className={`${EXCEL_BTN_PRIMARY} h-9 shrink-0 px-3 text-sm sm:h-10 sm:px-4`}>
          Add Crop
        </Link>
      </div>

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
        {farmers.map((f) => (
          <option key={f.id || f.farmerId} value={f.id || f.farmerId}>
            {f.name}
          </option>
        ))}
      </select>

      {loading ? (
        <LoadingState rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No crops yet"
          description="Select a farmer and add a crop, same as the farmer app."
          action={
            <Link to={addPath} className={EXCEL_BTN_PRIMARY}>
              Add Crop
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.farmerId || group.farmerName} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Link
                  to={group.farmerId ? `/manager/farmers/${encodeURIComponent(group.farmerId)}` : "/manager/farmers"}
                  className="text-sm font-bold text-[#217346] hover:underline"
                >
                  {group.farmerName}
                </Link>
                <span className="text-[11px] text-slate-500">{group.items.length} crop{group.items.length === 1 ? "" : "s"}</span>
              </div>
              <div className="space-y-2 lg:hidden">
                {group.items.map((crop) => {
                  const id = cropKey(crop);
                  return (
                    <article key={`${group.farmerId}-${id}`} className={`${EXCEL_PANEL} p-2.5`}>
                      <div className="flex items-center gap-2.5">
                        <CropPhoto
                          src={crop.photos?.[0] || crop.media?.mainPhoto || crop.image}
                          name={crop.cropName || crop.name}
                          className="h-14 w-14 shrink-0 rounded-xl"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 truncate text-[13px] font-bold text-slate-900">
                              {crop.cropName || crop.name}
                              {crop.variety ? <span className="font-medium text-slate-500"> · {crop.variety}</span> : null}
                            </p>
                            <StatusBadge status={crop.status} className="max-w-[46%] shrink-0" />
                          </div>
                          <CropIdLabel crop={crop} className="truncate text-[10px]" />
                          <p className="mt-0.5 truncate text-[10px] text-slate-500">
                            {formatCropDate(crop.sowingDate)} → {formatCropDate(crop.expectedHarvestDate)}
                          </p>
                        </div>
                      </div>
                      <CropActions crop={crop} compact onDelete={setDeleteCrop} />
                    </article>
                  );
                })}
              </div>
              <div className={`${EXCEL_WRAP} hidden min-w-0 lg:block`}>
                <table className={`${EXCEL_TABLE} w-full min-w-[980px]`}>
                  <thead>
                    <tr>
                      {["Crop", "Crop ID", "Variety", "Sowing", "Harvest", "Status"].map((h) => (
                        <th key={h} className={`${EXCEL_HEAD} whitespace-nowrap`}>{h}</th>
                      ))}
                      <th className={`${EXCEL_HEAD} ${ACTION_COL} sticky right-0 z-20 whitespace-nowrap border-l border-slate-200 bg-slate-50 text-right`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((crop) => (
                      <tr key={`row-${group.farmerId}-${cropKey(crop)}`} className="group align-middle hover:bg-slate-50">
                        <td className={EXCEL_CELL}>
                          <div className="flex items-center gap-2.5">
                            <CropPhoto
                              src={crop.photos?.[0] || crop.media?.mainPhoto || crop.image}
                              name={crop.cropName || crop.name}
                              className="h-9 w-9 shrink-0 rounded-lg"
                            />
                            <span className="truncate font-semibold text-slate-900">{crop.cropName || crop.name}</span>
                          </div>
                        </td>
                        <td className={EXCEL_CELL}>
                          <CropIdLabel crop={crop} className="whitespace-nowrap text-[11px]" />
                        </td>
                        <td className={`${EXCEL_CELL} whitespace-nowrap`}>{crop.variety || "—"}</td>
                        <td className={`${EXCEL_CELL} whitespace-nowrap`}>{formatCropDate(crop.sowingDate)}</td>
                        <td className={`${EXCEL_CELL} whitespace-nowrap`}>{formatCropDate(crop.expectedHarvestDate)}</td>
                        <td className={EXCEL_CELL}><StatusBadge status={crop.status} /></td>
                        <td className={`${EXCEL_CELL} ${ACTION_COL} sticky right-0 z-10 border-l border-slate-200 bg-white group-hover:bg-slate-50`}>
                          <CropActions crop={crop} onDelete={setDeleteCrop} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(deleteCrop)}
        title="Delete crop?"
        onClose={() => setDeleteCrop(null)}
        footer={
          <>
            <button type="button" className={EXCEL_BTN} onClick={() => setDeleteCrop(null)}>Cancel</button>
            <button type="button" className={EXCEL_BTN_DANGER} onClick={onDelete}>Delete</button>
          </>
        }
      >
        <p>This will also remove the crop plan for this farmer. This cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default CropsPage;
