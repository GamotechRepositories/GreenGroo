import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { getFarmerProfile, updateFarmProfile } from "../api/farmerApi";
import { setFarmerProfile } from "../store/farmerSlice";
import ImageUploadField from "../components/ui/ImageUploadField";
import FileUpload from "../components/ui/FileUpload";
import LoadingState from "../components/ui/LoadingState";
import ProfileFlowNav from "../components/profile/ProfileFlowNav";
import {
  AREA_UNITS,
  FARMING_METHODS,
  FARMING_TYPES,
  IRRIGATION_TYPES,
  SOIL_TYPES,
  WATER_SOURCES,
} from "../utils/constants";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
} from "../utils/excelStyles";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function toAcres(value, unit) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return unit === "Hectare" ? n * 2.47105 : n;
}

function FarmProfilePage() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(true);
  const [form, setForm] = useState({
    farmName: "",
    totalFarmArea: "",
    totalFarmAreaUnit: "Acre",
    cultivatedArea: "",
    cultivatedAreaUnit: "Acre",
    soilType: "",
    irrigationType: "",
    waterSource: "",
    farmingMethod: "",
    farmingType: "",
    mainCrops: "",
    farmPhotos: [""],
    farmVideos: [],
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const data = await getFarmerProfile();
        dispatch(setFarmerProfile(data));
        const farm = data.farm || {};
        setForm({
          farmName: farm.farmName || data.farmName || "",
          totalFarmArea: farm.totalFarmArea || "",
          totalFarmAreaUnit: farm.totalFarmAreaUnit || "Acre",
          cultivatedArea: farm.cultivatedArea || "",
          cultivatedAreaUnit: farm.cultivatedAreaUnit || "Acre",
          soilType: farm.soilType || "",
          irrigationType: farm.irrigationType || "",
          waterSource: farm.waterSource || "",
          farmingMethod: farm.farmingMethod || "",
          farmingType: farm.farmingType || data.farmType || "",
          mainCrops: farm.mainCrops || "",
          farmPhotos: farm.farmPhotos?.length ? farm.farmPhotos : [""],
          farmVideos: farm.farmVideos || [],
        });
        if (farm.farmName) setEditing(false);
      } catch (err) {
        toast.error(err.message || "Failed to load farm profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const next = {};
    if (!form.farmName.trim()) next.farmName = "Farm name is required";
    if (!(Number(form.totalFarmArea) > 0)) next.totalFarmArea = "Total farm area must be greater than 0";
    if (!(Number(form.cultivatedArea) > 0)) next.cultivatedArea = "Cultivated area must be greater than 0";
    if (
      Number(form.totalFarmArea) > 0 &&
      Number(form.cultivatedArea) > 0 &&
      toAcres(form.cultivatedArea, form.cultivatedAreaUnit) > toAcres(form.totalFarmArea, form.totalFarmAreaUnit)
    ) {
      next.cultivatedArea = "Cultivated area cannot be greater than total farm area";
    }
    if (!form.soilType) next.soilType = "Soil type is required";
    if (!form.irrigationType) next.irrigationType = "Irrigation type is required";
    if (!form.waterSource) next.waterSource = "Water source is required";
    if (!form.farmingMethod) next.farmingMethod = "Farming method is required";
    if (!form.farmingType) next.farmingType = "Farming type is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const data = await updateFarmProfile({
        ...form,
        totalFarmArea: Number(form.totalFarmArea),
        cultivatedArea: Number(form.cultivatedArea),
        farmPhotos: form.farmPhotos.filter(Boolean),
        farmVideos: form.farmVideos.filter(Boolean),
      });
      dispatch(setFarmerProfile(data));
      setEditing(false);
      toast.success("Farm profile saved");
    } catch (err) {
      toast.error(err.message || "Failed to save farm profile");
    } finally {
      setSaving(false);
    }
  };

  const addVideo = async (file) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Video must be under 4MB");
      return;
    }
    const url = await fileToDataUrl(file);
    setForm((prev) => ({ ...prev, farmVideos: [...prev.farmVideos, url].slice(0, 2) }));
  };

  if (loading) return <LoadingState rows={8} />;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Farm Profile</h1>
          <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>Farm details linked to your farmer account.</p>
          <div className="mt-2">
            <ProfileFlowNav />
          </div>
        </div>
        {!editing ? (
          <button type="button" className={EXCEL_BTN} onClick={() => setEditing(true)}>
            Edit Farm Profile
          </button>
        ) : null}
      </div>

      <form onSubmit={onSave} className="space-y-4">
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Farm Details</h2>
          <div className="grid gap-3 p-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold">Farm Name *</label>
              <input
                className={EXCEL_INPUT}
                value={form.farmName}
                disabled={!editing}
                onChange={(e) => setField("farmName", e.target.value)}
              />
              {errors.farmName ? <p className="mt-1 text-xs text-[#DC2626]">{errors.farmName}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">Total Farm Area *</label>
              <div className="flex gap-2">
                <input
                  className={EXCEL_INPUT}
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!editing}
                  value={form.totalFarmArea}
                  onChange={(e) => setField("totalFarmArea", e.target.value)}
                />
                <select
                  className={EXCEL_INPUT}
                  disabled={!editing}
                  value={form.totalFarmAreaUnit}
                  onChange={(e) => setField("totalFarmAreaUnit", e.target.value)}
                >
                  {AREA_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              {errors.totalFarmArea ? <p className="mt-1 text-xs text-[#DC2626]">{errors.totalFarmArea}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold">Cultivated Area *</label>
              <div className="flex gap-2">
                <input
                  className={EXCEL_INPUT}
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!editing}
                  value={form.cultivatedArea}
                  onChange={(e) => setField("cultivatedArea", e.target.value)}
                />
                <select
                  className={EXCEL_INPUT}
                  disabled={!editing}
                  value={form.cultivatedAreaUnit}
                  onChange={(e) => setField("cultivatedAreaUnit", e.target.value)}
                >
                  {AREA_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              {errors.cultivatedArea ? <p className="mt-1 text-xs text-[#DC2626]">{errors.cultivatedArea}</p> : null}
            </div>

            <SelectField label="Soil Type *" value={form.soilType} error={errors.soilType} disabled={!editing} options={SOIL_TYPES} onChange={(v) => setField("soilType", v)} />
            <SelectField label="Irrigation Type *" value={form.irrigationType} error={errors.irrigationType} disabled={!editing} options={IRRIGATION_TYPES} onChange={(v) => setField("irrigationType", v)} />
            <SelectField label="Water Source *" value={form.waterSource} error={errors.waterSource} disabled={!editing} options={WATER_SOURCES} onChange={(v) => setField("waterSource", v)} />
            <SelectField label="Farming Method *" value={form.farmingMethod} error={errors.farmingMethod} disabled={!editing} options={FARMING_METHODS} onChange={(v) => setField("farmingMethod", v)} />
            <SelectField label="Organic / Conventional *" value={form.farmingType} error={errors.farmingType} disabled={!editing} options={FARMING_TYPES} onChange={(v) => setField("farmingType", v)} />

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold">Main Crops</label>
              <input
                className={EXCEL_INPUT}
                disabled={!editing}
                placeholder="Tomato, Onion, Potato"
                value={form.mainCrops}
                onChange={(e) => setField("mainCrops", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Farm Photos</h2>
          <div className="grid gap-3 p-3 sm:grid-cols-2">
            {form.farmPhotos.map((photo, index) => (
              <ImageUploadField
                key={index}
                label={`Farm Photo ${index + 1}`}
                value={photo}
                disabled={!editing}
                showPresets={false}
                onChange={(value) => {
                  const next = [...form.farmPhotos];
                  next[index] = value;
                  setField("farmPhotos", next);
                }}
              />
            ))}
            {editing && form.farmPhotos.length < 4 ? (
              <button
                type="button"
                className={EXCEL_BTN}
                onClick={() => setField("farmPhotos", [...form.farmPhotos, ""])}
              >
                Add Photo
              </button>
            ) : null}
          </div>
        </section>

        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Farm Videos</h2>
          <div className="space-y-3 p-3">
            {form.farmVideos.map((video, index) => (
              <video key={index} src={video} controls className="h-40 w-full bg-black" />
            ))}
            {editing && form.farmVideos.length < 2 ? (
              <FileUpload
                label="Upload farm video"
                accept="video/mp4,video/webm"
                hint="MP4 or WebM up to 4MB"
                onSelect={addVideo}
              />
            ) : null}
          </div>
        </section>

        {editing ? (
          <button type="submit" disabled={saving} className={`${EXCEL_BTN_PRIMARY} px-5`}>
            {saving ? "Saving…" : "Save Farm Profile"}
          </button>
        ) : (
          <Link to="/farmer/farm-location" className={`${EXCEL_BTN_PRIMARY} inline-block px-4 py-2`}>
            Continue to Farm Location
          </Link>
        )}
      </form>
    </div>
  );
}

function SelectField({ label, value, options, onChange, error, disabled }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold">{label}</label>
      <select className={EXCEL_INPUT} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-[#DC2626]">{error}</p> : null}
    </div>
  );
}

export default FarmProfilePage;
