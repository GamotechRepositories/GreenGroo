import { useEffect, useMemo, useRef, useState } from "react";
import { managerApi } from "../../api/managerApi";
import {
  DEFAULT_DEPARTMENTS,
  departmentPrefix,
  previewDepartmentId,
  storeTypeFor,
  toDepartment,
} from "./productDepartments";

const STEPS = [
  { id: "basic", label: "Basic Details" },
  { id: "pricing", label: "Pricing & Units" },
  { id: "media", label: "Media & Details" },
  { id: "farmer", label: "Farmer Traceability" },
];

const FARMER_DETAIL_FIELDS = [
  ["totalArea", "Total area"],
  ["cultivationArea", "Cultivation area"],
  ["cropCycle", "Crop cycle"],
  ["agricultureMethod", "Agriculture method"],
  ["lastCropTaken", "Last crop taken"],
  ["currentCrop", "Current crop"],
  ["waterSource", "Water source"],
  ["soilType", "Soil type"],
  ["farmTools", "Farm tools"],
];

const INPUT =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-500";
const LABEL = "block text-xs font-bold text-slate-700 mb-1";

const emptyVariant = () => ({ name: "", price: "", discountedPrice: "", stock: 20 });

function emptyForm(department = "preorder") {
  return {
    department,
    deptNumber: "",
    rackRow: "",
    rackColumn: "",
    name: "",
    sku: "",
    varietyName: "",
    category: "",
    subcategory: "",
    brandName: "GreenGrocc",
    variantType: "single",
    unit: "1 Piece",
    price: "",
    discountedPrice: "",
    stock: 50,
    minOrderQuantity: 1,
    maxOrderQuantity: "",
    stepByQuantity: 1,
    variants: [],
    productImages: [],
    videoUrl: "",
    description: "",
    features: [],
    specifications: [],
    badge: "",
    cardGlowColor: "",
    isActive: true,
    farmerName: "",
    farmerLocation: "",
    farmerImage: "",
    farmImage: "",
    harvestingDate: "",
    farmerDetails: Object.fromEntries([...FARMER_DETAIL_FIELDS.map(([k]) => [k, ""]), ["bio", ""]]),
  };
}

function formFromProduct(product) {
  const base = emptyForm(product.section || "preorder");
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  return {
    ...base,
    deptNumber: product.deptNumber || "",
    rackRow: product.rackRow || "",
    rackColumn: product.rackColumn || "",
    name: product.name || "",
    sku: product.sku || "",
    varietyName: product.varietyName || "",
    category: product.categories?.[0] || "",
    subcategory: product.subcategory || product.subcategories?.[0] || "",
    brandName: product.brandName || "GreenGrocc",
    variantType: hasVariants ? "multi" : "single",
    unit: product.unit || "1 Piece",
    price: product.price != null ? String(product.price) : "",
    discountedPrice: product.discountedPrice != null ? String(product.discountedPrice) : "",
    stock: product.storeStock ?? product.stock ?? 0,
    minOrderQuantity: product.minOrderQuantity ?? 1,
    maxOrderQuantity: product.maxOrderQuantity ?? "",
    stepByQuantity: product.stepByQuantity ?? 1,
    variants: hasVariants
      ? product.variants.map((v) => ({
          name: v.name || "",
          price: v.price != null ? String(v.price) : "",
          discountedPrice: v.discountedPrice != null ? String(v.discountedPrice) : "",
          stock: v.stock ?? 0,
        }))
      : [],
    productImages: [...(product.productImages || [])],
    videoUrl: product.videoUrl || "",
    description: product.description || "",
    features: [...(product.features || [])],
    specifications: [...(product.specifications || [])],
    badge: product.badge || "",
    cardGlowColor: product.cardGlowColor || "",
    isActive: product.isActive !== false,
    farmerName: product.farmerName || product.farmerDetails?.name || "",
    farmerLocation: product.farmerLocation || product.farmerDetails?.location || "",
    farmerImage: product.farmerImage || product.farmerDetails?.farmerImage || "",
    farmImage: product.farmImage || product.farmerDetails?.farmImage || "",
    harvestingDate: product.harvestingDate || product.farmerDetails?.harvestingDate || "",
    farmerDetails: { ...base.farmerDetails, ...(product.farmerDetails || {}) },
  };
}

