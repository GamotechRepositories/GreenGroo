import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  createManagerFarmerCrop,
  getManagerFarmers,
  getManagerFarmerById,
  getManagerFarmerCrop,
  updateManagerFarmerCrop,
} from "../../api/farmerApi";
import CropForm from "../../components/crops/CropForm";
import LoadingState from "../../components/ui/LoadingState";
import { formatCropBusinessId } from "../../utils/cropLinks";
import CopyId from "../../components/ui/CopyId";
import { EXCEL_PAGE_SUB, EXCEL_PANEL, FORM_INPUT } from "../../utils/excelStyles";

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.farmers)) return value.farmers;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function ManagerFarmerCropFormPage() {
  const { farmerId: farmerIdParam, cropId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lockedFarmerId = farmerIdParam || searchParams.get("farmerId") || "";
  const isEdit = Boolean(cropId);

  const [farmers, setFarmers] = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState(lockedFarmerId);
  const [farmerName, setFarmerName] = useState("");
  const [farmAreaUnit, setFarmAreaUnit] = useState("Acre");
  const [farmDefaults, setFarmDefaults] = useState({});
  const [crop, setCrop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!lockedFarmerId) {
          const list = await getManagerFarmers({ lite: true });
          if (!cancelled) setFarmers(asArray(list));
        }
      } catch (err) {
        toast.error(err.message || "Failed to load farmers");
      } finally {
        if (!cancelled && !selectedFarmerId) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lockedFarmerId]);

  useEffect(() => {
    if (!selectedFarmerId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const farmer = await getManagerFarmerById(selectedFarmerId);
        if (cancelled) return;
        setFarmerName(farmer?.name || "");
        setFarmAreaUnit(farmer?.farm?.totalFarmAreaUnit || "Acre");
        setFarmDefaults({
          farmingMethod: farmer?.farm?.farmingMethod || "",
          farmingType: farmer?.farm?.farmingType || farmer?.farmType || "",
          irrigationType: farmer?.farm?.irrigationType || "",
        });
        if (isEdit && cropId) {
          const c = await getManagerFarmerCrop(selectedFarmerId, cropId);
          if (!cancelled) setCrop(c);
        }
      } catch (err) {
        toast.error(err.message || "Failed to load crop details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedFarmerId, cropId, isEdit]);

  const backTo = lockedFarmerId
    ? `/manager/farmers/${lockedFarmerId}`
    : "/manager/crops";
  const farmerSelectId = (f) => f.id || f.farmerId;

  const onSubmit = async (values) => {
    const targetFarmer = selectedFarmerId || lockedFarmerId;
    if (!targetFarmer) {
      toast.error("Select a farmer first");
      return;
    }
    setSubmitting(true);
    try {
      const saved = isEdit
        ? await updateManagerFarmerCrop(targetFarmer, cropId, values)
        : await createManagerFarmerCrop(targetFarmer, values);
      const id = saved.cropId || saved.id;
      const savedFarmerId = saved.farmerId || targetFarmer;
      toast.success(
        isEdit
          ? "Crop updated"
          : `Crop added for ${saved.farmerName || farmerName || "this farmer"}`
      );
      navigate(
        isEdit
          ? `/manager/farmers/${encodeURIComponent(savedFarmerId)}/crops/${encodeURIComponent(id)}`
          : `/manager/farmers/${encodeURIComponent(savedFarmerId)}/crops/${encodeURIComponent(id)}/plan`
      );
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
        {lockedFarmerId ? (
          <>
            <Link to="/manager/farmers" className="hover:text-[#217346]">
              Farmers
            </Link>
            <span>›</span>
            <Link to={backTo} className="hover:text-[#217346]">
              {farmerName || "Farmer"}
            </Link>
          </>
        ) : (
          <Link to="/manager/crops" className="hover:text-[#217346]">
            My Crops
          </Link>
        )}
        <span>›</span>
        <span className="font-semibold text-[#1F2937]">{isEdit ? "Edit Crop" : "Add Crop"}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-2xl">
            {isEdit ? "Edit Crop" : "Add Crop"}
          </h1>
          <p className={`${EXCEL_PAGE_SUB} hidden sm:block`}>
            {isEdit
              ? `Update crop for ${farmerName || "this farmer"}.`
              : farmerName
              ? `Add a collection centre crop for ${farmerName}.`
              : "Select a farmer, then choose a crop from your collection centre."}
          </p>
        </div>
        <Link to={backTo} className="shrink-0 text-xs font-semibold text-[#217346] hover:underline sm:text-sm">
          Back
        </Link>
      </div>

      {isEdit && crop ? (
        <CopyId
          value={formatCropBusinessId(crop)}
          className="max-w-full"
          textClassName="font-mono text-[11px] font-semibold tracking-wide text-emerald-700 sm:text-[12px]"
        />
      ) : null}

      {!lockedFarmerId ? (
        <div className={`${EXCEL_PANEL} p-3 sm:p-4`}>
          <label className="mb-1 block text-[11px] font-semibold text-slate-600">Farmer *</label>
          <select
            className={FORM_INPUT}
            value={selectedFarmerId}
            onChange={(e) => setSelectedFarmerId(e.target.value)}
          >
            <option value="">Select farmer</option>
            {farmers.map((f) => (
              <option key={farmerSelectId(f)} value={farmerSelectId(f)}>
                {f.name} {f.mobile ? `· ${f.mobile}` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {selectedFarmerId || lockedFarmerId ? (
        <div className={`${EXCEL_PANEL} p-3 sm:p-5`}>
          <CropForm
            key={`${selectedFarmerId}-${crop?.id || "new"}`}
            initialCrop={crop || farmDefaults}
            farmAreaUnit={farmAreaUnit}
            submitting={submitting}
            showStatus={isEdit}
            submitLabel="Save Crop"
            restrictToCatalog={!isEdit}
            onSubmit={onSubmit}
          />
        </div>
      ) : (
        <p className="text-xs text-[#6B7280]">Select a farmer to continue.</p>
      )}
    </div>
  );
}

export default ManagerFarmerCropFormPage;
