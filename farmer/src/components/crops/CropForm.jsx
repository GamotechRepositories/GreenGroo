import { useState } from "react";
import ImageUploadField from "../ui/ImageUploadField";
import SelectWithOther, { InlineSelectWithOther, resolvePreset, splitPreset } from "../ui/SelectWithOther";
import { AREA_UNITS, CROP_OPTIONS, CROP_STATUS_FLOW, CROP_UNITS, FARMING_METHODS, FARMING_TYPES, IRRIGATION_TYPES } from "../../utils/constants";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY, FORM_INPUT } from "../../utils/excelStyles";
import { formatCropBusinessId } from "../../utils/cropLinks";

function emptyCrop(defaults = {}) {
  const crop = splitPreset(CROP_OPTIONS, defaults.cropName);
  const areaUnit = splitPreset(AREA_UNITS, defaults.areaUnit || "Acre");
  const unit = splitPreset(CROP_UNITS, defaults.unit || "Kg");
  const farmingMethod = splitPreset(FARMING_METHODS, defaults.farmingMethod);
  const farmingType = splitPreset(FARMING_TYPES, defaults.farmingType);
  const irrigationType = splitPreset(IRRIGATION_TYPES, defaults.irrigationType);
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
    farmingType: farmingType.select,
    customFarmingType: farmingType.custom,
    irrigationType: irrigationType.select,
    customIrrigationType: irrigationType.custom,
    photos: defaults.photos?.length ? defaults.photos : [""],
    status: defaults.status || "Planned",
  };
}

