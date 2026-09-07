import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteCrop, getCrop } from "../api/farmerApi";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import { createProductPath, formatCropDate, formatCropBusinessId } from "../utils/cropLinks";
import CopyId from "../components/ui/CopyId";
import {
  EXCEL_BTN,
  EXCEL_BTN_DANGER,
  EXCEL_BTN_PRIMARY,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
} from "../utils/excelStyles";

function CropDetailPage() {
  const { cropId } = useParams();
  const navigate = useNavigate();
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setCrop(await getCrop(cropId));
      } catch (err) {
        setCrop(null);
        toast.error(err.message || "Failed to load crop");
      } finally {
        setLoading(false);
      }
    })();
  }, [cropId]);

  const onDelete = async () => {
    try {
      await deleteCrop(cropId);
      toast.success("Crop deleted");
      navigate("/farmer/crops");
    } catch (err) {
      toast.error(err.message || "Failed to delete crop");
    }
  };

  if (loading) return <LoadingState rows={8} />;
  if (!crop) {
    return (
      <EmptyState
        title="Crop not found"
        description="This crop may have been deleted or does not belong to your account."
        action={
          <Link to="/farmer/crops" className={EXCEL_BTN_PRIMARY}>
            Back to My Crops
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className={EXCEL_PAGE_TITLE}>{crop.cropName}</h1>
          <p className={`${EXCEL_PAGE_SUB} break-words`}>
            {crop.variety} • {crop.farmName || "Farm"} {crop.farmLocation ? `• ${crop.farmLocation}` : ""}
          </p>
          <CopyId value={formatCropBusinessId(crop)} className="mt-1" textClassName="font-mono text-[12px] font-semibold tracking-wide text-emerald-700" />
        </div>
        <StatusBadge status={crop.status} />
      </div>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Crop Details</h2>
        <div className="grid grid-cols-1 gap-3 p-3 text-xs sm:grid-cols-2">
          <Info label="Crop Name" value={crop.cropName} />
          <Info label="Crop ID" value={<CopyId value={formatCropBusinessId(crop)} />} />
          <Info label="Variety" value={crop.variety} />
          <Info label="Area" value={`${crop.area} ${crop.areaUnit}`} />
          <Info label="Sowing Date" value={formatCropDate(crop.sowingDate)} />
          <Info label="Expected Harvest Date" value={formatCropDate(crop.expectedHarvestDate)} />
          <Info label="Estimated Quantity" value={`${crop.estimatedQuantity} ${crop.unit}`} />
          <Info label="Farming Method" value={crop.farmingMethod} />
          <Info label="Irrigation Type" value={crop.irrigationType || "—"} />
          <Info label="Organic / Conventional" value={crop.farmingType || "—"} />
          <Info label="Farm Name" value={crop.farmName || "—"} />
          <Info label="Farm Location" value={crop.farmLocation || "—"} />
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Crop Photos</h2>
        <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-4">
          {crop.photos?.filter(Boolean).length ? (
            crop.photos.filter(Boolean).map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${crop.cropName} ${i + 1}`}
                className="h-28 w-full rounded-xl border border-slate-200 object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ))
          ) : (
            <p className="col-span-full p-2 text-xs text-slate-500">No crop photos uploaded.</p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Link to={`/farmer/crops/${cropId}/edit`} className={EXCEL_BTN}>
          Edit Crop
        </Link>
        <Link to={`/farmer/crops/${cropId}/plan`} className={EXCEL_BTN}>
          Crop Plan
        </Link>
        <Link to={createProductPath(crop)} className={EXCEL_BTN_PRIMARY}>
          Create Product
        </Link>
        <button type="button" className={EXCEL_BTN_DANGER} onClick={() => setConfirmDelete(true)}>
          Delete
        </button>
      </div>

      <Modal
        open={confirmDelete}
        title="Delete crop?"
        onClose={() => setConfirmDelete(false)}
        footer={
          <>
            <button type="button" className={EXCEL_BTN} onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
            <button type="button" className={EXCEL_BTN_DANGER} onClick={onDelete}>
              Delete
            </button>
          </>
        }
      >
        <p>This will also remove the crop plan.</p>
      </Modal>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="font-semibold text-[#6B7280]">{label}</p>
      <p className="mt-0.5 font-semibold text-[#1F2937]">{value || "—"}</p>
    </div>
  );
}

export default CropDetailPage;
