import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { createCrop, getCrop, getFarmerProfile, updateCrop } from "../api/farmerApi";
import CropForm from "../components/crops/CropForm";
import LoadingState from "../components/ui/LoadingState";
import { EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE, EXCEL_PANEL } from "../utils/excelStyles";

function CropFormPage() {
  const { cropId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(cropId);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [crop, setCrop] = useState(null);
  const [farmAreaUnit, setFarmAreaUnit] = useState("Acre");
  const [farmDefaults, setFarmDefaults] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const profile = await getFarmerProfile();
        setFarmAreaUnit(profile.farm?.totalFarmAreaUnit || "Acre");
        setFarmDefaults({
          farmingMethod: profile.farm?.farmingMethod || "",
          farmingType: profile.farm?.farmingType || "",
        });
        if (isEdit) {
          setCrop(await getCrop(cropId));
        }
      } catch (err) {
        toast.error(err.message || "Failed to load crop");
      } finally {
        setLoading(false);
      }
    })();
  }, [cropId, isEdit]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const saved = isEdit ? await updateCrop(cropId, values) : await createCrop(values);
      const id = saved.cropId || saved.id;
      toast.success(isEdit ? "Crop updated" : "Crop saved");
      navigate(isEdit ? `/farmer/crops/${id}` : `/farmer/crops/${id}/plan`);
    } catch (err) {
      toast.error(err.message || "Failed to save crop");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState rows={8} />;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>{isEdit ? "Edit Crop" : "Add Crop"}</h1>
        <p className={EXCEL_PAGE_SUB}>
          {isEdit ? "Update crop details." : "Add a crop to your farm, then plan production."}{" "}
          <Link to="/farmer/crops" className="font-semibold text-[#217346] hover:underline">
            Back to My Crops
          </Link>
        </p>
      </div>
      <div className={`${EXCEL_PANEL} p-3`}>
        <CropForm
          key={crop?.id || "new"}
          initialCrop={crop || farmDefaults}
          farmAreaUnit={farmAreaUnit}
          submitting={submitting}
          showStatus={isEdit}
          submitLabel={isEdit ? "Save Crop" : "Save Crop"}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}

export default CropFormPage;
