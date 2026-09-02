import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getManagerFarmerById, getManagerFarmerCrop } from "../../api/farmerApi";
import StatusBadge from "../../components/ui/StatusBadge";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import { formatCropDate, formatCropBusinessId } from "../../utils/cropLinks";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY, EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE, EXCEL_PANEL, EXCEL_PANEL_HEAD } from "../../utils/excelStyles";

function ManagerFarmerCropViewPage() {
  const { farmerId, cropId } = useParams();
  const [crop, setCrop] = useState(null);
  const [farmerName, setFarmerName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cropData, farmer] = await Promise.all([
          getManagerFarmerCrop(farmerId, cropId),
          getManagerFarmerById(farmerId).catch(() => null),
        ]);
        setCrop(cropData);
        setFarmerName(farmer?.name || "");
      } catch (err) {
        setCrop(null);
        toast.error(err.message || "Failed to load crop");
      } finally {
        setLoading(false);
      }
    })();
  }, [farmerId, cropId]);

  if (loading) return <LoadingState rows={8} />;
  if (!crop) {
    return (
      <EmptyState
        title="Crop not found"
        description="This crop may have been deleted."
        action={
          <Link to={`/farmer/manager/farmers/${farmerId}`} className={EXCEL_BTN}>
            Back to farmer
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-4">
      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
        <Link to="/farmer/manager/farmers" className="hover:text-[#217346]">
          Farmers
        </Link>
        <span>›</span>
        <Link to={`/farmer/manager/farmers/${farmerId}`} className="hover:text-[#217346]">
          {farmerName || "Farmer"}
        </Link>
        <span>›</span>
        <span className="font-semibold text-[#1F2937]">Crop</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className={EXCEL_PAGE_TITLE}>{crop.cropName}</h1>
          <p className={`${EXCEL_PAGE_SUB} break-words`}>
            {crop.variety} • {crop.farmName || "Farm"} {crop.farmLocation ? `• ${crop.farmLocation}` : ""}
          </p>
          <p className="mt-1 font-mono text-[12px] font-semibold tracking-wide text-emerald-700">
            {formatCropBusinessId(crop)}
          </p>
        </div>
        <StatusBadge status={crop.status} />
      </div>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Crop Details</h2>
        <div className="grid grid-cols-1 gap-3 p-3 text-xs sm:grid-cols-2">
          <Info label="Crop Name" value={crop.cropName} />
          <Info label="Crop ID" value={formatCropBusinessId(crop)} />
          <Info label="Variety" value={crop.variety} />
          <Info label="Area" value={`${crop.area} ${crop.areaUnit || ""}`.trim()} />
          <Info label="Sowing Date" value={formatCropDate(crop.sowingDate)} />
          <Info label="Expected Harvest Date" value={formatCropDate(crop.expectedHarvestDate)} />
          <Info label="Estimated Quantity" value={`${crop.estimatedQuantity} ${crop.unit || ""}`.trim()} />
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

      <div className="flex flex-wrap gap-2">
        <Link
          to={`/farmer/manager/farmers/${farmerId}/crops/${encodeURIComponent(crop.cropId || crop.id)}/edit`}
          className={EXCEL_BTN_PRIMARY}
        >
          Edit Crop
        </Link>
        <Link to={`/farmer/manager/farmers/${farmerId}`} className={EXCEL_BTN}>
          Back to farmer
        </Link>
      </div>
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

export default ManagerFarmerCropViewPage;
