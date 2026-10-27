import { useEffect, useMemo, useState } from "react";
import ImageUploadField from "../ui/ImageUploadField";
import SelectWithOther, { InlineSelectWithOther, resolvePreset, splitPreset } from "../ui/SelectWithOther";
import {
  AREA_UNITS,
  CROP_OPTIONS,
  CROP_STATUS_FLOW,
  CROP_UNITS,
  FARMING_METHODS,
  FARMING_TYPES,
  IRRIGATION_TYPES,
  varietyOptionsForCrop,
} from "../../utils/constants";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY, FORM_INPUT } from "../../utils/excelStyles";
import { formatCropBusinessId } from "../../utils/cropLinks";
import { getCropsCatalog } from "../../api/farmerApi";

function emptyCrop(defaults = {}) {
  const crop = splitPreset(CROP_OPTIONS, defaults.cropName);
  const cropNameResolved = resolvePreset(crop.select, crop.custom) || defaults.cropName || "";
  const varietyOpts = varietyOptionsForCrop(cropNameResolved);
  const variety = splitPreset(varietyOpts, defaults.variety);
  const areaUnit = splitPreset(AREA_UNITS, defaults.areaUnit || "Acre");
  const unit = splitPreset(CROP_UNITS, defaults.unit || "Kg");
  const farmingMethod = splitPreset(FARMING_METHODS, defaults.farmingMethod);
  const farmingType = splitPreset(FARMING_TYPES, defaults.farmingType);
  const irrigationType = splitPreset(IRRIGATION_TYPES, defaults.irrigationType);
  return {
    cropName: crop.select,
    customCropName: crop.custom,
    variety: variety.select,
    customVariety: variety.custom,
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

function catalogCropKey(item) {
  return `${String(item?.cropId || item?.id || "").trim()}::${String(item?.cropName || item?.name || "").trim().toLowerCase()}::${String(item?.variety || "").trim().toLowerCase()}`;
}

export default function CropForm({
  initialCrop,
  farmAreaUnit = "Acre",
  submitting,
  onSubmit,
  submitLabel = "Save Crop",
  showStatus = false,
  restrictToCatalog = false,
}) {
  const isEdit = Boolean(initialCrop?.id || initialCrop?.cropId);
  const catalogOnly = restrictToCatalog && !isEdit;
  const [form, setForm] = useState(() =>
    emptyCrop({
      ...initialCrop,
      areaUnit: initialCrop?.areaUnit || farmAreaUnit || "Acre",
    })
  );
  const [catalog, setCatalog] = useState([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    getCropsCatalog().then((list) => {
      if (!cancelled && Array.isArray(list)) setCatalog(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dynamicCropOptions = useMemo(() => {
    const registeredCrops = [...new Set(catalog.map((c) => String(c.cropName || c.name || "").trim()).filter(Boolean))];
    if (registeredCrops.length > 0) {
      return [...registeredCrops, "Other"];
    }
    return [...CROP_OPTIONS];
  }, [catalog]);

  const resolvedCropName = resolvePreset(form.cropName, form.customCropName);
  const varietyOptions = useMemo(() => {
    if (!resolvedCropName) return ["Other"];
    const regVarieties = catalog
      .filter((c) => String(c.cropName || c.name || "").trim().toLowerCase() === resolvedCropName.toLowerCase())
      .map((c) => String(c.variety || "").trim())
      .filter(Boolean);

    const uniqueReg = [...new Set(regVarieties)];
    if (uniqueReg.length > 0) {
      return [...uniqueReg, "Other"];
    }
    const base = varietyOptionsForCrop(resolvedCropName).filter((v) => v !== "Other");
    return base.length > 0 ? [...base, "Other"] : ["Other"];
  }, [resolvedCropName, catalog]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const applyCatalogRow = (found) => {
    const cropName = String(found?.cropName || found?.name || "").trim();
    const variety = String(found?.variety || "").trim();
    const cropSplit = splitPreset(dynamicCropOptions, cropName);
    const varOpts = variety
      ? [...new Set([variety, ...varietyOptionsForCrop(cropName).filter((v) => v !== "Other")]), "Other"]
      : varietyOptionsForCrop(cropName);
    const varSplit = splitPreset(varOpts, variety);
    setForm((prev) => ({
      ...prev,
      cropName: cropSplit.select,
      customCropName: cropSplit.custom,
      variety: varSplit.select,
      customVariety: varSplit.custom,
      unit: prev.unit || found?.unit || "Kg",
      farmingMethod: prev.farmingMethod || found?.farmingMethod || prev.farmingMethod,
      farmingType: prev.farmingType || found?.farmingType || prev.farmingType,
      irrigationType: prev.irrigationType || found?.irrigationType || prev.irrigationType,
      photos: found?.photos?.length && !prev.photos?.filter(Boolean).length ? found.photos : prev.photos,
    }));
    setErrors((prev) => ({ ...prev, cropName: "", variety: "" }));
  };

  const applyCatalogCrop = (catId) => {
    setSelectedCatalogId(catId);
    if (!catId) {
      if (catalogOnly) {
        setForm((prev) => ({
          ...prev,
          cropName: "",
          customCropName: "",
          variety: "",
          customVariety: "",
        }));
      }
      return;
    }
    const found = catalog.find((c) => catalogCropKey(c) === catId || String(c.cropId || c.id) === catId);
    if (found) applyCatalogRow(found);
  };

  const syncDefaultsFromCatalog = (cropName, variety) => {
    if (!cropName) return;
    const found = catalog.find(
      (c) =>
        String(c.cropName || c.name || "").trim().toLowerCase() === cropName.toLowerCase() &&
        (!variety || String(c.variety || "").trim().toLowerCase() === variety.toLowerCase())
    );
    if (!found) return;

    setForm((prev) => ({
      ...prev,
      unit: prev.unit || found.unit || "Kg",
      farmingMethod: prev.farmingMethod || found.farmingMethod || "Conventional",
      farmingType: prev.farmingType || found.farmingType || "Conventional",
      irrigationType: prev.irrigationType || found.irrigationType || "Drip",
      photos: found.photos?.length && !prev.photos?.filter(Boolean).length ? found.photos : prev.photos,
    }));
  };

  const onCropSelect = (v) => {
    const nextName = resolvePreset(v, v === "Other" ? form.customCropName : "");
    const matchingCatalog = catalog.filter((c) => String(c.cropName || c.name || "").trim().toLowerCase() === String(nextName).trim().toLowerCase());
    const regVarieties = [...new Set(matchingCatalog.map((c) => String(c.variety || "").trim()).filter(Boolean))];
    const availableOpts = regVarieties.length > 0 ? [...regVarieties, "Other"] : [...varietyOptionsForCrop(nextName).filter((x) => x !== "Other"), "Other"];

    const currentVariety = resolvePreset(form.variety, form.customVariety);
    const stillValid = availableOpts.includes(currentVariety);
    const nextVariety = stillValid
      ? currentVariety
      : regVarieties.length === 1
      ? regVarieties[0]
      : "";

    setForm((prev) => {
      const splitVar = splitPreset(availableOpts, nextVariety);
      return {
        ...prev,
        cropName: v,
        customCropName: v === "Other" ? prev.customCropName : "",
        variety: splitVar.select,
        customVariety: splitVar.custom,
      };
    });
    setErrors((prev) => ({ ...prev, cropName: "", variety: "" }));
    if (nextName) {
      syncDefaultsFromCatalog(nextName, nextVariety);
    }
  };

  const onCropCustom = (v) => {
    setForm((prev) => ({
      ...prev,
      customCropName: v,
      variety: "",
      customVariety: "",
    }));
    setErrors((prev) => ({ ...prev, cropName: "", variety: "" }));
  };

  const onVarietyChange = (v, isCustom = false) => {
    if (isCustom) {
      setField("customVariety", v);
      syncDefaultsFromCatalog(resolvedCropName, v);
    } else {
      setField("variety", v);
      const varName = resolvePreset(v, form.customVariety);
      syncDefaultsFromCatalog(resolvedCropName, varName);
    }
  };

  const validate = () => {
    const cropName = resolvePreset(form.cropName, form.customCropName);
    const variety = resolvePreset(form.variety, form.customVariety);
    const areaUnit = resolvePreset(form.areaUnit, form.customAreaUnit);
    const unit = resolvePreset(form.unit, form.customUnit);
    const farmingMethod = resolvePreset(form.farmingMethod, form.customFarmingMethod);
    const farmingType = resolvePreset(form.farmingType, form.customFarmingType);
    const irrigationType = resolvePreset(form.irrigationType, form.customIrrigationType);
    const next = {};
    if (catalogOnly && !selectedCatalogId) next.cropName = "Select a crop from your collection centre";
    if (!cropName) next.cropName = next.cropName || "Crop is required";
    if (!variety) next.variety = "Variety is required";
    if (catalogOnly && cropName) {
      const allowed = catalog.some(
        (c) =>
          String(c.cropName || c.name || "").trim().toLowerCase() === cropName.toLowerCase() &&
          (!String(c.variety || "").trim() ||
            String(c.variety || "").trim().toLowerCase() === variety.toLowerCase())
      );
      if (!allowed) next.cropName = "Choose a crop from your collection centre list";
    }
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
    return { ok: Object.keys(next).length === 0, cropName, variety, areaUnit, unit, farmingMethod, farmingType, irrigationType };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { ok, cropName, variety, areaUnit, unit, farmingMethod, farmingType, irrigationType } = validate();
    if (!ok) return;
    onSubmit({
      cropName,
      variety,
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

  const resolvedVariety = resolvePreset(form.variety, form.customVariety);
  const previewId = formatCropBusinessId({
    cropName: resolvedCropName,
    variety: resolvedVariety,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-5">
      {initialCrop?.cropId || initialCrop?.id ? (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Crop ID</p>
          <p className="truncate font-mono text-xs font-bold tracking-wide text-emerald-800 sm:text-sm">
            {formatCropBusinessId(initialCrop)}
          </p>
        </div>
      ) : resolvedCropName && resolvedVariety ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Crop ID preview</p>
          <p className="truncate font-mono text-xs font-bold tracking-wide text-emerald-800 sm:text-sm">{previewId}</p>
        </div>
      ) : null}

      <Section title="Crop">
        {catalogOnly ? (
          <>
            {catalog.length === 0 ? (
              <p className="col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Your collection centre has no crops yet. Ask them to add crops first.
              </p>
            ) : null}
            <Field label="Select Crop" required error={errors.cropName} className="col-span-2">
              <select
                className={FORM_INPUT}
                value={selectedCatalogId}
                disabled={catalog.length === 0}
                onChange={(e) => applyCatalogCrop(e.target.value)}
              >
                <option value="">Select crop</option>
                {catalog.map((crop) => (
                  <option key={catalogCropKey(crop)} value={catalogCropKey(crop)}>
                    {crop.cropName || crop.name}
                    {crop.variety ? ` · ${crop.variety}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Crop Name" required>
              <input className={FORM_INPUT} value={resolvedCropName} readOnly disabled={!selectedCatalogId} placeholder="Select crop first" />
            </Field>
            <Field label="Variety" required error={errors.variety}>
              <input
                className={FORM_INPUT}
                value={resolvedVariety}
                readOnly
                disabled={!selectedCatalogId}
                placeholder={selectedCatalogId ? "Auto selected" : "Select crop first"}
              />
            </Field>
          </>
        ) : (
          <>
            <SelectWithOther
              label="Select Crop"
              required
              options={dynamicCropOptions}
              selectValue={form.cropName}
              customValue={form.customCropName}
              onSelect={onCropSelect}
              onCustom={onCropCustom}
              error={errors.cropName}
              customLabel="Crop name"
              placeholder="Enter crop name"
              inputClass={FORM_INPUT}
            />
            <SelectWithOther
              label="Variety"
              required
              options={varietyOptions}
              selectValue={form.variety}
              customValue={form.customVariety}
              onSelect={(v) => onVarietyChange(v, false)}
              onCustom={(v) => onVarietyChange(v, true)}
              error={errors.variety}
              customLabel="Variety name"
              placeholder="Enter variety"
              inputClass={FORM_INPUT}
            />
          </>
        )}
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
