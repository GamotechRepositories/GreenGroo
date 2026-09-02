import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";

const INPUT = "w-full border border-[#D4D4D4] px-2.5 py-1.5 text-xs outline-none focus:border-[#217346]";
const BTN = "border border-[#D4D4D4] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#F2F2F2] disabled:opacity-50";
const BTN_PRIMARY = "bg-[#217346] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a5c38] disabled:opacity-50";
const CROP_UNITS = ["Kg", "Quintal", "Ton"];
const FARMING_TYPES = ["Organic", "Conventional"];
const GRADES = ["A", "B", "C"];

function asList(res) {
  const data = res?.data ?? res;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.farmers)) return data.farmers;
  if (Array.isArray(data?.crops)) return data.crops;
  return [];
}

function cropIdOf(crop) {
  return crop?.cropId || crop?.id || "";
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function emptyForm() {
  return {
    cropId: "",
    cropName: "",
    productName: "",
    variety: "",
    farmingType: "",
    availableQuantity: "",
    unit: "Kg",
    harvestDate: "",
    availableFrom: "",
    availableUntil: "",
    grades: GRADES.map((grade) => ({ grade, label: `Grade ${grade}`, quantity: "" })),
    mainPhoto: "",
  };
}

export default function VendorProductAddPage() {
  const { farmerId: farmerIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lockedFarmerId = farmerIdParam || searchParams.get("farmerId") || "";

  const [farmers, setFarmers] = useState([]);
  const [farmerId, setFarmerId] = useState(lockedFarmerId);
  const [farmerName, setFarmerName] = useState("");
  const [crops, setCrops] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        if (!lockedFarmerId) {
          const list = asList(await vendorApi.getFarmers());
          if (!cancelled) setFarmers(list);
        }
        if (farmerId) {
          const [farmerRes, cropRes] = await Promise.all([
            vendorApi.getFarmerById(farmerId).catch(() => null),
            vendorApi.getFarmerCrops(farmerId).catch(() => ({ data: [] })),
          ]);
          if (!cancelled) {
            setFarmerName(farmerRes?.data?.name || "");
            setCrops(asList(cropRes));
          }
        } else if (!cancelled) {
          setFarmerName("");
          setCrops([]);
        }
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmerId, lockedFarmerId]);

  const backTo = lockedFarmerId ? `/vendor/all-farmers/${lockedFarmerId}` : "/vendor/products";

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const selectCrop = (id) => {
    const crop = crops.find((c) => cropIdOf(c) === id);
    setForm((prev) => ({
      ...prev,
      cropId: id,
      cropName: crop?.cropName || "",
      productName: crop?.cropName || "",
      variety: crop?.variety || prev.variety,
      harvestDate: crop?.expectedHarvestDate || prev.harvestDate,
      unit: crop?.unit || prev.unit,
      farmingType: crop?.farmingType || prev.farmingType,
      availableQuantity: prev.availableQuantity || crop?.estimatedQuantity || "",
    }));
    setErrors((prev) => ({ ...prev, cropId: "", productName: "", variety: "" }));
  };

  const updateGrade = (index, quantity) => {
    setForm((prev) => {
      const grades = prev.grades.map((g, i) => (i === index ? { ...g, quantity } : g));
      return { ...prev, grades };
    });
    setErrors((prev) => ({ ...prev, availableQuantity: "" }));
  };

  const payloadFromForm = () => {
    const grades = form.grades
      .filter((g) => g.grade)
      .map((g) => ({
        grade: g.grade,
        label: g.label || `Grade ${g.grade}`,
        quantity: Number(g.quantity) || 0,
        price: 0,
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
      harvestDate: form.harvestDate,
      farmingType: form.farmingType,
      availableFrom: form.availableFrom,
      availableUntil: form.availableUntil,
      grades,
      media: {
        mainPhoto: form.mainPhoto || "",
        farmPhotos: [],
        cropPhotos: [],
        harvestPhotos: [],
        videos: [],
      },
    };
  };

  const validate = (publish) => {
    const next = {};
    if (!farmerId) next.farmerId = "Select a farmer";
    if (!form.productName.trim()) next.productName = "Product name is required";
    if (!form.cropId && !form.cropName) next.cropId = "Crop is required";
    if (publish) {
      if (!form.variety.trim()) next.variety = "Variety is required";
      if (!form.unit) next.unit = "Unit is required";
      if (!form.harvestDate) next.harvestDate = "Harvest date is required";
      if (!form.farmingType) next.farmingType = "Farming type is required";
      if (!form.availableFrom) next.availableFrom = "Available from date is required";
      if (!form.availableUntil) next.availableUntil = "Available until date is required";
      if (form.availableFrom && form.availableUntil && form.availableUntil < form.availableFrom) {
        next.availableUntil = "Available until cannot be before available from";
      }
      const qty = form.grades.reduce((sum, g) => sum + Number(g.quantity || 0), 0) || Number(form.availableQuantity);
      if (!(qty > 0)) next.availableQuantity = "Quantity must be greater than 0";
      if (!form.mainPhoto) next.mainPhoto = "Main product photo is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (publish) => {
    if (!validate(publish) || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await vendorApi.createFarmerProduct(farmerId, { ...payloadFromForm(), publish });
      navigate(backTo);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-6 text-xs text-[#6B7280]">Loading…</p>;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-6">
      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
        {lockedFarmerId ? (
          <>
            <Link to="/vendor/all-farmers" className="hover:text-[#217346]">
              Farmers
            </Link>
            <span>›</span>
            <Link to={backTo} className="hover:text-[#217346]">
              {farmerName || "Farmer"}
            </Link>
          </>
        ) : (
          <Link to="/vendor/products" className="hover:text-[#217346]">
            Products
          </Link>
        )}
        <span>›</span>
        <span className="font-semibold text-[#1F2937]">Add Product</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-[#1F2937]">Add Product</h1>
          <p className="text-sm text-[#6B7280]">
            {farmerName ? `Add a product for ${farmerName}.` : "Select a farmer, then add a product."}
          </p>
        </div>
        <Link to={backTo} className="text-xs font-semibold text-[#217346] hover:underline">
          Back
        </Link>
      </div>

      {error ? <p className="text-xs text-[#DC2626]">{error}</p> : null}

      <div className="space-y-4 border border-[#D4D4D4] bg-white p-4">
        {!lockedFarmerId ? (
          <div>
            <label className="mb-0.5 block text-[11px] font-semibold text-slate-600">Farmer *</label>
            <select
              className={INPUT}
              value={farmerId}
              onChange={(e) => {
                setFarmerId(e.target.value);
                setForm(emptyForm());
              }}
            >
              <option value="">Select farmer</option>
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} {f.mobile ? `· ${f.mobile}` : ""}
                </option>
              ))}
            </select>
            {errors.farmerId ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{errors.farmerId}</p> : null}
          </div>
        ) : null}

        {!farmerId ? (
          <p className="text-xs text-[#6B7280]">Select a farmer to continue.</p>
        ) : (
          <>
            {crops.length === 0 ? (
              <p className="text-xs text-[#B45309]">
                Add a crop for this farmer first, then create a product.{" "}
                <Link
                  to={`/vendor/all-farmers/${encodeURIComponent(farmerId)}/crops/add`}
                  className="font-semibold text-[#217346] hover:underline"
                >
                  Add Crop
                </Link>
              </p>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-0.5 block text-[11px] font-semibold text-slate-600">Select Crop *</label>
                <select className={INPUT} value={form.cropId} onChange={(e) => selectCrop(e.target.value)}>
                  <option value="">Select crop</option>
                  {crops.map((crop) => (
                    <option key={cropIdOf(crop)} value={cropIdOf(crop)}>
                      {crop.cropName} {crop.variety ? `(${crop.variety})` : ""} — {cropIdOf(crop)}
                    </option>
                  ))}
                </select>
                {errors.cropId ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{errors.cropId}</p> : null}
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] font-semibold text-slate-600">Product Name *</label>
                <input className={INPUT} value={form.productName} readOnly placeholder="Select crop first" />
                {errors.productName ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{errors.productName}</p> : null}
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] font-semibold text-slate-600">Variety *</label>
                <input className={INPUT} value={form.variety} onChange={(e) => setField("variety", e.target.value)} />
                {errors.variety ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{errors.variety}</p> : null}
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] font-semibold text-slate-600">Farming Type *</label>
                <select className={INPUT} value={form.farmingType} onChange={(e) => setField("farmingType", e.target.value)}>
                  <option value="">Select</option>
                  {FARMING_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.farmingType ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{errors.farmingType}</p> : null}
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] font-semibold text-slate-600">Quantity *</label>
                <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-1.5">
                  <input
                    className={INPUT}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.availableQuantity}
                    onChange={(e) => setField("availableQuantity", e.target.value)}
                  />
                  <select className={INPUT} value={form.unit} onChange={(e) => setField("unit", e.target.value)}>
                    {CROP_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.availableQuantity ? (
                  <p className="mt-0.5 text-[10px] text-[#DC2626]">{errors.availableQuantity}</p>
                ) : null}
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] font-semibold text-slate-600">Harvest Date *</label>
                <input className={INPUT} type="date" value={form.harvestDate} onChange={(e) => setField("harvestDate", e.target.value)} />
                {errors.harvestDate ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{errors.harvestDate}</p> : null}
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] font-semibold text-slate-600">Available From *</label>
                <input className={INPUT} type="date" value={form.availableFrom} onChange={(e) => setField("availableFrom", e.target.value)} />
                {errors.availableFrom ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{errors.availableFrom}</p> : null}
              </div>
              <div>
                <label className="mb-0.5 block text-[11px] font-semibold text-slate-600">Available Until *</label>
                <input className={INPUT} type="date" value={form.availableUntil} onChange={(e) => setField("availableUntil", e.target.value)} />
                {errors.availableUntil ? (
                  <p className="mt-0.5 text-[10px] text-[#DC2626]">{errors.availableUntil}</p>
                ) : null}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-600">Grade *</p>
              <div className="space-y-1.5">
                {form.grades.map((grade, index) => (
                  <div key={grade.grade} className="grid grid-cols-[2.5rem_minmax(0,1fr)_5.5rem] items-center gap-1.5">
                    <span className="flex h-9 items-center justify-center border border-[#D4D4D4] bg-[#F9F9F9] text-xs font-semibold">
                      {grade.grade}
                    </span>
                    <input
                      className={INPUT}
                      type="number"
                      min="0"
                      placeholder="Qty"
                      value={grade.quantity}
                      onChange={(e) => updateGrade(index, e.target.value)}
                    />
                    <select className={INPUT} value={form.unit} onChange={(e) => setField("unit", e.target.value)}>
                      {CROP_UNITS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-slate-600">Main Photo *</p>
              {form.mainPhoto ? (
                <div className="mb-2 flex items-center gap-2">
                  <img src={form.mainPhoto} alt="Product" className="h-16 w-16 rounded object-cover" />
                  <button type="button" className={BTN} onClick={() => setField("mainPhoto", "")}>
                    Remove
                  </button>
                </div>
              ) : null}
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  if (!file.type.startsWith("image/")) {
                    setErrors((prev) => ({ ...prev, mainPhoto: "Please select a JPG or PNG image" }));
                    return;
                  }
                  if (file.size > 2 * 1024 * 1024) {
                    setErrors((prev) => ({ ...prev, mainPhoto: "Image must be under 2 MB" }));
                    return;
                  }
                  setField("mainPhoto", await fileToDataUrl(file));
                }}
              />
              {errors.mainPhoto ? <p className="mt-0.5 text-[10px] text-[#DC2626]">{errors.mainPhoto}</p> : null}
            </div>

            <div className="flex gap-2">
              <button type="button" className={BTN} disabled={submitting} onClick={() => submit(false)}>
                {submitting ? "Saving…" : "Save Draft"}
              </button>
              <button type="button" className={BTN_PRIMARY} disabled={submitting} onClick={() => submit(true)}>
                {submitting ? "Saving…" : "Save & Go Live"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
