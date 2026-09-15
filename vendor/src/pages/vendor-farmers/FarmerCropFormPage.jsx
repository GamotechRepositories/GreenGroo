import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";
import {
  CROP_CATEGORY_OPTIONS,
  cropCategoryFromName,
  formatCropBusinessId,
} from "../../utils/cropLinks";

const INPUT =
  "w-full rounded-lg border border-[#D4D4D4] bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#217346] shadow-sm";
const CROP_OPTIONS = [
  "Tomato", "Onion", "Potato", "Capsicum", "Brinjal", "Cabbage", "Cauliflower", "Okra",
  "Chilli", "Cotton", "Soybean", "Wheat", "Rice", "Sugarcane", "Grapes", "Pomegranate",
  "Banana", "Maize", "Groundnut", "Turmeric",
];

export default function FarmerCropFormPage() {
  const { farmerId: farmerIdParam, cropId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lockedFarmerId = farmerIdParam || searchParams.get("farmerId") || "";
  const isEdit = Boolean(cropId);

  const [farmers, setFarmers] = useState([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState(lockedFarmerId);
  const [catalog, setCatalog] = useState([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [cropName, setCropName] = useState("");
  const [variety, setVariety] = useState("");
  const [category, setCategory] = useState("Vegetables");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [farmerName, setFarmerName] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let cancelled = false;
    vendorApi.getCropsCatalog().then((list) => {
      if (!cancelled && Array.isArray(list)) setCatalog(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const dynamicCropOptions = useMemo(() => {
    const set = new Set(CROP_OPTIONS);
    catalog.forEach((c) => {
      if (c.cropName) set.add(c.cropName);
    });
    return Array.from(set);
  }, [catalog]);

  const dynamicVarietyOptions = useMemo(() => {
    const set = new Set(["Hybrid", "Desi", "Abhinav", "Super 10", "F1"]);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!lockedFarmerId) {
          const res = await vendorApi.getFarmers();
          const list = Array.isArray(res?.data) ? res.data : res?.data?.farmers || [];
          if (!cancelled) {
            setFarmers(list);
            if (!selectedFarmerId && list.length > 0) {
              setSelectedFarmerId(list[0].id);
            }
          }
        }
      } catch {
        // ignore
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
        const farmer = (await vendorApi.getFarmerById(selectedFarmerId)).data;
        if (cancelled) return;
        setFarmerName(farmer?.name || "");
        if (isEdit && cropId) {
          const crop = (await vendorApi.getFarmerCrop(selectedFarmerId, cropId)).data;
          if (!cancelled && crop) {
            setCropName(crop.cropName || crop.name || "");
            setVariety(crop.variety || "");
            if (crop.category) setCategory(crop.category);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load crop");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedFarmerId, cropId, isEdit]);

  const backTo = lockedFarmerId ? `/vendor/all-farmers/${lockedFarmerId}` : "/vendor/crops";

  const categoryCode = useMemo(() => {
    const found = CROP_CATEGORY_OPTIONS.find(
      (c) => c.value.toLowerCase() === String(category).toLowerCase()
    );
    return found ? found.code : cropCategoryFromName(cropName, category);
  }, [category, cropName]);

  const calculatedCropId = useMemo(() => {
    if (!cropName && !variety) return `GGC-CRP-${categoryCode || "VEG"}-XXX-XXX-00001`;
    return formatCropBusinessId({ cropName, variety, category, categoryCode });
  }, [cropName, variety, category, categoryCode]);

  const onSubmit = async (e) => {
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

    setSubmitting(true);
    setError("");

    const targetFarmer = selectedFarmerId || (farmers[0]?.id || "farmer-1");

    const payload = {
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
      photos: [],
      status: "Planned",
    };

    try {
      const saved = isEdit
        ? (await vendorApi.updateFarmerCrop(targetFarmer, cropId, payload)).data
        : (await vendorApi.createFarmerCrop(targetFarmer, payload)).data;
      const id = saved.cropId || saved.id;
      if (lockedFarmerId) {
        navigate(`/vendor/all-farmers/${targetFarmer}/crops/${encodeURIComponent(id)}`);
      } else {
        navigate("/vendor/crops");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save crop");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-6 text-xs text-[#6B7280]">Loading…</p>;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 sm:p-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
        {lockedFarmerId ? (
          <>
            <Link to="/vendor/all-farmers" className="hover:text-[#217346]">Farmers</Link>
            <span>›</span>
            <Link to={backTo} className="hover:text-[#217346]">{farmerName || "Farmer"}</Link>
          </>
        ) : (
          <Link to="/vendor/crops" className="hover:text-[#217346]">All Crops</Link>
        )}
        <span>›</span>
        <span className="font-semibold text-[#1F2937]">{isEdit ? "Edit Crop" : "Add Crop"}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-[#1F2937]">{isEdit ? "Edit Crop" : "Add Crop"}</h1>
          <p className="text-xs text-[#6B7280]">
            {isEdit
              ? "Update crop details."
              : "Enter crop category, name and variety to register a new crop in the system."}
          </p>
        </div>
        <Link to={backTo} className="text-xs font-semibold text-[#217346] hover:underline">Back</Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-[#DC2626]">
          {error}
        </div>
      ) : null}

      {/* Form Container */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
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

          {catalog.length > 0 && !isEdit && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                🌱 Choose from Existing Registered Crops (ऐच्छिक)
              </label>
              <select
                value={selectedCatalogId}
                onChange={(e) => applyCatalogCrop(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#217346]"
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
              className={INPUT}
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
              list="vendor-crop-options-list"
              value={cropName}
              onChange={(e) => onCropNameChange(e.target.value)}
              placeholder="Enter crop name (e.g. Tomato, Mango, Soybean, Wheat)"
              className={INPUT}
              autoFocus
            />
            <datalist id="vendor-crop-options-list">
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
              list="vendor-variety-options-list"
              value={variety}
              onChange={(e) => {
                setVariety(e.target.value);
                setErrors((prev) => ({ ...prev, variety: "" }));
              }}
              placeholder="Enter variety name (e.g. Hybrid, Abhinav, Desi)"
              className={INPUT}
            />
            <datalist id="vendor-variety-options-list">
              {dynamicVarietyOptions.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
            {errors.variety && (
              <p className="text-[11px] text-red-600 font-medium mt-0.5">{errors.variety}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Link
              to={backTo}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#217346] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1B5E38] disabled:opacity-50 transition-colors"
            >
              {submitting ? "Saving…" : isEdit ? "Update Crop" : "Save Crop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