const pct = (price, discounted) =>
  price > 0 && discounted > 0 && discounted < price
    ? Math.round(((price - discounted) / price) * 100)
    : 0;

function buildPayload(form) {
  const isMulti = form.variantType === "multi";
  const variants = isMulti
    ? form.variants.map((v) => {
        const price = parseFloat(v.price) || 0;
        const discountedPrice = parseFloat(v.discountedPrice) || price;
        const stock = parseInt(v.stock, 10) || 0;
        return {
          name: v.name.trim(),
          price,
          discountedPrice,
          discountedPercent: pct(price, discountedPrice),
          stock,
          inStock: stock > 0,
        };
      })
    : [];

  const price = isMulti ? variants[0]?.price || 0 : parseFloat(form.price) || 0;
  const discountedPrice = isMulti
    ? variants[0]?.discountedPrice || price
    : parseFloat(form.discountedPrice) || price;
  const stock = isMulti
    ? variants.reduce((sum, v) => sum + v.stock, 0)
    : parseInt(form.stock, 10) || 0;
  const subcategory = form.subcategory.trim() || "General";
  const maxQty = parseInt(form.maxOrderQuantity, 10);

  return {
    name: form.name.trim(),
    sku: form.sku.trim() || undefined,
    categories: [form.category],
    subcategory,
    subcategories: [subcategory],
    brandName: form.brandName.trim() || "GreenGrocc",
    unit: form.unit.trim() || variants[0]?.name || "1 pc",
    varietyName: form.varietyName.trim(),
    variantType: isMulti ? "multi" : "single",
    variants,
    price,
    discountedPrice,
    discountedPercent: pct(price, discountedPrice),
    stock,
    inStock: stock > 0,
    minOrderQuantity: parseInt(form.minOrderQuantity, 10) || 1,
    maxOrderQuantity: Number.isFinite(maxQty) ? maxQty : null,
    stepByQuantity: parseInt(form.stepByQuantity, 10) || 1,
    productImages: form.productImages,
    videoUrl: form.videoUrl.trim(),
    description: form.description.trim(),
    features: form.features,
    specifications: form.specifications,
    badge: form.badge.trim(),
    cardGlowColor: form.cardGlowColor.trim(),
    isActive: Boolean(form.isActive),
    section: form.department,
    storeType: storeTypeFor(form.department),
    deptNumber: form.deptNumber.trim(),
    rackRow: form.rackRow.trim(),
    rackColumn: form.rackColumn.trim(),
    farmerName: form.farmerName.trim(),
    farmerLocation: form.farmerLocation.trim(),
    farmerImage: form.farmerImage.trim(),
    farmImage: form.farmImage.trim(),
    harvestingDate: form.harvestingDate.trim(),
    farmerDetails: {
      ...form.farmerDetails,
      name: form.farmerName.trim(),
      location: form.farmerLocation.trim(),
      farmerImage: form.farmerImage.trim(),
      farmImage: form.farmImage.trim(),
      harvestingDate: form.harvestingDate.trim(),
    },
  };
}

function validate(form) {
  if (!form.name.trim()) return ["basic", "Product name is required"];
  if (!form.category) return ["basic", "Please select a category"];
  if (form.variantType === "multi") {
    if (form.variants.length < 2) {
      return ["pricing", "Multi-unit pricing needs at least 2 unit options (e.g. 250g and 500g)"];
    }
    const bad = form.variants.findIndex((v) => !v.name.trim() || !(parseFloat(v.price) > 0));
    if (bad >= 0) return ["pricing", `Unit option #${bad + 1} needs a label and a valid MRP`];
  } else if (!(parseFloat(form.price) > 0)) {
    return ["pricing", "Please enter a valid MRP"];
  }
  if (!form.productImages.length) return ["media", "Add at least one product image"];
  return null;
}

