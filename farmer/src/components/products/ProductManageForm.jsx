import { useState } from "react";
import ProductMediaFields from "./ProductMediaFields";
import { CROP_UNITS, FARMING_TYPES, PRODUCT_GRADE_OPTIONS } from "../../utils/constants";
import { EXCEL_BTN, EXCEL_BTN_DANGER, EXCEL_BTN_PRIMARY, EXCEL_INPUT } from "../../utils/excelStyles";

function emptyGrades() {
  return PRODUCT_GRADE_OPTIONS.map((grade) => ({
    grade,
    label: `Grade ${grade}`,
    quantity: "",
    price: "",
  }));
}

function emptyForm(defaults = {}) {
  return {
    productName: defaults.productName || defaults.name || "",
    cropId: defaults.cropId || "",
    cropName: defaults.cropName || "",
    variety: defaults.variety || "",
    availableQuantity: defaults.availableQuantity ?? "",
    unit: defaults.unit || "Kg",
    pricePerKg: defaults.pricePerKg || defaults.sellingPrice || "",
    minimumOrderQuantity: defaults.minimumOrderQuantity || "",
    harvestDate: defaults.harvestDate || "",
    farmingType: defaults.farmingType || "",
    availableFrom: defaults.availableFrom || "",
    availableUntil: defaults.availableUntil || "",
    lowStockLimit: defaults.lowStockLimit || 10,
    grades: defaults.grades?.length
      ? defaults.grades.map((g) => ({
          grade: g.grade || String(g.label || "").replace(/grade\s*/i, ""),
          label: g.label || `Grade ${g.grade || "A"}`,
          quantity: g.quantity ?? "",
          price: g.price ?? "",
        }))
      : emptyGrades(),
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
      price: Number(g.price || form.pricePerKg) || 0,
    }));
  let availableQuantity = grades.reduce((sum, g) => sum + Number(g.quantity || 0), 0);
  if (!availableQuantity && Number(form.availableQuantity) > 0) {
    availableQuantity = Number(form.availableQuantity);
    if (grades[0]) grades[0].quantity = availableQuantity;
  }
  return {
    productName: form.productName.trim(),
    name: form.productName.trim(),
    cropId: form.cropId,
    cropName: form.cropName,
    variety: form.variety.trim(),
    availableQuantity,
    unit: form.unit,
    pricePerKg: Number(form.pricePerKg) || 0,
    sellingPrice: Number(form.pricePerKg) || 0,
    minimumOrderQuantity: Number(form.minimumOrderQuantity) || 0,
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
      variety: crop?.variety || prev.variety,
      harvestDate: crop?.expectedHarvestDate || prev.harvestDate,
      unit: crop?.unit || prev.unit,
      farmingType: crop?.farmingType || prev.farmingType,
      availableQuantity: prev.availableQuantity || crop?.estimatedQuantity || "",
      media: {
        ...prev.media,
        cropPhotos: crop?.photos?.length ? crop.photos : prev.media.cropPhotos,
      },
    }));
    setErrors((prev) => ({ ...prev, cropId: "", variety: "" }));
  };

  const validate = (publish) => {
    const next = {};
    if (!form.productName.trim()) next.productName = "Product name is required";
    if (!form.cropId && !form.cropName) next.cropId = "Crop is required";
    if (publish) {
      if (!form.variety.trim()) next.variety = "Variety is required";
      if (!form.unit) next.unit = "Unit is required";
      if (!(Number(form.pricePerKg) > 0)) next.pricePerKg = "Price per Kg is required";
      if (!(Number(form.minimumOrderQuantity) > 0)) next.minimumOrderQuantity = "Minimum order quantity is required";
      if (!form.harvestDate) next.harvestDate = "Harvest date is required";
      if (!form.farmingType) next.farmingType = "Farming type is required";
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

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2">
        <Field label="Product Name *" error={errors.productName}>
          <input className={EXCEL_INPUT} value={form.productName} disabled={locked} onChange={(e) => setField("productName", e.target.value)} />
        </Field>
        <Field label="Select Crop *" error={errors.cropId}>
          <select className={EXCEL_INPUT} value={form.cropId} disabled={locked} onChange={(e) => selectCrop(e.target.value)}>
            <option value="">Select crop</option>
            {crops.map((crop) => (
              <option key={crop.cropId || crop.id} value={crop.cropId || crop.id}>
                {crop.cropName} {crop.variety ? `(${crop.variety})` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Variety *" error={errors.variety}>
          <input className={EXCEL_INPUT} value={form.variety} disabled={locked} onChange={(e) => setField("variety", e.target.value)} />
        </Field>
        <Field label="Available Quantity *" error={errors.availableQuantity}>
          <div className="flex gap-2">
            <input
              className={EXCEL_INPUT}
              type="number"
              min="0"
              step="0.01"
              value={form.availableQuantity}
              disabled={locked}
              onChange={(e) => setField("availableQuantity", e.target.value)}
            />
            <select className={EXCEL_INPUT} value={form.unit} disabled={locked} onChange={(e) => setField("unit", e.target.value)}>
              {CROP_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </Field>
        <Field label="Price per Kg *" error={errors.pricePerKg}>
          <input className={EXCEL_INPUT} type="number" min="0" step="0.01" value={form.pricePerKg} disabled={locked} onChange={(e) => setField("pricePerKg", e.target.value)} />
        </Field>
        <Field label="Minimum Order Quantity *" error={errors.minimumOrderQuantity}>
          <input className={EXCEL_INPUT} type="number" min="0" step="0.01" value={form.minimumOrderQuantity} disabled={locked} onChange={(e) => setField("minimumOrderQuantity", e.target.value)} />
        </Field>
        <Field label="Harvest Date *" error={errors.harvestDate}>
          <input className={EXCEL_INPUT} type="date" value={form.harvestDate} disabled={locked} onChange={(e) => setField("harvestDate", e.target.value)} />
        </Field>
        <Field label="Farming Type *" error={errors.farmingType}>
          <select className={EXCEL_INPUT} value={form.farmingType} disabled={locked} onChange={(e) => setField("farmingType", e.target.value)}>
            <option value="">Select</option>
            {FARMING_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Available From *" error={errors.availableFrom}>
          <input className={EXCEL_INPUT} type="date" value={form.availableFrom} disabled={locked} onChange={(e) => setField("availableFrom", e.target.value)} />
        </Field>
        <Field label="Available Until *" error={errors.availableUntil}>
          <input className={EXCEL_INPUT} type="date" value={form.availableUntil} disabled={locked} onChange={(e) => setField("availableUntil", e.target.value)} />
        </Field>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold">Grade *</p>
          <button
            type="button"
            className={EXCEL_BTN}
            disabled={locked}
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                grades: [...prev.grades, { grade: "", label: "", quantity: "", price: "" }],
              }))
            }
          >
            Add Grade
          </button>
        </div>
        {errors.grades ? <p className="mb-1 text-xs text-[#DC2626]">{errors.grades}</p> : null}
        <div className="space-y-2">
          {form.grades.map((grade, index) => (
            <div key={`${grade.grade}-${index}`} className="grid gap-2 sm:grid-cols-4">
              <select
                className={EXCEL_INPUT}
                value={grade.grade}
                disabled={locked}
                onChange={(e) => {
                  const next = [...form.grades];
                  next[index] = { ...grade, grade: e.target.value, label: `Grade ${e.target.value}` };
                  setField("grades", next);
                }}
              >
                <option value="">Grade</option>
                {PRODUCT_GRADE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    Grade {option}
                  </option>
                ))}
              </select>
              <input
                className={EXCEL_INPUT}
                type="number"
                min="0"
                placeholder="Quantity"
                value={grade.quantity}
                disabled={locked}
                onChange={(e) => {
                  const next = [...form.grades];
                  next[index] = { ...grade, quantity: e.target.value };
                  setField("grades", next);
                }}
              />
              <input
                className={EXCEL_INPUT}
                type="number"
                min="0"
                placeholder="Price"
                value={grade.price}
                disabled={locked}
                onChange={(e) => {
                  const next = [...form.grades];
                  next[index] = { ...grade, price: e.target.value };
                  setField("grades", next);
                }}
              />
              <button
                type="button"
                className={EXCEL_BTN_DANGER}
                disabled={locked || form.grades.length <= 1}
                onClick={() => setField("grades", form.grades.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold">Product Photos & Media</p>
        <ProductMediaFields
          media={form.media}
          mainPhotoError={errors.mainPhoto}
          onChange={(media) => setField("media", media)}
        />
      </section>

      {locked ? (
        <p className="text-xs text-[#6B7280]">This product is pending approval and cannot be edited.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={submitting} className={EXCEL_BTN} onClick={() => submit(false)}>
            {submitting ? "Saving…" : "Save as Draft"}
          </button>
          <button type="button" disabled={submitting} className={EXCEL_BTN_PRIMARY} onClick={() => submit(true)}>
            {submitting ? "Publishing…" : "Publish Product"}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-[#DC2626]">{error}</p> : null}
    </div>
  );
}
