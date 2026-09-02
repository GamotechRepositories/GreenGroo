import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteCrop, getCrops } from "../api/farmerApi";
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
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_TABLE,
  EXCEL_WRAP,
} from "../utils/excelStyles";
import { createProductPath, formatCropDate, formatCropBusinessId } from "../utils/cropLinks";

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
      className={`object-cover ${className}`}
      onError={() => setBroken(true)}
    />
  );
}

function CropActions({ crop, onDelete, compact = false }) {
  const id = cropKey(crop);
  if (compact) {
    return (
      <div className="mt-2 grid grid-cols-4 gap-1">
        <Link to={`/farmer/crops/${id}`} className={ACTION}>
          View
        </Link>
        <Link to={`/farmer/crops/${id}/edit`} className={ACTION}>
          Edit
        </Link>
        <Link to={createProductPath(crop)} className={ACTION_PRIMARY}>
          Product
        </Link>
        <button type="button" className={ACTION_DANGER} onClick={() => onDelete(id)}>
          Delete
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-nowrap items-center justify-end gap-1">
      <Link to={`/farmer/crops/${id}`} className={DESKTOP_BTN}>
        View
      </Link>
      <Link to={`/farmer/crops/${id}/edit`} className={DESKTOP_BTN}>
        Edit
      </Link>
      <Link to={createProductPath(crop)} className={DESKTOP_BTN_PRIMARY}>
        Product
      </Link>
      <button type="button" className={DESKTOP_BTN_DANGER} onClick={() => onDelete(id)}>
        Delete
      </button>
    </div>
  );
}

function CropsPage() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setCrops(await getCrops());
    } catch (err) {
      toast.error(err.message || "Failed to load crops");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async () => {
    try {
      await deleteCrop(deleteId);
      toast.success("Crop deleted");
      setDeleteId("");
      await load();
    } catch (err) {
      toast.error(err.message || "Failed to delete crop");
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className={EXCEL_PAGE_TITLE}>My Crops</h1>
          <p className={`${EXCEL_PAGE_SUB} hidden sm:block`}>Crops linked to your farm. Create a product after planning harvest.</p>
        </div>
        <Link to="/farmer/crops/add" className={`${EXCEL_BTN_PRIMARY} h-9 shrink-0 px-3 text-sm sm:h-10 sm:px-4`}>
          Add Crop
        </Link>
      </div>

      {loading ? (
        <LoadingState rows={6} />
      ) : crops.length === 0 ? (
        <EmptyState
          title="No crops yet"
          description="Add your first crop to start crop planning."
          action={
            <Link to="/farmer/crops/add" className={EXCEL_BTN_PRIMARY}>
              Add Crop
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-2 lg:hidden">
            {crops.map((crop) => {
              const id = cropKey(crop);
              return (
                <article key={id} className={`${EXCEL_PANEL} p-2.5`}>
                  <div className="flex items-center gap-2.5">
                    <CropPhoto
                      src={crop.photos?.[0]}
                      name={crop.cropName}
                      className="h-14 w-14 shrink-0 rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-[13px] font-bold text-slate-900">
                          {crop.cropName}
                          {crop.variety ? (
                            <span className="font-medium text-slate-500"> · {crop.variety}</span>
                          ) : null}
                        </p>
                        <StatusBadge status={crop.status} className="max-w-[46%] shrink-0" />
                      </div>
                      <CropIdLabel crop={crop} className="truncate text-[10px]" />
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">
                        {formatCropDate(crop.sowingDate)} → {formatCropDate(crop.expectedHarvestDate)}
                      </p>
                    </div>
                  </div>
                  <CropActions crop={crop} compact onDelete={setDeleteId} />
                </article>
              );
            })}
          </div>

          <div className={`${EXCEL_WRAP} hidden min-w-0 lg:block`}>
            <table className={`${EXCEL_TABLE} w-full min-w-[980px]`}>
              <colgroup>
                <col className="w-[200px]" />
                <col className="w-[240px]" />
                <col className="w-[110px]" />
                <col className="w-[120px]" />
                <col className="w-[120px]" />
                <col className="w-[150px]" />
                <col className="w-[268px]" />
              </colgroup>
              <thead>
                <tr>
                  {["Crop", "Crop ID", "Variety", "Sowing", "Harvest", "Status"].map((h) => (
                    <th key={h} className={`${EXCEL_HEAD} whitespace-nowrap`}>
                      {h}
                    </th>
                  ))}
                  <th className={`${EXCEL_HEAD} ${ACTION_COL} sticky right-0 z-20 whitespace-nowrap border-l border-slate-200 bg-slate-50 text-right`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {crops.map((crop) => (
                  <tr key={`row-${cropKey(crop)}`} className="group align-middle hover:bg-slate-50">
                    <td className={EXCEL_CELL}>
                      <div className="flex items-center gap-2.5">
                        <CropPhoto
                          src={crop.photos?.[0]}
                          name={crop.cropName}
                          className="h-9 w-9 shrink-0 rounded-lg"
                        />
                        <span className="truncate font-semibold text-slate-900">{crop.cropName}</span>
                      </div>
                    </td>
                    <td className={EXCEL_CELL}>
                      <CropIdLabel crop={crop} className="whitespace-nowrap text-[11px]" />
                    </td>
                    <td className={`${EXCEL_CELL} whitespace-nowrap`}>{crop.variety}</td>
                    <td className={`${EXCEL_CELL} whitespace-nowrap`}>{formatCropDate(crop.sowingDate)}</td>
                    <td className={`${EXCEL_CELL} whitespace-nowrap`}>{formatCropDate(crop.expectedHarvestDate)}</td>
                    <td className={EXCEL_CELL}>
                      <StatusBadge status={crop.status} />
                    </td>
                    <td className={`${EXCEL_CELL} ${ACTION_COL} sticky right-0 z-10 border-l border-slate-200 bg-white group-hover:bg-slate-50`}>
                      <CropActions crop={crop} onDelete={setDeleteId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal
        open={Boolean(deleteId)}
        title="Delete crop?"
        onClose={() => setDeleteId("")}
        footer={
          <>
            <button type="button" className={EXCEL_BTN} onClick={() => setDeleteId("")}>
              Cancel
            </button>
            <button type="button" className={EXCEL_BTN_DANGER} onClick={onDelete}>
              Delete
            </button>
          </>
        }
      >
        <p>This will also remove the crop plan. This cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default CropsPage;