export default function ProductFormModal({ product, defaultDepartment, onClose, onSaved }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState(() =>
    product ? formFromProduct(product) : emptyForm(defaultDepartment || "preorder")
  );
  const [step, setStep] = useState("basic");
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [categoryState, setCategoryState] = useState({ department: null, rows: [] });
  const [imageUrl, setImageUrl] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [uploading, setUploading] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    managerApi
      .sections()
      .then((res) => {
        const rows = (res.data?.data || []).filter((s) => s.isActive !== false);
        if (rows.length) {
          setDepartments(rows.map((s) => ({ slug: s.slug, name: s.sectionName || s.slug })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const department = form.department;
    managerApi
      .categories(department)
      .then((res) => {
        if (cancelled) return;
        const rows = res.data?.data || res.data || [];
        setCategoryState({ department, rows: Array.isArray(rows) ? rows : [] });
      })
      .catch(() => !cancelled && setCategoryState({ department, rows: [] }));
    return () => {
      cancelled = true;
    };
  }, [form.department]);

  const categories = useMemo(
    () => (categoryState.department === form.department ? categoryState.rows : []),
    [categoryState, form.department]
  );

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (c) => String(c.categoryName).toLowerCase() === String(form.category).toLowerCase()
      ),
    [categories, form.category]
  );

  useEffect(() => {
    if (!categories.length || form.category) return;
    const first = categories[0];
    setForm((prev) => ({
      ...prev,
      category: first.categoryName,
      subcategory: first.subcategories?.[0] || "General",
    }));
  }, [categories, form.category]);

  const upload = async (files, kind) => {
    if (!files?.length) return;
    setUploading(kind);
    setError("");
    try {
      const res = await managerApi.uploadMedia(files, kind === "farmerImage" || kind === "farmImage" ? "farmers" : "products");
      const urls = res.data?.urls || (res.data?.url ? [res.data.url] : []);
      if (!urls.length) throw new Error(res.data?.message || "Upload failed");
      if (kind === "images") set({ productImages: [...form.productImages, ...urls] });
      else if (kind === "video") set({ videoUrl: urls[0] });
      else set({ [kind]: urls[0] });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Upload failed");
    } finally {
      setUploading("");
    }
  };

  const updateVariant = (index, patch) =>
    set({ variants: form.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)) });

  const submit = async () => {
    const problem = validate(form);
    if (problem) {
      setStep(problem[0]);
      setError(problem[1]);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = buildPayload(form);
      const res = isEdit
        ? await managerApi.updateProduct(product._id, payload)
        : await managerApi.createProduct(payload);
      onSaved(res.data?.data, isEdit);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-6">
      <div className="flex max-h-full w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isEdit ? "Edit store product" : "Add store product"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Shown only to customers served by your dark store
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-6 py-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold ${
                step === s.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {i + 1}. {s.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          {step === "basic" && (
            <>
              <div>
                <span className={LABEL}>Department *</span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {departments.map((dept) => (
                    <button
                      key={dept.slug}
                      type="button"
                      onClick={() => set({ department: dept.slug, category: "", subcategory: "" })}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold ${
                        toDepartment(form.department) === toDepartment(dept.slug)
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {dept.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className={LABEL}>
                  Department ID <span className="font-normal text-slate-400">(optional)</span>
                </span>
                <div className="grid grid-cols-2 items-center gap-2 sm:grid-cols-4">
                  <div className="flex overflow-hidden rounded-xl border border-slate-200">
                    <span className="border-r border-slate-200 bg-slate-100 px-2.5 py-2 font-mono text-xs font-bold text-slate-600">
                      {departmentPrefix(form.department)}
                    </span>
                    <input
                      value={form.deptNumber}
                      onChange={(e) => set({ deptNumber: e.target.value.toUpperCase() })}
                      placeholder="No. e.g. 28"
                      className="w-full px-2.5 py-2 font-mono text-sm outline-none"
                    />
                  </div>
                  <input
                    value={form.rackRow}
                    onChange={(e) => set({ rackRow: e.target.value.toUpperCase() })}
                    placeholder="Row e.g. 2"
                    className={`${INPUT} font-mono`}
                  />
                  <input
                    value={form.rackColumn}
                    onChange={(e) => set({ rackColumn: e.target.value.toUpperCase() })}
                    placeholder="Column e.g. 3"
                    className={`${INPUT} font-mono`}
                  />
                  <span className="font-mono text-sm font-bold text-emerald-700">
                    {previewDepartmentId(form) || "—"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  PR = Pre-order, RD = Ready2Cook, IN = Instant Order. Row / column mark the shelf spot (e.g. R2C3).
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="sm:col-span-2">
                  <span className={LABEL}>Product name *</span>
                  <input
                    value={form.name}
                    onChange={(e) => set({ name: e.target.value })}
                    placeholder="e.g. Fresh Palak / Spinach (250g)"
                    className={INPUT}
                  />
                </label>
                <label>
                  <span className={LABEL}>SKU</span>
                  <input
                    value={form.sku}
                    onChange={(e) => set({ sku: e.target.value.toUpperCase() })}
                    placeholder="Auto if empty"
                    className={`${INPUT} font-mono`}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label>
                  <span className={LABEL}>Category *</span>
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const cat = categories.find((c) => c.categoryName === e.target.value);
                      set({ category: e.target.value, subcategory: cat?.subcategories?.[0] || "General" });
                    }}
                    className={INPUT}
                  >
                    {!categories.length && !form.category && <option value="">No categories</option>}
                    {form.category && !selectedCategory && (
                      <option value={form.category}>{form.category}</option>
                    )}
                    {categories.map((c) => (
                      <option key={c._id || c.categoryName} value={c.categoryName}>
                        {c.categoryName}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className={LABEL}>Subcategory</span>
                  {selectedCategory?.subcategories?.length ? (
                    <select
                      value={form.subcategory}
                      onChange={(e) => set({ subcategory: e.target.value })}
                      className={INPUT}
                    >
                      {selectedCategory.subcategories.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={form.subcategory}
                      onChange={(e) => set({ subcategory: e.target.value })}
                      placeholder="General"
                      className={INPUT}
                    />
                  )}
                </label>
                <label>
                  <span className={LABEL}>Brand</span>
                  <input
                    value={form.brandName}
                    onChange={(e) => set({ brandName: e.target.value })}
                    className={INPUT}
                  />
                </label>
              </div>

              <label className="block">
                <span className={LABEL}>Variety name</span>
                <input
                  value={form.varietyName}
                  onChange={(e) => set({ varietyName: e.target.value })}
                  placeholder="e.g. Alphonso, Organic, Premium Cut"
                  className={INPUT}
                />
              </label>
            </>
          )}

          {step === "pricing" && (
            <>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-bold">
                {[
                  ["single", "Single unit"],
                  ["multi", "Multiple units (250g / 500g …)"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      set({
                        variantType: value,
                        variants:
                          value === "multi" && form.variants.length < 2
                            ? [emptyVariant(), emptyVariant()]
                            : form.variants,
                      })
                    }
                    className={`flex-1 rounded-lg px-3 py-1.5 ${
                      form.variantType === value ? "bg-slate-900 text-white" : "text-slate-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {form.variantType === "single" ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <label>
                    <span className={LABEL}>Unit</span>
                    <input value={form.unit} onChange={(e) => set({ unit: e.target.value })} className={INPUT} />
                  </label>
                  <label>
                    <span className={LABEL}>MRP (₹) *</span>
                    <input
                      type="number"
                      min={0}
                      value={form.price}
                      onChange={(e) => set({ price: e.target.value })}
                      className={INPUT}
                    />
                  </label>
                  <label>
                    <span className={LABEL}>Selling price (₹)</span>
                    <input
                      type="number"
                      min={0}
                      value={form.discountedPrice}
                      onChange={(e) => set({ discountedPrice: e.target.value })}
                      placeholder="Same as MRP"
                      className={INPUT}
                    />
                  </label>
                  <label>
                    <span className={LABEL}>Store stock</span>
                    <input
                      type="number"
                      min={0}
                      value={form.stock}
                      onChange={(e) => set({ stock: e.target.value })}
                      className={INPUT}
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  {form.variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-2 items-end gap-2 sm:grid-cols-5">
                      <label>
                        <span className={LABEL}>Unit label</span>
                        <input
                          value={v.name}
                          onChange={(e) => updateVariant(i, { name: e.target.value })}
                          placeholder="e.g. 500g"
                          className={INPUT}
                        />
                      </label>
                      <label>
                        <span className={LABEL}>MRP (₹)</span>
                        <input
                          type="number"
                          min={0}
                          value={v.price}
                          onChange={(e) => updateVariant(i, { price: e.target.value })}
                          className={INPUT}
                        />
                      </label>
                      <label>
                        <span className={LABEL}>Selling (₹)</span>
                        <input
                          type="number"
                          min={0}
                          value={v.discountedPrice}
                          onChange={(e) => updateVariant(i, { discountedPrice: e.target.value })}
                          className={INPUT}
                        />
                      </label>
                      <label>
                        <span className={LABEL}>Stock</span>
                        <input
                          type="number"
                          min={0}
                          value={v.stock}
                          onChange={(e) => updateVariant(i, { stock: e.target.value })}
                          className={INPUT}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => set({ variants: form.variants.filter((_, idx) => idx !== i) })}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => set({ variants: [...form.variants, emptyVariant()] })}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    + Add unit option
                  </button>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <label>
                  <span className={LABEL}>Min order qty</span>
                  <input
                    type="number"
                    min={1}
                    value={form.minOrderQuantity}
                    onChange={(e) => set({ minOrderQuantity: e.target.value })}
                    className={INPUT}
                  />
                </label>
                <label>
                  <span className={LABEL}>Max order qty</span>
                  <input
                    type="number"
                    min={1}
                    value={form.maxOrderQuantity}
                    onChange={(e) => set({ maxOrderQuantity: e.target.value })}
                    placeholder="No limit"
                    className={INPUT}
                  />
                </label>
                <label>
                  <span className={LABEL}>Step by</span>
                  <input
                    type="number"
                    min={1}
                    value={form.stepByQuantity}
                    onChange={(e) => set({ stepByQuantity: e.target.value })}
                    className={INPUT}
                  />
                </label>
              </div>
            </>
          )}

          {step === "media" && (
            <>
              <div>
                <span className={LABEL}>Product images *</span>
                <div className="flex flex-wrap gap-2">
                  {form.productImages.map((url, i) => (
                    <div key={url + i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => set({ productImages: form.productImages.filter((_, idx) => idx !== i) })}
                        className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 text-[10px] font-bold text-white"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading === "images"}
                    className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-[11px] font-bold text-slate-500 hover:border-emerald-500"
                  >
                    {uploading === "images" ? "Uploading…" : "+ Upload"}
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => {
                      upload(e.target.files, "images");
                      e.target.value = "";
                    }}
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="…or paste image URL"
                    className={INPUT}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!imageUrl.trim()) return;
                      set({ productImages: [...form.productImages, imageUrl.trim()] });
                      setImageUrl("");
                    }}
                    className="rounded-xl bg-slate-900 px-3 text-xs font-bold text-white"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <span className={LABEL}>Video</span>
                <div className="flex gap-2">
                  <input
                    value={form.videoUrl}
                    onChange={(e) => set({ videoUrl: e.target.value })}
                    placeholder="Video URL"
                    className={INPUT}
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploading === "video"}
                    className="whitespace-nowrap rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700"
                  >
                    {uploading === "video" ? "Uploading…" : "Upload"}
                  </button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    hidden
                    onChange={(e) => {
                      upload(e.target.files, "video");
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>

              <label className="block">
                <span className={LABEL}>Description</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => set({ description: e.target.value })}
                  className={INPUT}
                />
              </label>

              <div>
                <span className={LABEL}>Highlights</span>
                <div className="flex gap-2">
                  <input
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    placeholder="e.g. Farm fresh, no pesticides"
                    className={INPUT}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!featureInput.trim()) return;
                      set({ features: [...form.features, featureInput.trim()] });
                      setFeatureInput("");
                    }}
                    className="rounded-xl bg-slate-900 px-3 text-xs font-bold text-white"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.features.map((f, i) => (
                    <span key={f + i} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      {f}{" "}
                      <button
                        type="button"
                        onClick={() => set({ features: form.features.filter((_, idx) => idx !== i) })}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className={LABEL}>Specifications</span>
                <div className="flex gap-2">
                  <input value={specKey} onChange={(e) => setSpecKey(e.target.value)} placeholder="Name" className={INPUT} />
                  <input value={specValue} onChange={(e) => setSpecValue(e.target.value)} placeholder="Value" className={INPUT} />
                  <button
                    type="button"
                    onClick={() => {
                      if (!specKey.trim() || !specValue.trim()) return;
                      set({
                        specifications: [...form.specifications, { name: specKey.trim(), value: specValue.trim() }],
                      });
                      setSpecKey("");
                      setSpecValue("");
                    }}
                    className="rounded-xl bg-slate-900 px-3 text-xs font-bold text-white"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  {form.specifications.map((s, i) => (
                    <div key={s.name + i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs">
                      <span>
                        <strong>{s.name}:</strong> {s.value}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          set({ specifications: form.specifications.filter((_, idx) => idx !== i) })
                        }
                        className="text-slate-400 hover:text-rose-600"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label>
                  <span className={LABEL}>Badge</span>
                  <input
                    value={form.badge}
                    onChange={(e) => set({ badge: e.target.value })}
                    placeholder="e.g. Bestseller"
                    className={INPUT}
                  />
                </label>
                <label>
                  <span className={LABEL}>Card glow colour</span>
                  <input
                    value={form.cardGlowColor}
                    onChange={(e) => set({ cardGlowColor: e.target.value })}
                    placeholder="#10B981"
                    className={INPUT}
                  />
                </label>
                <label className="flex items-center gap-2 pt-5 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => set({ isActive: e.target.checked })}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  Visible to customers
                </label>
              </div>
            </>
          )}

          {step === "farmer" && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label>
                  <span className={LABEL}>Farmer name</span>
                  <input value={form.farmerName} onChange={(e) => set({ farmerName: e.target.value })} className={INPUT} />
                </label>
                <label>
                  <span className={LABEL}>Farmer location</span>
                  <input
                    value={form.farmerLocation}
                    onChange={(e) => set({ farmerLocation: e.target.value })}
                    className={INPUT}
                  />
                </label>
                <label>
                  <span className={LABEL}>Harvesting date</span>
                  <input
                    value={form.harvestingDate}
                    onChange={(e) => set({ harvestingDate: e.target.value })}
                    placeholder="Today (Fresh Morning Harvest)"
                    className={INPUT}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["farmerImage", "Farmer photo"],
                  ["farmImage", "Farm land photo"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <span className={LABEL}>{label}</span>
                    <div className="flex items-center gap-2">
                      {form[key] ? (
                        <img src={form[key]} alt="" className="h-12 w-12 rounded-lg border border-slate-200 object-cover" />
                      ) : null}
                      <input
                        value={form[key]}
                        onChange={(e) => set({ [key]: e.target.value })}
                        placeholder="Image URL"
                        className={INPUT}
                      />
                      <label className="cursor-pointer whitespace-nowrap rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">
                        {uploading === key ? "Uploading…" : "Upload"}
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => {
                            upload(e.target.files, key);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {FARMER_DETAIL_FIELDS.map(([key, label]) => (
                  <label key={key}>
                    <span className={LABEL}>{label}</span>
                    <input
                      value={form.farmerDetails[key] || ""}
                      onChange={(e) => set({ farmerDetails: { ...form.farmerDetails, [key]: e.target.value } })}
                      className={INPUT}
                    />
                  </label>
                ))}
              </div>
              <label className="block">
                <span className={LABEL}>Farmer bio</span>
                <textarea
                  rows={2}
                  value={form.farmerDetails.bio || ""}
                  onChange={(e) => set({ farmerDetails: { ...form.farmerDetails, bio: e.target.value } })}
                  className={INPUT}
                />
              </label>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => setStep(STEPS[stepIndex - 1].id)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-40"
          >
            Back
          </button>
          <div className="flex gap-2">
            {stepIndex < STEPS.length - 1 && (
              <button
                type="button"
                onClick={() => setStep(STEPS[stepIndex + 1].id)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Next
              </button>
            )}
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
