import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";

const INPUT = "w-full border border-[#D4D4D4] px-2.5 py-1.5 text-xs outline-none focus:border-[#217346]";
const OTHER = "Other";
const CROP_OPTIONS = [
  "Tomato", "Onion", "Potato", "Capsicum", "Brinjal", "Cabbage", "Cauliflower", "Okra",
  "Chilli", "Cotton", "Soybean", "Wheat", "Rice", "Sugarcane", "Grapes", "Pomegranate",
  "Banana", "Maize", "Groundnut", "Turmeric",
];
const AREA_UNITS = ["Acre", "Hectare"];
const CROP_UNITS = ["Kg", "Quintal", "Ton"];
const FARMING_METHODS = ["Conventional", "Mixed", "Natural"];
const IRRIGATION_TYPES = ["Drip", "Sprinkler", "Flood", "Rainfed", "Canal"];
const FARMING_TYPES = ["Organic", "Conventional"];
const STATUS_FLOW = {
  Planned: ["Planned", "Growing"],
  Growing: ["Growing", "Ready for Harvest"],
  "Ready for Harvest": ["Ready for Harvest", "Harvested"],
  Harvested: ["Harvested", "Completed"],
  Completed: ["Completed"],
};

function splitValue(options, value) {
  const raw = String(value || "").trim();
  if (!raw) return { select: "", custom: "" };
  if (options.includes(raw)) return { select: raw, custom: "" };
  return { select: OTHER, custom: raw };
}

function resolveValue(select, custom) {
  return select === OTHER ? String(custom || "").trim() : String(select || "").trim();
}

