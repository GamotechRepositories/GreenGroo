import { useState } from "react";
import { vendorApi } from "../../api/vendorApi";
import CopyId from "../../components/ui/CopyId";

const PRODUCT_ID_TEXT = "font-mono text-[10px] font-semibold tracking-wide text-[#217346]";
const INPUT = "w-full border border-gray-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-[#217346]";
const LABEL = "block text-[11px] font-semibold text-gray-600";

const UNIT_TYPES = [
  "Piece", "Kg", "Gram", "Liter", "ML", "Box", "Pack", "Packet", "Bag",
  "Set", "Pair", "Dozen", "Bundle", "Bunch", "Meter", "CM",
];

const FIXED_FIELDS = [
  { field: "name", label: "Product name" },
  { field: "brandName", label: "Brand" },
  { field: "varietyName", label: "Variety" },
  { field: "category", label: "Category" },
  { field: "subcategory", label: "Subcategory" },
];

const toInput = (value) => (value === null || value === undefined ? "" : String(value));
const hasValue = (value) => value !== null && value !== undefined && value !== "";
const sameText = (a, b) => String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();
const sameNumber = (a, b) => a !== null && hasValue(b) && Number(a) === Number(b);

function splitUnit(unit) {
  const match = String(unit || "").trim().match(/^(\d+(?:\.\d+)?)\s*([A-Za-z]+)$/);
  const type = match && UNIT_TYPES.find((t) => t.toLowerCase() === match[2].toLowerCase());
  return type ? { qty: match[1], type } : { qty: "1", type: "Piece" };
}

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function initialForm(product) {
  const unit = splitUnit(product.unit);
  return {
    description: toInput(product.description),
    price: toInput(product.price),
    discountedPrice: toInput(product.discountedPrice),
    stock: toInput(product.stock),
    inStock: product.inStock !== false,
    unitQty: unit.qty,
    unitType: unit.type,
    unitInitial: `${Number(unit.qty)} ${unit.type}`,
  };
}

/** Edits this vendor's own copy of a catalog product; values equal to the catalog are sent as "use catalog". */
export default function VendorProductEditModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState(() => initialForm(product));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const catalog = product.catalog || {};

  const set = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const close = () => {
    if (!saving) onClose();
  };

  const submit = async (payload, message) => {
    setSaving(true);
    setError("");
    try {
      const res = await vendorApi.updateMyProduct(product.productId, payload);
      onSaved(res.data, message);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const save = () => {
    const mrp = form.price === "" ? null : Number(form.price);
    const selling = form.discountedPrice === "" ? null : Number(form.discountedPrice);
    const stock = form.stock === "" ? null : Number(form.stock);
    if (mrp === null || !Number.isFinite(mrp) || mrp < 0) return setError("Enter a valid MRP");
    if (selling === null || !Number.isFinite(selling) || selling < 0) return setError("Enter a valid selling price");
    if (selling > mrp) return setError("Selling price cannot be more than MRP");
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) return setError("Stock must be a whole number of 0 or more");
    const qty = Number(form.unitQty);
    if (!(qty > 0)) return setError("Enter a valid unit quantity, e.g. 500");

    const payload = {
      price: sameNumber(mrp, catalog.price) ? null : mrp,
      discountedPrice: sameNumber(selling, catalog.discountedPrice) ? null : selling,
      stock: stock === null || sameNumber(stock, catalog.stock) ? null : stock,
      inStock: typeof catalog.inStock === "boolean" && form.inStock === catalog.inStock ? null : form.inStock,
    };
    const description = form.description.trim();
    payload.description = sameText(description, catalog.description) ? "" : description;
    const unitText = `${qty} ${form.unitType}`;
    if (unitText !== form.unitInitial) payload.unit = sameText(unitText, catalog.unit) ? "" : unitText;
    submit(payload, `${product.name} updated for your centre`);
  };

  const reset = () => {
    if (!window.confirm(`Use all admin catalog values again for "${product.name}"?`)) return;
    submit({ reset: true }, `${catalog.name || product.name} now uses the catalog values`);
  };

  const catalogHint = (value, format = (v) => v) =>
    hasValue(value) ? <span className="font-normal text-gray-400"> · Catalog: {format(value)}</span> : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col bg-white shadow-xl">
        <div className="border-b border-gray-100 p-5 pb-3">
          <h2 className="text-sm font-bold text-gray-900">Edit product for your centre</h2>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Changes apply only to your collection centre. The admin catalog and other vendors are not affected.
          </p>
          <div className="mt-3 flex items-center gap-3">
            {product.image ? (
              <img src={product.image} alt={product.name} className="h-12 w-12 rounded border border-gray-200 object-cover" />
            ) : null}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{product.name}</p>
              <CopyId value={product.sku || product.productId} textClassName={PRODUCT_ID_TEXT} />
            </div>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-5">
          <dl className="col-span-2 grid grid-cols-2 gap-x-3 gap-y-1.5 border border-gray-100 bg-gray-50 px-3 py-2 text-[11px]">
            {FIXED_FIELDS.map(({ field, label }) => (
              <div key={field} className="min-w-0">
                <dt className="text-gray-400">{label}</dt>
                <dd className="truncate font-semibold text-gray-700">{product[field] || "—"}</dd>
              </div>
            ))}
            <p className="col-span-2 text-[10px] text-gray-400">These details are set by admin and cannot be changed.</p>
          </dl>

          <label className={LABEL}>
            MRP (₹){catalogHint(catalog.price, formatPrice)}
            <input type="number" min="0" step="0.01" value={form.price} onChange={set("price")} className={`${INPUT} mt-1`} />
          </label>
          <label className={LABEL}>
            Selling price (₹){catalogHint(catalog.discountedPrice, formatPrice)}
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.discountedPrice}
              onChange={set("discountedPrice")}
              className={`${INPUT} mt-1`}
            />
          </label>

          <label className={LABEL}>
            Unit quantity{catalogHint(catalog.unit)}
            <input
              type="number"
              min="0"
              step="any"
              value={form.unitQty}
              onChange={set("unitQty")}
              placeholder="e.g. 500"
              className={`${INPUT} mt-1`}
            />
          </label>
          <label className={LABEL}>
            Unit type
            <select value={form.unitType} onChange={set("unitType")} className={`${INPUT} mt-1`}>
              {UNIT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className={LABEL}>
            Stock (optional){catalogHint(catalog.stock)}
            <input type="number" min="0" step="1" value={form.stock} onChange={set("stock")} className={`${INPUT} mt-1`} />
          </label>
          <label className="flex items-end gap-2 pb-2 text-[11px] font-semibold text-gray-600">
            <input type="checkbox" checked={form.inStock} onChange={set("inStock")} className="h-4 w-4 accent-[#217346]" />
            Available (in stock)
          </label>

          <label className={`${LABEL} col-span-2`}>
            Description
            <textarea
              rows={3}
              maxLength={1000}
              value={form.description}
              onChange={set("description")}
              className={`${INPUT} mt-1`}
            />
          </label>
        </div>

        <div className="border-t border-gray-100 p-5 pt-3">
          {error ? <p className="mb-2 text-[11px] font-semibold text-red-600">{error}</p> : null}
          <div className="flex items-center justify-between gap-2">
            {product.customPricing ? (
              <button
                type="button"
                disabled={saving}
                onClick={reset}
                className="text-[11px] font-semibold text-gray-500 hover:text-red-600 hover:underline disabled:opacity-50"
              >
                Use catalog values
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={close}
                className="border border-gray-200 bg-white px-4 py-2 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={save}
                className="bg-[#217346] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a5c38] disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
