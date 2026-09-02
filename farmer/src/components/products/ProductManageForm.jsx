import { useState } from "react";
import ProductMediaFields from "./ProductMediaFields";
import { CROP_UNITS, FARMING_TYPES, PRODUCT_GRADE_OPTIONS } from "../../utils/constants";
import { EXCEL_BTN, EXCEL_BTN_DANGER, EXCEL_BTN_PRIMARY, FORM_CONTROL, FORM_INPUT } from "../../utils/excelStyles";
import { formatCropBusinessId } from "../../utils/cropLinks";
import { OTHER_OPTION, splitPreset } from "../ui/SelectWithOther";

function gradesFromDefaults(defaults = {}) {
  const byGrade = new Map(
    (defaults.grades || []).map((g) => {
      const grade = g.grade || String(g.label || "").replace(/grade\s*/i, "").trim();
      return [
        grade,
        {
          grade,
          label: g.label || `Grade ${grade}`,
          quantity: g.quantity ?? "",
          price: g.price ?? "",
        },
      ];
    })
  );
  return PRODUCT_GRADE_OPTIONS.map(
    (grade) => byGrade.get(grade) || { grade, label: `Grade ${grade}`, quantity: "", price: "" }
  );
}

function emptyForm(defaults = {}) {
  return {
    productName: defaults.productName || defaults.name || defaults.cropName || "",
    cropId: defaults.cropId || "",
    cropName: defaults.cropName || "",
    variety: defaults.variety || "",
    availableQuantity: defaults.availableQuantity ?? "",
    unit: defaults.unit || "Kg",
    harvestDate: defaults.harvestDate || "",
    farmingType: defaults.farmingType || "",
    availableFrom: defaults.availableFrom || "",
    availableUntil: defaults.availableUntil || "",
    lowStockLimit: defaults.lowStockLimit || 10,
    grades: gradesFromDefaults(defaults),
    media: {
      mainPhoto: defaults.media?.mainPhoto || defaults.image || "",
      farmPhotos: defaults.media?.farmPhotos?.length ? defaults.media.farmPhotos : [""],
      cropPhotos: defaults.media?.cropPhotos?.length ? defaults.media.cropPhotos : [""],
      harvestPhotos: defaults.media?.harvestPhotos?.length ? defaults.media.harvestPhotos : [""],
      videos: defaults.media?.videos?.length ? defaults.media.videos : [""],
    },
  };
}

function payloadFromForm(form) {
  const grades = form.grades
    .filter((g) => g.grade)
    .map((g) => ({
      grade: g.grade,
      label: g.label || `Grade ${g.grade}`,
      quantity: Number(g.quantity) || 0,
      price: Number(g.price) || 0,
    }));
  let availableQuantity = grades.reduce((sum, g) => sum + Number(g.quantity || 0), 0);
  if (!availableQuantity && Number(form.availableQuantity) > 0) {
    availableQuantity = Number(form.availableQuantity);
    if (grades[0]) grades[0].quantity = availableQuantity;
  }
  const pricePerKg = Number(grades.find((g) => Number(g.price) > 0)?.price) || 0;
  return {
    productName: form.productName.trim(),
    name: form.productName.trim(),
    cropId: form.cropId,
    cropName: form.cropName,
    variety: form.variety.trim(),
    availableQuantity,
    unit: form.unit,
    pricePerKg,
    sellingPrice: pricePerKg,
    harvestDate: form.harvestDate,
    farmingType: form.farmingType,
    availableFrom: form.availableFrom,
    availableUntil: form.availableUntil,
    lowStockLimit: Number(form.lowStockLimit) || 10,
    grades,
    media: {
      mainPhoto: form.media.mainPhoto || "",
      farmPhotos: (form.media.farmPhotos || []).filter(Boolean),
      cropPhotos: (form.media.cropPhotos || []).filter(Boolean),
      harvestPhotos: (form.media.harvestPhotos || []).filter(Boolean),
      videos: (form.media.videos || []).filter(Boolean),
    },
  };
}