export default function CropForm({ initialCrop, farmAreaUnit = "Acre", submitting, onSubmit, submitLabel = "Save Crop", showStatus = false }) {
  const [form, setForm] = useState(() =>
    emptyCrop({
      ...initialCrop,
      areaUnit: initialCrop?.areaUnit || farmAreaUnit || "Acre",
    })
  );
  const [errors, setErrors] = useState({});

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const cropName = resolvePreset(form.cropName, form.customCropName);
    const areaUnit = resolvePreset(form.areaUnit, form.customAreaUnit);
    const unit = resolvePreset(form.unit, form.customUnit);
    const farmingMethod = resolvePreset(form.farmingMethod, form.customFarmingMethod);
    const farmingType = resolvePreset(form.farmingType, form.customFarmingType);
    const irrigationType = resolvePreset(form.irrigationType, form.customIrrigationType);
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
    return { ok: Object.keys(next).length === 0, cropName, areaUnit, unit, farmingMethod, farmingType, irrigationType };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { ok, cropName, areaUnit, unit, farmingMethod, farmingType, irrigationType } = validate();
    if (!ok) return;
    onSubmit({
      cropName,
      variety: form.variety.trim(),
      area: Number(form.area),
      areaUnit,
      sowingDate: form.sowingDate,
      expectedHarvestDate: form.expectedHarvestDate,
      estimatedQuantity: Number(form.estimatedQuantity),
      unit,
      farmingMethod,
      farmingType,
      irrigationType,
      photos: form.photos.filter(Boolean),
      status: form.status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-5">
      {initialCrop?.cropId || initialCrop?.id ? (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Crop ID</p>
          <p className="truncate font-mono text-xs font-bold tracking-wide text-emerald-800 sm:text-sm">
            {formatCropBusinessId(initialCrop)}
          </p>
        </div>
      ) : null}

      <Section title="Crop">
        <SelectWithOther
          label="Select Crop"
          required
          options={CROP_OPTIONS}
          selectValue={form.cropName}
          customValue={form.customCropName}
          onSelect={(v) => setField("cropName", v)}
          onCustom={(v) => setField("customCropName", v)}
          error={errors.cropName}
          customLabel="Crop name"
          placeholder="Enter crop name"
          inputClass={FORM_INPUT}
        />
        <Field label="Variety" required error={errors.variety}>
          <input className={FORM_INPUT} placeholder="Hybrid" value={form.variety} onChange={(e) => setField("variety", e.target.value)} />
        </Field>
      </Section>

      <Section title="Area & quantity">
        <Field label="Area" required error={errors.area || errors.areaUnit}>
          <div className="grid grid-cols-[minmax(0,1fr)_4.25rem] gap-1 sm:grid-cols-[minmax(0,1fr)_8.25rem] sm:gap-1.5">
            <input className={FORM_INPUT} type="number" min="0" step="0.01" inputMode="decimal" value={form.area} onChange={(e) => setField("area", e.target.value)} />
            <InlineSelectWithOther
              options={AREA_UNITS}
              selectValue={form.areaUnit}
              customValue={form.customAreaUnit}
              onSelect={(v) => setField("areaUnit", v)}
              onCustom={(v) => setField("customAreaUnit", v)}
              placeholder="Unit"
              inputClass={FORM_INPUT}
            />
          </div>
        </Field>
        <Field label="Quantity" required error={errors.estimatedQuantity || errors.unit}>
          <div className="grid grid-cols-[minmax(0,1fr)_4.25rem] gap-1 sm:grid-cols-[minmax(0,1fr)_8.25rem] sm:gap-1.5">
            <input
              className={FORM_INPUT}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.estimatedQuantity}
              onChange={(e) => setField("estimatedQuantity", e.target.value)}
            />
            <InlineSelectWithOther
              options={CROP_UNITS}
              selectValue={form.unit}
              customValue={form.customUnit}
              onSelect={(v) => setField("unit", v)}
              onCustom={(v) => setField("customUnit", v)}
              placeholder="Unit"
              inputClass={FORM_INPUT}
            />
          </div>
        </Field>
      </Section>

      <Section title="Dates">
        <Field label="Sowing Date" required error={errors.sowingDate}>
          <input className={FORM_INPUT} type="date" value={form.sowingDate} onChange={(e) => setField("sowingDate", e.target.value)} />
        </Field>
        <Field label="Harvest Date" required error={errors.expectedHarvestDate}>
          <input
            className={FORM_INPUT}
            type="date"
            value={form.expectedHarvestDate}
            onChange={(e) => setField("expectedHarvestDate", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Farming">
        <SelectWithOther
          label="Farming Method"
          required
          options={FARMING_METHODS}
          selectValue={form.farmingMethod}
          customValue={form.customFarmingMethod}
          onSelect={(v) => setField("farmingMethod", v)}
          onCustom={(v) => setField("customFarmingMethod", v)}
          error={errors.farmingMethod}
          customLabel="Method name"
          placeholder="Enter farming method"
          inputClass={FORM_INPUT}
        />
        <SelectWithOther
          label="Irrigation Type"
          required
          options={IRRIGATION_TYPES}
          selectValue={form.irrigationType}
          customValue={form.customIrrigationType}
          onSelect={(v) => setField("irrigationType", v)}
          onCustom={(v) => setField("customIrrigationType", v)}
          error={errors.irrigationType}
          customLabel="Irrigation name"
          placeholder="Enter irrigation type"
          inputClass={FORM_INPUT}
        />
        <SelectWithOther
          label="Organic / Conventional"
          options={FARMING_TYPES}
          selectValue={form.farmingType}
          customValue={form.customFarmingType}
          onSelect={(v) => setField("farmingType", v)}
          onCustom={(v) => setField("customFarmingType", v)}
          customLabel="Type name"
          placeholder="Enter farming type"
          inputClass={FORM_INPUT}
        />
        {showStatus ? (
          <Field label="Status">
            <select className={FORM_INPUT} value={form.status} onChange={(e) => setField("status", e.target.value)}>
              {(CROP_STATUS_FLOW[initialCrop?.status || form.status] || [form.status]).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
      </Section>

      <section className="space-y-1.5">
        <h2 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Photos</h2>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {form.photos.map((photo, index) => (
            <ImageUploadField
              key={index}
              label={form.photos.length > 1 ? `Photo ${index + 1}` : "Crop photo"}
              value={photo}
              compact
              showPresets={false}
              maxSizeMb={2}
              onChange={(value) => {
                const next = [...form.photos];
                next[index] = value;
                setField("photos", next);
              }}
            />
          ))}
        </div>
        {form.photos.length < 4 ? (
          <button type="button" className={`${EXCEL_BTN} h-8 px-3 text-[11px]`} onClick={() => setField("photos", [...form.photos, ""])}>
            Add Photo
          </button>
        ) : (
          <p className="text-[10px] text-[#6B7280]">Maximum 4 crop photos.</p>
        )}
      </section>

      <div className="sticky bottom-0 z-10 -mx-2.5 border-t border-slate-100 bg-white px-2.5 py-2 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <button type="submit" disabled={submitting} className={`${EXCEL_BTN_PRIMARY} h-10 w-full px-5 text-sm sm:h-11 sm:w-auto`}>
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-1.5">
      <h2 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{title}</h2>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-3">{children}</div>
    </section>
  );
}

function Field({ label, required, error, children, className = "" }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="mb-0.5 block text-[11px] font-semibold text-slate-600 sm:mb-1 sm:text-xs">
        {label}
        {required ? " *" : ""}
      </label>
      {children}
      {error ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{error}</p> : null}
    </div>
  );
}