function emptyForm(defaults = {}) {
  const crop = splitValue(CROP_OPTIONS, defaults.cropName);
  const areaUnit = splitValue(AREA_UNITS, defaults.areaUnit || "Acre");
  const unit = splitValue(CROP_UNITS, defaults.unit || "Kg");
  const farmingMethod = splitValue(FARMING_METHODS, defaults.farmingMethod);
  const irrigationType = splitValue(IRRIGATION_TYPES, defaults.irrigationType);
  const farmingType = splitValue(FARMING_TYPES, defaults.farmingType);
  return {
    cropName: crop.select,
    customCropName: crop.custom,
    variety: defaults.variety || "",
    area: defaults.area || "",
    areaUnit: areaUnit.select || "Acre",
    customAreaUnit: areaUnit.custom,
    sowingDate: defaults.sowingDate || "",
    expectedHarvestDate: defaults.expectedHarvestDate || "",
    estimatedQuantity: defaults.estimatedQuantity || "",
    unit: unit.select || "Kg",
    customUnit: unit.custom,
    farmingMethod: farmingMethod.select,
    customFarmingMethod: farmingMethod.custom,
    irrigationType: irrigationType.select,
    customIrrigationType: irrigationType.custom,
    farmingType: farmingType.select,
    customFarmingType: farmingType.custom,
    photos: defaults.photos?.filter(Boolean).length ? defaults.photos.filter(Boolean) : [""],
    status: defaults.status || "Planned",
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function SelectField({ label, required, options, value, custom, onSelect, onCustom, error, customPlaceholder }) {
  return (
    <div>
      <label className="mb-0.5 block text-[11px] font-semibold text-slate-600">
        {label}
        {required ? " *" : ""}
      </label>
      <select className={INPUT} value={value} onChange={(e) => onSelect(e.target.value)}>
        <option value="">Select</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
        <option value={OTHER}>{OTHER}</option>
      </select>
      {value === OTHER ? (
        <input className={`${INPUT} mt-1.5`} value={custom} placeholder={customPlaceholder} onChange={(e) => onCustom(e.target.value)} />
      ) : null}
      {error ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{error}</p> : null}
    </div>
  );
}

export default function FarmerCropFormPage() {
  const { farmerId, cropId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(cropId);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [farmerName, setFarmerName] = useState("");
  const [form, setForm] = useState(() => emptyForm());
  const [errors, setErrors] = useState({});
  const backTo = `/vendor/all-farmers/${farmerId}`;

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  useEffect(() => {
    (async () => {
      try {
        const farmer = (await vendorApi.getFarmerById(farmerId)).data;
        setFarmerName(farmer?.name || "");
        const defaults = {
          farmingMethod: farmer?.farm?.farmingMethod || "",
          farmingType: farmer?.farm?.farmingType || farmer?.farmType || "",
          irrigationType: farmer?.farm?.irrigationType || "",
          areaUnit: farmer?.farm?.totalFarmAreaUnit || "Acre",
        };
        if (isEdit) {
          const crop = (await vendorApi.getFarmerCrop(farmerId, cropId)).data;
          setForm(emptyForm({ ...defaults, ...crop }));
        } else {
          setForm(emptyForm(defaults));
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load crop");
      } finally {
        setLoading(false);
      }
    })();
  }, [farmerId, cropId, isEdit]);

  const validate = () => {
    const cropName = resolveValue(form.cropName, form.customCropName);
    const areaUnit = resolveValue(form.areaUnit, form.customAreaUnit);
    const unit = resolveValue(form.unit, form.customUnit);
    const farmingMethod = resolveValue(form.farmingMethod, form.customFarmingMethod);
    const irrigationType = resolveValue(form.irrigationType, form.customIrrigationType);
    const farmingType = resolveValue(form.farmingType, form.customFarmingType);
    const next = {};
    if (!cropName) next.cropName = "Crop is required";
    if (!form.variety.trim()) next.variety = "Variety is required";
    if (!(Number(form.area) > 0)) next.area = "Area must be greater than 0";
    if (!areaUnit) next.areaUnit = "Area unit is required";
    if (!form.sowingDate) next.sowingDate = "Sowing date is required";
    if (!form.expectedHarvestDate) next.expectedHarvestDate = "Expected harvest date is required";
    if (form.sowingDate && form.expectedHarvestDate && form.expectedHarvestDate < form.sowingDate) {
      next.expectedHarvestDate = "Expected harvest date cannot be before sowing date";
    }
    if (!(Number(form.estimatedQuantity) > 0)) next.estimatedQuantity = "Estimated quantity must be greater than 0";
    if (!unit) next.unit = "Unit is required";
    if (!farmingMethod) next.farmingMethod = "Farming method is required";
    if (!irrigationType) next.irrigationType = "Irrigation type is required";
    setErrors(next);
    return { ok: Object.keys(next).length === 0, cropName, areaUnit, unit, farmingMethod, irrigationType, farmingType };
  };

  const onPhoto = async (index, file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      window.alert("Photo must be 2MB or smaller");
      return;
    }
    const url = await fileToDataUrl(file);
    const next = [...form.photos];
    next[index] = url;
    setField("photos", next);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const parsed = validate();
    if (!parsed.ok) return;
    setSubmitting(true);
    setError("");
    const payload = {
      cropName: parsed.cropName,
      variety: form.variety.trim(),
      area: Number(form.area),
      areaUnit: parsed.areaUnit,
      sowingDate: form.sowingDate,
      expectedHarvestDate: form.expectedHarvestDate,
      estimatedQuantity: Number(form.estimatedQuantity),
      unit: parsed.unit,
      farmingMethod: parsed.farmingMethod,
      farmingType: parsed.farmingType,
      irrigationType: parsed.irrigationType,
      photos: form.photos.filter(Boolean),
      status: form.status,
    };
    try {
      const saved = isEdit
        ? (await vendorApi.updateFarmerCrop(farmerId, cropId, payload)).data
        : (await vendorApi.createFarmerCrop(farmerId, payload)).data;
      const id = saved.cropId || saved.id;
      navigate(`/vendor/all-farmers/${farmerId}/crops/${encodeURIComponent(id)}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save crop");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-6 text-xs text-[#6B7280]">Loading…</p>;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-6">
      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
        <Link to="/vendor/all-farmers" className="hover:text-[#217346]">Farmers</Link>
        <span>›</span>
        <Link to={backTo} className="hover:text-[#217346]">{farmerName || "Farmer"}</Link>
        <span>›</span>
        <span className="font-semibold text-[#1F2937]">{isEdit ? "Edit Crop" : "Add Crop"}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-[#1F2937]">{isEdit ? "Edit Crop" : "Add Crop"}</h1>
          <p className="text-sm text-[#6B7280]">{isEdit ? `Update crop for ${farmerName || "this farmer"}.` : `Add a crop for ${farmerName || "this farmer"}.`}</p>
        </div>
        <Link to={backTo} className="text-xs font-semibold text-[#217346] hover:underline">Back</Link>
      </div>

      {error ? <p className="text-xs text-[#DC2626]">{error}</p> : null}

      <form onSubmit={onSubmit} className="space-y-4 border border-[#D4D4D4] bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            label="Select Crop"
            required
            options={CROP_OPTIONS}
            value={form.cropName}
            custom={form.customCropName}
            onSelect={(v) => setField("cropName", v)}
            onCustom={(v) => setField("customCropName", v)}
            error={errors.cropName}
            customPlaceholder="Enter crop name"
          />
          <div>
            <label className="mb-0.5 block text-[11px] font-semibold text-slate-600">Variety *</label>
            <input className={INPUT} value={form.variety} placeholder="Hybrid" onChange={(e) => setField("variety", e.target.value)} />
            {errors.variety ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{errors.variety}</p> : null}
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-semibold text-slate-600">Area *</label>
            <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-1.5">
              <input className={`${INPUT} min-w-0`} type="number" min="0" step="0.01" value={form.area} onChange={(e) => setField("area", e.target.value)} />
              <select className="min-h-9 min-w-0 w-full border border-[#D4D4D4] px-1.5 py-1.5 text-xs outline-none focus:border-[#217346]" value={form.areaUnit} onChange={(e) => setField("areaUnit", e.target.value)}>
                {AREA_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                <option value={OTHER}>{OTHER}</option>
              </select>
            </div>
            {form.areaUnit === OTHER ? (
              <input className={`${INPUT} mt-1.5`} value={form.customAreaUnit} placeholder="Unit" onChange={(e) => setField("customAreaUnit", e.target.value)} />
            ) : null}
            {errors.area || errors.areaUnit ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{errors.area || errors.areaUnit}</p> : null}
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-semibold text-slate-600">Estimated Quantity *</label>
            <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-1.5">
              <input className={`${INPUT} min-w-0`} type="number" min="0" step="0.01" value={form.estimatedQuantity} onChange={(e) => setField("estimatedQuantity", e.target.value)} />
              <select className="min-h-9 min-w-0 w-full border border-[#D4D4D4] px-1.5 py-1.5 text-xs outline-none focus:border-[#217346]" value={form.unit} onChange={(e) => setField("unit", e.target.value)}>
                {CROP_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                <option value={OTHER}>{OTHER}</option>
              </select>
            </div>
            {form.unit === OTHER ? (
              <input className={`${INPUT} mt-1.5`} value={form.customUnit} placeholder="Unit" onChange={(e) => setField("customUnit", e.target.value)} />
            ) : null}
            {errors.estimatedQuantity || errors.unit ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{errors.estimatedQuantity || errors.unit}</p> : null}
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-semibold text-slate-600">Sowing Date *</label>
            <input className={INPUT} type="date" value={form.sowingDate} onChange={(e) => setField("sowingDate", e.target.value)} />
            {errors.sowingDate ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{errors.sowingDate}</p> : null}
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-semibold text-slate-600">Harvest Date *</label>
            <input className={INPUT} type="date" value={form.expectedHarvestDate} onChange={(e) => setField("expectedHarvestDate", e.target.value)} />
            {errors.expectedHarvestDate ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{errors.expectedHarvestDate}</p> : null}
          </div>
          <SelectField
            label="Farming Method"
            required
            options={FARMING_METHODS}
            value={form.farmingMethod}
            custom={form.customFarmingMethod}
            onSelect={(v) => setField("farmingMethod", v)}
            onCustom={(v) => setField("customFarmingMethod", v)}
            error={errors.farmingMethod}
            customPlaceholder="Enter farming method"
          />
          <SelectField
            label="Irrigation Type"
            required
            options={IRRIGATION_TYPES}
            value={form.irrigationType}
            custom={form.customIrrigationType}
            onSelect={(v) => setField("irrigationType", v)}
            onCustom={(v) => setField("customIrrigationType", v)}
            error={errors.irrigationType}
            customPlaceholder="Enter irrigation type"
          />
          <SelectField
            label="Organic / Conventional"
            options={FARMING_TYPES}
            value={form.farmingType}
            custom={form.customFarmingType}
            onSelect={(v) => setField("farmingType", v)}
            onCustom={(v) => setField("customFarmingType", v)}
            customPlaceholder="Enter farming type"
          />
          {isEdit ? (
            <div>
              <label className="mb-0.5 block text-[11px] font-semibold text-slate-600">Status</label>
              <select className={INPUT} value={form.status} onChange={(e) => setField("status", e.target.value)}>
                {(STATUS_FLOW[form.status] || [form.status]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">Photos</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {form.photos.map((photo, index) => (
              <label key={index} className="cursor-pointer border border-dashed border-[#D4D4D4] p-2 text-center">
                {photo ? (
                  <img src={photo} alt="" className="mb-1 h-20 w-full object-cover" />
                ) : null}
                <span className="text-[10px] font-semibold text-[#6B7280]">{photo ? "Replace photo" : `Photo ${index + 1}`}</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(index, e.target.files?.[0])} />
              </label>
            ))}
          </div>
          {form.photos.length < 4 ? (
            <button type="button" className="mt-2 border border-[#D4D4D4] px-2.5 py-1 text-[11px] font-semibold" onClick={() => setField("photos", [...form.photos, ""])}>
              Add Photo
            </button>
          ) : null}
        </div>

        <button type="submit" disabled={submitting} className="bg-[#217346] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a5c38] disabled:opacity-60">
          {submitting ? "Saving…" : "Save Crop"}
        </button>
      </form>
    </div>
  );
}
