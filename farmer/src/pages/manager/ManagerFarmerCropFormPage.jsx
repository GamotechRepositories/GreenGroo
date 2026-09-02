import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  createManagerFarmerCrop,
  getManagerFarmerById,
  getManagerFarmerCrop,
  updateManagerFarmerCrop,
} from "../../api/farmerApi";
import CropForm from "../../components/crops/CropForm";
import LoadingState from "../../components/ui/LoadingState";
import { formatCropBusinessId } from "../../utils/cropLinks";
import { EXCEL_PAGE_SUB, EXCEL_PANEL } from "../../utils/excelStyles";

function ManagerFarmerCropFormPage() {
  const { farmerId, cropId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(cropId);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [crop, setCrop] = useState(null);
  const [farmerName, setFarmerName] = useState("");
  const [farmAreaUnit, setFarmAreaUnit] = useState("Acre");
  const [farmDefaults, setFarmDefaults] = useState({});

  const backTo = `/farmer/manager/farmers/${farmerId}`;

  useEffect(() => {
    (async () => {
      try {
        const farmer = await getManagerFarmerById(farmerId);
        setFarmerName(farmer?.name || "");
        setFarmAreaUnit(farmer?.farm?.totalFarmAreaUnit || "Acre");
        setFarmDefaults({
          farmingMethod: farmer?.farm?.farmingMethod || "",
          farmingType: farmer?.farm?.farmingType || farmer?.farmType || "",
          irrigationType: farmer?.farm?.irrigationType || "",
        });
        if (isEdit) {
          setCrop(await getManagerFarmerCrop(farmerId, cropId));
        }
      } catch (err) {
        toast.error(err.message || "Failed to load crop");
      } finally {
        setLoading(false);
      }
    })();
  }, [farmerId, cropId, isEdit]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const saved = isEdit
        ? await updateManagerFarmerCrop(farmerId, cropId, values)
        : await createManagerFarmerCrop(farmerId, values);
      const id = saved.cropId || saved.id;
      toast.success(isEdit ? "Crop updated" : "Crop saved");
      navigate(`/farmer/manager/farmers/${farmerId}/crops/${encodeURIComponent(id)}`);
    } catch (err) {
      toast.error(err.message || "Failed to save crop");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState rows={8} />;

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-2 sm:space-y-4">
      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
        <Link to="/farmer/manager/farmers" className="hover:text-[#217346]">
          Farmers
        </Link>
        <span>›</span>
        <Link to={backTo} className="hover:text-[#217346]">
          {farmerName || "Farmer"}
        </Link>
        <span>›</span>
        <span className="font-semibold text-[#1F2937]">{isEdit ? "Edit Crop" : "Add Crop"}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-2xl">
            {isEdit ? "Edit Crop" : "Add Crop"}
          </h1>
          <p className={`${EXCEL_PAGE_SUB} hidden sm:block`}>
            {isEdit ? `Update crop for ${farmerName || "this farmer"}.` : `Add a crop for ${farmerName || "this farmer"}.`}
          </p>
        </div>
        <Link to={backTo} className="shrink-0 text-xs font-semibold text-[#217346] hover:underline sm:text-sm">
          Back
        </Link>
      </div>
      {isEdit && crop ? (
        <p className="truncate font-mono text-[11px] font-semibold tracking-wide text-emerald-700 sm:text-[12px]">
          {formatCropBusinessId(crop)}
        </p>
      ) : null}
      <div className={`${EXCEL_PANEL} p-2 sm:p-5`}>
        <CropForm
          key={crop?.id || "new"}
          initialCrop={crop || farmDefaults}
          farmAreaUnit={farmAreaUnit}
          submitting={submitting}
          showStatus={isEdit}
          submitLabel="Save Crop"
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}

export default ManagerFarmerCropFormPage;
