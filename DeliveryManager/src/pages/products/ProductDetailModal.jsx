import { useEffect, useState } from "react";
import { DepartmentBadge } from "./productDepartments";

const FARMER_FIELDS = [
  ["name", "Farmer name"],
  ["location", "Location"],
  ["totalArea", "Total area"],
  ["cultivationArea", "Cultivation area"],
  ["cropCycle", "Crop cycle"],
  ["agricultureMethod", "Agriculture method"],
  ["lastCropTaken", "Last crop taken"],
  ["currentCrop", "Current crop"],
  ["waterSource", "Water source"],
  ["soilType", "Soil type"],
  ["farmTools", "Farm tools"],
  ["harvestingDate", "Harvesting date"],
];

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h4 className="mb-3 text-[11px] font-black uppercase tracking-wider text-slate-400">{title}</h4>
      {children}
    </section>
  );
}

function Field({ label, value, mono = false }) {
  const empty = value === undefined || value === null || value === "";
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold text-slate-400">{label}</dt>
      <dd className={`mt-0.5 break-words text-sm font-semibold text-slate-800 ${mono ? "font-mono" : ""}`}>
        {empty ? <span className="text-slate-300">—</span> : value}
      </dd>
    </div>
  );
}

function Chip({ children, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export default function ProductDetailModal({ product, onClose, onEdit, onDelete }) {
  const images = (product.productImages || []).filter(Boolean);
  const [activeImage, setActiveImage] = useState(images[0] || "");
  const farmer = product.farmerDetails || {};
  const hasFarmer = FARMER_FIELDS.some(([key]) => farmer[key]) || farmer.bio;
  const variants = product.variantType === "multi" ? product.variants || [] : [];
  const discount =
    product.discountedPercent ||
    (product.price > product.discountedPrice
      ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
      : 0);
  const rack =
    product.rackRow || product.rackColumn
      ? `${product.rackRow ? `Row ${product.rackRow}` : ""}${product.rackRow && product.rackColumn ? " · " : ""}${
          product.rackColumn ? `Column ${product.rackColumn}` : ""
        }`
      : "";

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-3xl flex-col bg-slate-50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <DepartmentBadge department={product.section} departmentId={product.departmentId} />
              {product.isActive ? <Chip tone="emerald">Live</Chip> : <Chip>Hidden</Chip>}
              {product.storeStock > 0 ? (
                <Chip tone="emerald">{product.storeStock} in stock</Chip>
              ) : (
                <Chip tone="rose">Out of stock</Chip>
              )}
            </div>
            <h3 className="mt-2 text-lg font-black text-slate-900">{product.name}</h3>
            <p className="font-mono text-xs text-slate-400">{product.sku}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-[260px_1fr]">
            <div className="space-y-2">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {activeImage ? (
                  <img src={activeImage} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-slate-400">No image</span>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setActiveImage(src)}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 ${
                        src === activeImage ? "border-emerald-500" : "border-transparent"
                      }`}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Section title="Pricing & stock">
              <div className="mb-4 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">₹{product.discountedPrice}</span>
                {product.price > product.discountedPrice && (
                  <span className="text-sm text-slate-400 line-through">₹{product.price}</span>
                )}
                {discount > 0 && <Chip tone="emerald">{discount}% off</Chip>}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                <Field label="MRP" value={product.price != null ? `₹${product.price}` : ""} />
                <Field label="Selling price" value={`₹${product.discountedPrice}`} />
                <Field label="Unit" value={product.unit} />
                <Field label="Store stock" value={product.storeStock} />
                <Field label="Min order qty" value={product.minOrderQuantity} />
                <Field label="Max order qty" value={product.maxOrderQuantity} />
                <Field label="Step quantity" value={product.stepByQuantity} />
                <Field label="Pricing type" value={product.pricingType} />
                <Field label="Rating" value={product.ratings ? `★ ${product.ratings}` : ""} />
              </dl>
            </Section>
          </div>

          <Section title="Department & placement">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              <Field label="Department ID" value={product.departmentId} mono />
              <Field label="Department number" value={product.deptNumber} />
              <Field label="Rack position" value={rack} />
              <Field label="Section" value={product.section} />
            </dl>
          </Section>

          <Section title="Product info">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Field label="Brand" value={product.brandName} />
              <Field label="Variety" value={product.varietyName} />
              <Field label="Category" value={(product.categories || []).join(", ")} />
              <Field label="Subcategory" value={product.subcategory} />
              <Field label="Badge" value={product.badge} />
              <Field
                label="Card glow"
                value={
                  product.cardGlowColor ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded-full border border-slate-200"
                        style={{ backgroundColor: product.cardGlowColor }}
                      />
                      <span className="font-mono text-xs">{product.cardGlowColor}</span>
                    </span>
                  ) : (
                    ""
                  )
                }
              />
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.hotSelling && <Chip tone="rose">Hot selling</Chip>}
              {product.justArrived && <Chip tone="sky">Just arrived</Chip>}
            </div>
          </Section>

          {variants.length > 0 && (
            <Section title="Variants">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] uppercase text-slate-400">
                    <tr>
                      <th className="py-1.5 pr-3">Variant</th>
                      <th className="py-1.5 pr-3 text-right">MRP</th>
                      <th className="py-1.5 pr-3 text-right">Price</th>
                      <th className="py-1.5 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {variants.map((v) => (
                      <tr key={v.name}>
                        <td className="py-1.5 pr-3 font-semibold text-slate-800">{v.name}</td>
                        <td className="py-1.5 pr-3 text-right">₹{v.price}</td>
                        <td className="py-1.5 pr-3 text-right font-bold">₹{v.discountedPrice}</td>
                        <td className="py-1.5 text-right">{v.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          <Section title="Description">
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {product.description || <span className="text-slate-300">No description</span>}
            </p>
            {product.features?.length > 0 && (
              <ul className="mt-3 space-y-1">
                {product.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-slate-700">
                    <span className="text-emerald-600">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {(product.specifications?.length > 0 || product.warranty || product.videoUrl) && (
            <Section title="Specifications">
              {product.specifications?.length > 0 && (
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {product.specifications.map((spec) => (
                      <tr key={spec.name}>
                        <td className="w-1/3 py-2 pr-3 text-xs font-semibold text-slate-400">{spec.name}</td>
                        <td className="py-2 font-semibold text-slate-800">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                {product.warranty && <Field label="Shelf life / warranty" value={product.warranty} />}
                {product.videoUrl && (
                  <Field
                    label="Video"
                    value={
                      <a href={product.videoUrl} target="_blank" rel="noreferrer" className="text-emerald-700 underline">
                        Open video
                      </a>
                    }
                  />
                )}
              </dl>
            </Section>
          )}

          {hasFarmer && (
            <Section title="Farmer traceability">
              <div className="mb-4 flex items-center gap-3">
                {farmer.farmerImage && (
                  <img src={farmer.farmerImage} alt="" className="h-14 w-14 rounded-full border border-slate-200 object-cover" />
                )}
                <div>
                  <p className="font-bold text-slate-900">{farmer.name || product.farmerName}</p>
                  <p className="text-xs text-slate-500">{farmer.location || product.farmerLocation}</p>
                </div>
                {farmer.farmImage && (
                  <img src={farmer.farmImage} alt="" className="ml-auto h-14 w-24 rounded-lg border border-slate-200 object-cover" />
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                {FARMER_FIELDS.slice(2).map(([key, label]) => (
                  <Field key={key} label={label} value={farmer[key]} />
                ))}
              </dl>
              {farmer.bio && <p className="mt-3 text-sm italic leading-relaxed text-slate-600">“{farmer.bio}”</p>}
            </Section>
          )}

          <Section title="Record">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              <Field label="Product ID" value={product._id} mono />
              <Field label="Created" value={formatDate(product.createdAt)} />
              <Field label="Last updated" value={formatDate(product.updatedAt)} />
            </dl>
          </Section>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-3">
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
          >
            Edit product
          </button>
        </footer>
      </div>
    </div>
  );
}
