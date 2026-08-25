import { useState } from "react";
import ImageUploadField from "../ui/ImageUploadField";
import {
  AREA_UNITS,
  CROP_OPTIONS,
  CROP_STATUS_FLOW,
  CROP_UNITS,
  FARMING_METHODS,
  FARMING_TYPES,
} from "../../utils/constants";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY, EXCEL_INPUT } from "../../utils/excelStyles";

function emptyCrop(defaults = {}) {
  return {
    cropName: defaults.cropName || "",
    customCropName: "",
    variety: defaults.variety || "",
    area: defaults.area || "",
    areaUnit: defaults.areaUnit || "Acre",
    sowingDate: defaults.sowingDate || "",
    expectedHarvestDate: defaults.expectedHarvestDate || "",
    estimatedQuantity: defaults.estimatedQuantity || "",
    unit: defaults.unit || "Kg",
    farmingMethod: defaults.farmingMethod || "",
    farmingType: defaults.farmingType || "",
    photos: defaults.photos?.length ? defaults.photos : [""],
    status: defaults.status || "Planned",
  };
}

export default function CropForm({ initialCrop, farmAreaUnit = "Acre", submitting, onSubmit, submitLabel = "Save Crop", showStatus = false }) {
  const [form, setForm] = useState(() =>
    emptyCrop({
      ...initialCrop,
      areaUnit: initialCrop?.areaUnit || farmAreaUnit || "Acre",
      cropName: CROP_OPTIONS.includes(initialCrop?.cropName) ? initialCrop.cropName : initialCrop?.cropName ? "Other" : "",
      customCropName: CROP_OPTIONS.includes(initialCrop?.cropName) ? "" : initialCrop?.cropName || "",
    })
  );
  const [errors, setErrors] = useState({});

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const cropName = form.cropName === "Other" ? form.customCropName.trim() : form.cropName.trim();
    const next = {};
    if (!cropName) next.cropName = "Crop is required";
    if (!form.variety.trim()) next.variety = "Variety is required";
    if (!(Number(form.area) > 0)) next.area = "Area must be greater than 0";
    if (!form.sowingDate) next.sowingDate = "Sowing date is required";
    if (!form.expectedHarvestDate) next.expectedHarvestDate = "Expected harvest date is required";
    if (form.sowingDate && form.expectedHarvestDate && form.expectedHarvestDate < form.sowingDate) {
      next.expectedHarvestDate = "Expected harvest date cannot be before sowing date";
    }
    if (!(Number(form.estimatedQuantity) > 0)) next.estimatedQuantity = "Estimated quantity must be greater than 0";
    if (!form.unit) next.unit = "Unit is required";
    if (!form.farmingMethod) next.farmingMethod = "Farming method is required";
    setErrors(next);
    return { ok: Object.keys(next).length === 0, cropName };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { ok, cropName } = validate();
    if (!ok) return;
    onSubmit({
      cropName,
      variety: form.variety.trim(),
      area: Number(form.area),
      areaUnit: form.areaUnit,
      sowingDate: form.sowingDate,
      expectedHarvestDate: form.expectedHarvestDate,
      estimatedQuantity: Number(form.estimatedQuantity),
      unit: form.unit,
      farmingMethod: form.farmingMethod,
      farmingType: form.farmingType,
      photos: form.photos.filter(Boolean),
      status: form.status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold">Select Crop *</label>
          <select className={EXCEL_INPUT} value={form.cropName} onChange={(e) => setField("cropName", e.target.value)}>
            <option value="">Select crop</option>
            {CROP_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.cropName ? <p className="mt-1 text-xs text-[#DC2626]">{errors.cropName}</p> : null}
        </div>

        {form.cropName === "Other" ? (
          <div>
            <label className="mb-1 block text-xs font-semibold">Crop Name *</label>
            <input className={EXCEL_INPUT} value={form.customCropName} onChange={(e) => setField("customCropName", e.target.value)} />
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-xs font-semibold">Variety *</label>
          <input className={EXCEL_INPUT} placeholder="Hybrid" value={form.variety} onChange={(e) => setField("variety", e.target.value)} />
          {errors.variety ? <p className="mt-1 text-xs text-[#DC2626]">{errors.variety}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Area *</label>
          <div className="flex gap-2">
            <input className={EXCEL_INPUT} type="number" min="0" step="0.01" value={form.area} onChange={(e) => setField("area", e.target.value)} />
            <select className={EXCEL_INPUT} value={form.areaUnit} onChange={(e) => setField("areaUnit", e.target.value)}>
              {AREA_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          {errors.area ? <p className="mt-1 text-xs text-[#DC2626]">{errors.area}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Sowing Date *</label>
          <input className={EXCEL_INPUT} type="date" value={form.sowingDate} onChange={(e) => setField("sowingDate", e.target.value)} />
          {errors.sowingDate ? <p className="mt-1 text-xs text-[#DC2626]">{errors.sowingDate}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Expected Harvest Date *</label>
          <input
            className={EXCEL_INPUT}
            type="date"
            value={form.expectedHarvestDate}
            onChange={(e) => setField("expectedHarvestDate", e.target.value)}
          />
          {errors.expectedHarvestDate ? <p className="mt-1 text-xs text-[#DC2626]">{errors.expectedHarvestDate}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Estimated Quantity *</label>
          <div className="flex gap-2">
            <input
              className={EXCEL_INPUT}
              type="number"
              min="0"
              step="0.01"
              value={form.estimatedQuantity}
              onChange={(e) => setField("estimatedQuantity", e.target.value)}
            />
            <select className={EXCEL_INPUT} value={form.unit} onChange={(e) => setField("unit", e.target.value)}>
              {CROP_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          {errors.estimatedQuantity ? <p className="mt-1 text-xs text-[#DC2626]">{errors.estimatedQuantity}</p> : null}
          {errors.unit ? <p className="mt-1 text-xs text-[#DC2626]">{errors.unit}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Farming Method *</label>
          <select className={EXCEL_INPUT} value={form.farmingMethod} onChange={(e) => setField("farmingMethod", e.target.value)}>
            <option value="">Select</option>
            {FARMING_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {errors.farmingMethod ? <p className="mt-1 text-xs text-[#DC2626]">{errors.farmingMethod}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold">Organic / Conventional</label>
          <select className={EXCEL_INPUT} value={form.farmingType} onChange={(e) => setField("farmingType", e.target.value)}>
            <option value="">Select</option>
            {FARMING_TYPES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {showStatus ? (
          <div>
            <label className="mb-1 block text-xs font-semibold">Status</label>
            <select className={EXCEL_INPUT} value={form.status} onChange={(e) => setField("status", e.target.value)}>
              {(CROP_STATUS_FLOW[initialCrop?.status || form.status] || [form.status]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold">Crop Photos</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {form.photos.map((photo, index) => (
            <div key={index} className="space-y-1">
              <ImageUploadField
                label={`Photo ${index + 1}`}
                value={photo}
                showPresets={false}
                maxSizeMb={2}
                onChange={(value) => {
                  const next = [...form.photos];
                  next[index] = value;
                  setField("photos", next);
                }}
              />
              {photo ? (
                <button
                  type="button"
                  className={EXCEL_BTN}
                  onClick={() => setField("photos", form.photos.filter((_, i) => i !== index).concat(form.photos.length === 1 ? [""] : []))}
                >
                  Remove photo
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {form.photos.length < 4 ? (
          <button type="button" className={`${EXCEL_BTN} mt-2`} onClick={() => setField("photos", [...form.photos, ""])}>
            Add Photo
          </button>
        ) : (
          <p className="mt-2 text-[11px] text-[#6B7280]">Maximum 4 crop photos.</p>
        )}
      </div>

      <button type="submit" disabled={submitting} className={`${EXCEL_BTN_PRIMARY} px-5`}>
        {submitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
