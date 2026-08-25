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

import { createProductPath, formatCropDate } from "../utils/cropLinks";

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>My Crops</h1>
          <p className={EXCEL_PAGE_SUB}>Crops linked to your farm. Create a product after planning harvest.</p>
        </div>
        <Link to="/farmer/crops/add" className={`${EXCEL_BTN_PRIMARY} px-4 py-2`}>
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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {crops.map((crop) => (
              <div key={crop.cropId || crop.id} className={EXCEL_PANEL}>
                {crop.photos?.[0] ? (
                  <img src={crop.photos[0]} alt={crop.cropName} className="h-32 w-full object-cover" />
                ) : (
                  <div className="flex h-24 items-center justify-center bg-[#F2F2F2] text-xs text-[#6B7280]">No photo</div>
                )}
                <div className="space-y-1 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#1F2937]">{crop.cropName}</p>
                      <p className="text-[11px] text-[#6B7280]">{crop.variety}</p>
                    </div>
                    <StatusBadge status={crop.status} />
                  </div>
                  <p className="text-[11px] text-[#4B5563]">
                    {crop.area} {crop.areaUnit} • {crop.estimatedQuantity} {crop.unit}
                  </p>
                  <p className="text-[11px] text-[#6B7280]">Harvest: {formatCropDate(crop.expectedHarvestDate)}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <Link to={`/farmer/crops/${crop.cropId || crop.id}`} className={EXCEL_BTN}>
                      View
                    </Link>
                    <Link to={`/farmer/crops/${crop.cropId || crop.id}/edit`} className={EXCEL_BTN}>
                      Edit
                    </Link>
                    <Link to={createProductPath(crop)} className={EXCEL_BTN}>
                      Create Product
                    </Link>
                    <button type="button" className={EXCEL_BTN_DANGER} onClick={() => setDeleteId(crop.cropId || crop.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`${EXCEL_WRAP} hidden md:block`}>
            <table className={EXCEL_TABLE}>
              <thead>
                <tr>
                  {["Photo", "Crop", "Variety", "Area", "Sowing", "Harvest", "Qty", "Unit", "Method", "Type", "Status", "Actions"].map((h) => (
                    <th key={h} className={EXCEL_HEAD}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {crops.map((crop) => (
                  <tr key={`row-${crop.cropId || crop.id}`}>
                    <td className={EXCEL_CELL}>
                      {crop.photos?.[0] ? (
                        <img src={crop.photos[0]} alt="" className="h-8 w-8 object-cover" />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className={`${EXCEL_CELL} font-semibold`}>{crop.cropName}</td>
                    <td className={EXCEL_CELL}>{crop.variety}</td>
                    <td className={EXCEL_CELL}>
                      {crop.area} {crop.areaUnit}
                    </td>
                    <td className={EXCEL_CELL}>{formatCropDate(crop.sowingDate)}</td>
                    <td className={EXCEL_CELL}>{formatCropDate(crop.expectedHarvestDate)}</td>
                    <td className={EXCEL_CELL}>{crop.estimatedQuantity}</td>
                    <td className={EXCEL_CELL}>{crop.unit}</td>
                    <td className={EXCEL_CELL}>{crop.farmingMethod}</td>
                    <td className={EXCEL_CELL}>{crop.farmingType || "—"}</td>
                    <td className={EXCEL_CELL}>
                      <StatusBadge status={crop.status} />
                    </td>
                    <td className={EXCEL_CELL}>
                      <div className="flex flex-wrap gap-1">
                        <Link to={`/farmer/crops/${crop.cropId || crop.id}`} className={EXCEL_BTN}>
                          View
                        </Link>
                        <Link to={`/farmer/crops/${crop.cropId || crop.id}/edit`} className={EXCEL_BTN}>
                          Edit
                        </Link>
                        <Link to={createProductPath(crop)} className={EXCEL_BTN}>
                          Create Product
                        </Link>
                        <button type="button" className={EXCEL_BTN_DANGER} onClick={() => setDeleteId(crop.cropId || crop.id)}>
                          Delete
                        </button>
                      </div>
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
