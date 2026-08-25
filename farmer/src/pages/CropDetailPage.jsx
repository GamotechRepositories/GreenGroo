import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteCrop, getCrop } from "../api/farmerApi";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import { createProductPath, formatCropDate } from "../utils/cropLinks";
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
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>{crop.cropName}</h1>
          <p className={EXCEL_PAGE_SUB}>
            {crop.variety} • {crop.farmName || "Farm"} {crop.farmLocation ? `• ${crop.farmLocation}` : ""}
          </p>
        </div>
        <StatusBadge status={crop.status} />
      </div>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Crop Details</h2>
        <div className="grid gap-3 p-3 sm:grid-cols-2 text-xs">
          <Info label="Crop Name" value={crop.cropName} />
          <Info label="Variety" value={crop.variety} />
          <Info label="Area" value={`${crop.area} ${crop.areaUnit}`} />
          <Info label="Sowing Date" value={formatCropDate(crop.sowingDate)} />
          <Info label="Expected Harvest Date" value={formatCropDate(crop.expectedHarvestDate)} />
          <Info label="Estimated Quantity" value={`${crop.estimatedQuantity} ${crop.unit}`} />
          <Info label="Farming Method" value={crop.farmingMethod} />
          <Info label="Organic / Conventional" value={crop.farmingType || "—"} />
          <Info label="Farm Name" value={crop.farmName || "—"} />
          <Info label="Farm Location" value={crop.farmLocation || "—"} />
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Crop Photos</h2>
        <div className="grid gap-2 p-3 sm:grid-cols-2 md:grid-cols-4">
          {crop.photos?.filter(Boolean).length ? (
            crop.photos.filter(Boolean).map((src, i) => (
              <img key={i} src={src} alt={`${crop.cropName} ${i + 1}`} className="h-28 w-full rounded object-cover border border-[#D4D4D4]" />
            ))
          ) : (
            <p className="p-2 text-xs text-[#6B7280]">No crop photos uploaded.</p>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <Link to={`/farmer/crops/${cropId}/edit`} className={EXCEL_BTN}>
          Edit Crop
        </Link>
        <button type="button" className={EXCEL_BTN_DANGER} onClick={() => setConfirmDelete(true)}>
          Delete Crop
        </button>
        <Link to={createProductPath(crop)} className={EXCEL_BTN_PRIMARY}>
          Create Product
        </Link>
        <Link to={`/farmer/crops/${cropId}/plan`} className={EXCEL_BTN}>
          View Crop Plan
        </Link>
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
