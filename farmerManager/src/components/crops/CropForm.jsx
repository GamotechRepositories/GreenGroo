import { useEffect, useMemo, useState } from "react";
import {
  CROP_OPTIONS,
  varietyOptionsForCrop,
} from "../../utils/constants";
import { EXCEL_BTN_PRIMARY, FORM_INPUT } from "../../utils/excelStyles";
import {
  CROP_CATEGORY_OPTIONS,
  cropCategoryFromName,
  formatCropBusinessId,
} from "../../utils/cropLinks";
import { getCropsCatalog } from "../../api/farmerApi";

export default function CropForm({
  initialCrop,
  submitting,
  onSubmit,
  submitLabel = "Save Crop",
}) {
  const [cropName, setCropName] = useState(
    initialCrop?.cropName || initialCrop?.name || ""
  );
  const [variety, setVariety] = useState(initialCrop?.variety || "");
  const [category, setCategory] = useState(
    initialCrop?.category || "Vegetables"
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
    const set = new Set(CROP_OPTIONS.filter((c) => c !== "Other"));
    catalog.forEach((c) => {
      if (c.cropName) set.add(c.cropName);
    });
    return Array.from(set);
  }, [catalog]);

  const dynamicVarietyOptions = useMemo(() => {
    const base = varietyOptionsForCrop(cropName);
    const set = new Set(base.filter((v) => v !== "Other"));
    catalog.forEach((c) => {
      if (
        c.cropName?.toLowerCase() === cropName?.trim().toLowerCase() &&
        c.variety
      ) {
        set.add(c.variety);
      }
    });
    return Array.from(set);
  }, [cropName, catalog]);

  const onCropNameChange = (val) => {
    setCropName(val);
    setErrors((prev) => ({ ...prev, cropName: "" }));
    // Auto-detect category from crop name if available
    const detectedCode = cropCategoryFromName(val);
    const matchedOpt = CROP_CATEGORY_OPTIONS.find((c) => c.code === detectedCode);
    if (matchedOpt) {
      setCategory(matchedOpt.value);
    }
  };

  const applyCatalogCrop = (catId) => {
    setSelectedCatalogId(catId);
    if (!catId) return;
    const found = catalog.find((c) => (c.cropId || c.id) === catId);
    if (!found) return;
    setCropName(found.cropName || "");
    setVariety(found.variety || "");
    if (found.category) {
      setCategory(found.category);
    } else if (found.cropName) {
      const code = cropCategoryFromName(found.cropName);
      const matched = CROP_CATEGORY_OPTIONS.find((c) => c.code === code);
      if (matched) setCategory(matched.value);
    }
    setErrors({});
  };

  const categoryCode = useMemo(() => {
    const found = CROP_CATEGORY_OPTIONS.find(
      (c) => c.value.toLowerCase() === String(category).toLowerCase()
    );
    return found ? found.code : cropCategoryFromName(cropName, category);
  }, [category, cropName]);

  const calculatedCropId = useMemo(() => {
    if (initialCrop?.cropId || initialCrop?.id) {
      return formatCropBusinessId(initialCrop);
    }
    if (!cropName && !variety) return `GGC-CRP-${categoryCode || "VEG"}-XXX-XXX-00001`;
    return formatCropBusinessId({ cropName, variety, category, categoryCode });
  }, [cropName, variety, category, categoryCode, initialCrop]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    const trimmedCrop = cropName.trim();
    const trimmedVariety = variety.trim();
    if (!trimmedCrop) nextErrors.cropName = "Crop name is required";
    if (!trimmedVariety) nextErrors.variety = "Variety name is required";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      cropName: trimmedCrop,
      variety: trimmedVariety,
      category,
      categoryCode,
      cropId: calculatedCropId,
      // Default attributes for backend compatibility
      area: 1,
      areaUnit: "Acre",
      sowingDate: new Date().toISOString().slice(0, 10),
      expectedHarvestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      estimatedQuantity: 100,
      unit: "Kg",
      farmingMethod: "Conventional",
      farmingType: "Conventional",
      irrigationType: "Drip",
      photos: initialCrop?.photos || [],
      status: initialCrop?.status || "Planned",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      {/* Generated Crop ID display */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-sm">
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-800">
          Generated Crop ID (तयार झालेला पीक आयडी)
        </span>
        <p className="mt-1 font-mono text-base font-bold text-emerald-900 tracking-wide">
          {calculatedCropId}
        </p>
        <p className="mt-0.5 text-[11px] text-emerald-700">
          Auto-generated based on Category, Crop Name and Variety Name.
        </p>
      </div>

      {catalog.length > 0 && !initialCrop?.id && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            🌱 Choose from Existing Registered Crops (ऐच्छिक)
          </label>
          <select
            value={selectedCatalogId}
            onChange={(e) => applyCatalogCrop(e.target.value)}
            className={`${FORM_INPUT} bg-white text-xs`}
          >
            <option value="">-- Choose existing or type custom name below --</option>
            {catalog.map((c) => (
              <option key={c.cropId || c.id} value={c.cropId || c.id}>
                {c.cropName} - {c.variety} ({formatCropBusinessId(c)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Select Category / Type * */}
      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-800">
          Select Crop Category / Type (पिकाचा प्रकार) <span className="text-red-600">*</span>
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`${FORM_INPUT} text-xs py-2`}
        >
          {CROP_CATEGORY_OPTIONS.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label} ({cat.code})
            </option>
          ))}
        </select>
      </div>

      {/* Enter Crop name * */}
      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-800">
          Enter Crop name <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          list="crop-options-list"
          value={cropName}
          onChange={(e) => onCropNameChange(e.target.value)}
          placeholder="Enter crop name (e.g. Tomato, Mango, Soybean, Wheat)"
          className={`${FORM_INPUT} text-xs py-2`}
          autoFocus
        />
        <datalist id="crop-options-list">
          {dynamicCropOptions.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
        {errors.cropName && (
          <p className="text-[11px] text-red-600 font-medium mt-0.5">{errors.cropName}</p>
        )}
      </div>

      {/* Enter Variety Name * */}
      <div className="space-y-1">
        <label className="block text-xs font-bold text-slate-800">
          Enter Variety Name <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          list="variety-options-list"
          value={variety}
          onChange={(e) => {
            setVariety(e.target.value);
            setErrors((prev) => ({ ...prev, variety: "" }));
          }}
          placeholder="Enter variety name (e.g. Hybrid, Abhinav, Desi)"
          className={`${FORM_INPUT} text-xs py-2`}
        />
        <datalist id="variety-options-list">
          {dynamicVarietyOptions.map((opt) => (
            <option key={opt} value={opt} />
          ))}
        </datalist>
        {errors.variety && (
          <p className="text-[11px] text-red-600 font-medium mt-0.5">{errors.variety}</p>
        )}
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className={`${EXCEL_BTN_PRIMARY} h-10 w-full sm:w-auto px-6 text-xs font-bold shadow-sm`}
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