export default function ProductManageForm({
  crops = [],
  initialProduct,
  submitting,
  onSubmit,
  locked = false,
}) {
  const [form, setForm] = useState(() => emptyForm(initialProduct));
  const [errors, setErrors] = useState({});

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const selectCrop = (cropId) => {
    const crop = crops.find((c) => (c.cropId || c.id) === cropId);
    setForm((prev) => ({
      ...prev,
      cropId,
      cropName: crop?.cropName || "",
      productName: crop?.cropName || "",
      variety: crop?.variety || "",
      harvestDate: crop?.expectedHarvestDate || prev.harvestDate,
      unit: crop?.unit || prev.unit,
      farmingType: crop?.farmingType || prev.farmingType,
      availableQuantity: prev.availableQuantity || crop?.estimatedQuantity || "",
      media: {
        ...prev.media,
        cropPhotos: crop?.photos?.length ? crop.photos : prev.media.cropPhotos,
      },
    }));
    setErrors((prev) => ({ ...prev, cropId: "", productName: "", variety: "" }));
  };

  const validate = (publish) => {
    const next = {};
    if (!form.productName.trim()) next.productName = "Product name is required";
    if (!form.cropId && !form.cropName) next.cropId = "Crop is required";
    if (publish) {
      if (!form.variety.trim()) next.variety = "Variety is required";
      if (!form.unit) next.unit = "Unit is required";
      if (!form.harvestDate) next.harvestDate = "Harvest date is required";
      if (!form.farmingType || form.farmingType === "Other") next.farmingType = "Farming type is required";
      if (!form.availableFrom) next.availableFrom = "Available from date is required";
      if (!form.availableUntil) next.availableUntil = "Available until date is required";
      if (form.availableFrom && form.availableUntil && form.availableUntil < form.availableFrom) {
        next.availableUntil = "Available until cannot be before available from";
      }
      const qty = form.grades.reduce((sum, g) => sum + Number(g.quantity || 0), 0) || Number(form.availableQuantity);
      if (!(qty > 0)) next.availableQuantity = "Quantity must be greater than 0";
      if (!form.grades.length) next.grades = "Add at least one grade";
      if (!form.media.mainPhoto) next.mainPhoto = "Main product photo is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (publish) => {
    if (locked) return;
    if (!validate(publish)) return;
    onSubmit(payloadFromForm(form), publish);
  };

  const updateGrade = (index, patch) => {
    const next = [...form.grades];
    next[index] = { ...form.grades[index], ...patch };
    setField("grades", next);
  };

  const unusedGrades = PRODUCT_GRADE_OPTIONS.filter((g) => !form.grades.some((row) => row.grade === g));

  const addGrade = () => {
    const grade = unusedGrades[0];
    if (!grade) return;
    setField("grades", [...form.grades, { grade, label: `Grade ${grade}`, quantity: "", price: "" }]);
  };

  const removeGrade = (index) => {
    if (form.grades.length <= 1) return;
    setField("grades", form.grades.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2.5 sm:space-y-5">
      <Section title="Product">
        <Field label="Select Crop" required error={errors.cropId} className="col-span-2">
          <select className={FORM_INPUT} value={form.cropId} disabled={locked} onChange={(e) => selectCrop(e.target.value)}>
            <option value="">Select crop</option>
            {crops.map((crop) => (
              <option key={crop.cropId || crop.id} value={crop.cropId || crop.id}>
                {crop.cropName} {crop.variety ? `(${crop.variety})` : ""} — {formatCropBusinessId(crop)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Product Name" required error={errors.productName}>
          <input
            className={FORM_INPUT}
            value={form.productName}
            disabled={locked || !form.cropId}
            readOnly
            placeholder="Select crop first"
          />
        </Field>
        <Field label="Variety" required error={errors.variety}>
          <input className={FORM_INPUT} value={form.variety} disabled={locked} onChange={(e) => setField("variety", e.target.value)} />
        </Field>
        <Field label="Farming Type" required error={errors.farmingType}>
          <select
            className={FORM_INPUT}
            value={splitPreset(FARMING_TYPES, form.farmingType).select}
            disabled={locked}
            onChange={(e) =>
              setField(
                "farmingType",
                e.target.value === OTHER_OPTION ? splitPreset(FARMING_TYPES, form.farmingType).custom || OTHER_OPTION : e.target.value
              )
            }
          >
            <option value="">Select</option>
            {FARMING_TYPES.filter((type) => type !== OTHER_OPTION).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
            <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
          </select>
          {splitPreset(FARMING_TYPES, form.farmingType).select === OTHER_OPTION ? (
            <input
              className={`${FORM_INPUT} mt-1`}
              placeholder="Specify farming type"
              disabled={locked}
              value={splitPreset(FARMING_TYPES, form.farmingType).custom}
              onChange={(e) => setField("farmingType", e.target.value)}
            />
          ) : null}
        </Field>
        <Field label="Quantity" required error={errors.availableQuantity}>
          <div className="grid grid-cols-[minmax(0,1fr)_4.25rem] gap-1 sm:grid-cols-[minmax(0,1fr)_6.5rem] sm:gap-1.5">
            <input
              className={`${FORM_CONTROL} w-full`}
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={form.availableQuantity}
              disabled={locked}
              onChange={(e) => setField("availableQuantity", e.target.value)}
            />
            <select className={`${FORM_CONTROL} w-full px-1.5`} value={form.unit} disabled={locked} onChange={(e) => setField("unit", e.target.value)}>
              {CROP_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </Field>
        <Field label="Harvest Date" required error={errors.harvestDate}>
          <input className={FORM_INPUT} type="date" value={form.harvestDate} disabled={locked} onChange={(e) => setField("harvestDate", e.target.value)} />
        </Field>
        <Field label="From" required error={errors.availableFrom}>
          <input className={FORM_INPUT} type="date" value={form.availableFrom} disabled={locked} onChange={(e) => setField("availableFrom", e.target.value)} />
        </Field>
        <Field label="Until" required error={errors.availableUntil}>
          <input className={FORM_INPUT} type="date" value={form.availableUntil} disabled={locked} onChange={(e) => setField("availableUntil", e.target.value)} />
        </Field>
      </Section>

      <section className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Grade *</h2>
          {unusedGrades.length ? (
            <button type="button" className={`${EXCEL_BTN} h-8 min-h-0 px-3 text-[11px]`} disabled={locked} onClick={addGrade}>
              + Add
            </button>
          ) : null}
        </div>
        {errors.grades ? <p className="text-[10px] text-[#DC2626]">{errors.grades}</p> : null}
        <div className="grid grid-cols-[2rem_minmax(0,1fr)_4.25rem_1.75rem] gap-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:grid-cols-[2.75rem_minmax(0,1fr)_5.5rem_2.25rem] sm:gap-2">
          <span>Grade</span>
          <span>Qty</span>
          <span>Unit</span>
          <span className="sr-only">Delete</span>
        </div>
        <div className="space-y-1.5">
          {form.grades.map((grade, index) => (
            <div
              key={grade.grade}
              className="grid grid-cols-[2rem_minmax(0,1fr)_4.25rem_1.75rem] items-center gap-1 sm:grid-cols-[2.75rem_minmax(0,1fr)_5.5rem_2.25rem] sm:gap-2"
            >
              <span className="flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                {grade.grade}
              </span>
              <input
                className={`${FORM_CONTROL} w-full px-1.5 sm:px-2.5`}
                type="number"
                min="0"
                inputMode="decimal"
                placeholder="Qty"
                value={grade.quantity}
                disabled={locked}
                aria-label={`Grade ${grade.grade} quantity`}
                onChange={(e) => updateGrade(index, { quantity: e.target.value })}
              />
              <select
                className={`${FORM_CONTROL} w-full px-1`}
                value={form.unit}
                disabled={locked}
                aria-label={`Grade ${grade.grade} unit`}
                onChange={(e) => setField("unit", e.target.value)}
              >
                {CROP_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={`${EXCEL_BTN_DANGER} h-10 min-h-0 w-full px-0 text-base`}
                disabled={locked || form.grades.length <= 1}
                aria-label={`Delete grade ${grade.grade}`}
                onClick={() => removeGrade(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-1.5">
        <h2 className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Photos</h2>
        <ProductMediaFields
          media={form.media}
          mainPhotoError={errors.mainPhoto}
          onChange={(media) => setField("media", media)}
        />
      </section>

      {locked ? (
        <p className="text-[11px] text-[#6B7280]">This product is pending approval and cannot be edited.</p>
      ) : (
        <div className="sticky bottom-0 z-10 -mx-2 border-t border-slate-100 bg-white px-2 py-2 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <div className="flex gap-2">
            <button type="button" disabled={submitting} className={`${EXCEL_BTN} h-10 min-h-0 flex-1 px-3 text-sm sm:h-11 sm:flex-none`} onClick={() => submit(false)}>
              {submitting ? "Saving…" : "Save Draft"}
            </button>
            <button type="button" disabled={submitting} className={`${EXCEL_BTN_PRIMARY} h-10 min-h-0 flex-1 px-3 text-sm sm:h-11 sm:flex-none`} onClick={() => submit(true)}>
              {submitting ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
      )}
    </div>
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
