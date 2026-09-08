import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";
import CopyId from "../../components/ui/CopyId";
import {
  formatProductId,
  isPendingProduct,
  matchesViewedProduct,
  productNameOf,
  productQty,
  productStatusClass,
} from "../../utils/productList";

const PANEL = "rounded-xl border border-gray-200 bg-white shadow-sm";
const BTN = "inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50";
const APPROVE_BTN =
  "inline-flex h-7 shrink-0 items-center justify-center rounded-md bg-green-100 px-2 text-[10px] font-semibold text-green-700 whitespace-nowrap hover:bg-green-200 disabled:opacity-40";
const REJECT_BTN =
  "inline-flex h-7 shrink-0 items-center justify-center rounded-md bg-red-100 px-2 text-[10px] font-semibold text-red-700 whitespace-nowrap hover:bg-red-200 disabled:opacity-40";

function harvestLabel(product) {
  if (!product?.harvestDate) return "—";
  const d = new Date(product.harvestDate);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN");
}

function listingGrades(product) {
  const preferred = ["Grade A", "Grade B", "Grade C"];
  const map = new Map();
  const add = (label, qty) => {
    const key = String(label || "").trim();
    if (!key) return;
    map.set(key, (map.get(key) || 0) + Number(qty || 0));
  };
  if (Array.isArray(product?.grades) && product.grades.length) {
    product.grades.forEach((g) => add(g.label || g.name, g.quantity));
  } else {
    add("Grade A", product?.gradeAQty);
    add("Grade B", product?.gradeBQty);
    add("Grade C", product?.gradeCQty);
  }
  return [
    ...preferred.map((label) => ({ label, quantity: map.get(label) || 0 })),
    ...Array.from(map.entries())
      .filter(([label]) => !preferred.includes(label))
      .map(([label, quantity]) => ({ label, quantity })),
  ];
}

function GradesTable({ grades = [], unit = "Kg" }) {
  const rows = (grades || []).filter((g) => g.label);
  if (!rows.length) return null;
  return (
    <div className="mt-2 overflow-hidden rounded-md border border-[#E5E7EB]">
      <div className="grid grid-cols-2 bg-[#F8FAF8] px-2 py-1 text-[10px] font-bold text-[#6B7280]">
        <span>Grade</span>
        <span className="text-right">Qty</span>
      </div>
      {rows.map((g) => (
        <div key={g.label} className="grid grid-cols-2 items-center border-t border-[#E5E7EB] px-2 py-1.5 text-[12px]">
          <span className="font-semibold text-[#1F2937]">{g.label}</span>
          <span className="text-right font-semibold tabular-nums text-[#1F2937]">
            {Number(g.quantity || 0).toLocaleString("en-IN")} {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProductSummaryMobile({ title, summary }) {
  return (
    <div className="px-3 py-3 sm:hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-[#217346]">{title}</p>
          <p className="mt-0.5 truncate text-[11px] text-[#6B7280]">
            {[summary.variety !== "—" ? summary.variety : null, summary.category].filter(Boolean).join(" · ") || "—"}
          </p>
          <CopyId value={summary.productId} className="mt-0.5" textClassName="font-mono text-[10px] text-emerald-700" breakAll />
        </div>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${productStatusClass(summary.status)}`}>
          {summary.status}
        </span>
      </div>
      <p className="mt-2 text-[13px] font-bold text-[#1F2937]">
        {Number(summary.totalQty || 0).toLocaleString("en-IN")} {summary.unit}
      </p>
      <GradesTable grades={summary.grades} unit={summary.unit} />
    </div>
  );
}

function FarmerCard({ product, farmerId, farmerLabel, busyId, onReview }) {
  const qty = productQty(product);
  const id = product.id || product.productId;
  const canReview = isPendingProduct(product.status);
  const unit = product.unit || "Kg";
  return (
    <div className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-2">
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          {farmerId ? (
            <Link to={`/vendor/all-farmers/${farmerId}`} className="block truncate text-[12px] font-semibold text-[#217346]">
              {farmerLabel}
            </Link>
          ) : (
            <p className="truncate text-[12px] font-semibold text-[#1F2937]">{farmerLabel}</p>
          )}
          <p className="mt-0.5 truncate text-[10px] text-[#6B7280]">
            {product.variety || "—"} · {harvestLabel(product)}
          </p>
        </div>
        <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold ${productStatusClass(product.status)}`}>
          {product.status || "Active"}
        </span>
      </div>
      <CopyId value={formatProductId(product)} className="mt-1" textClassName="font-mono text-[9px] text-emerald-700" />
      <p className="mt-1 text-[12px] font-bold tabular-nums text-[#1F2937]">
        {qty.toLocaleString("en-IN")} {unit}
      </p>
      <GradesTable grades={listingGrades(product)} unit={unit} />
      {canReview ? (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <button type="button" disabled={busyId === id} onClick={() => onReview(product, "approved")} className={APPROVE_BTN}>
            Approve
          </button>
          <button type="button" disabled={busyId === id} onClick={() => onReview(product, "rejected")} className={REJECT_BTN}>
            Reject
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function VendorProductFarmersPage() {
  const { productKey } = useParams();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId") || "";
  const productNameParam = searchParams.get("name") || "";
  const backTo = "/vendor/products";

  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [toast, setToast] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await vendorApi.getProducts();
      const data = res.data || {};
      setFarmers(Array.isArray(data.farmers) ? data.farmers : []);
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch {
      setFarmers([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productKey, productId, productNameParam]);

  const farmerName = (farmerId, fallback) =>
    fallback || farmers.find((f) => f.id === farmerId || f.farmerId === farmerId)?.name || "—";

  const handleReview = async (product, decision) => {
    const id = product.id || product.productId;
    let reason = "";
    if (decision === "rejected") {
      const typed = window.prompt("Reason for rejection (optional)");
      if (typed === null) return;
      reason = typed;
    }
    setBusyId(id);
    try {
      await vendorApi.reviewFarmerProduct(product.farmerId, id, decision, reason);
      setToast(decision === "approved" ? "Product approved" : "Product rejected");
      await loadData();
    } catch (err) {
      setToast(err.response?.data?.message || "Failed to review product");
    } finally {
      setBusyId("");
      window.setTimeout(() => setToast(""), 4000);
    }
  };

  const rows = useMemo(
    () =>
      products
        .filter((p) => matchesViewedProduct(p, { productId, productName: productNameParam, productKey }))
        .map((p) => ({
          ...p,
          farmerLabel: farmerName(p.farmerId, p.farmerName),
        }))
        .sort((a, b) => String(a.farmerLabel).localeCompare(String(b.farmerLabel))),
    [products, farmers, productId, productNameParam, productKey]
  );

  const primary =
    rows.find((p) => {
      const pid = String(p.productId || p.id || "").trim();
      return productId && pid === productId;
    }) ||
    rows[0] ||
    null;

  const title = productNameParam || productNameOf(primary || {}) || decodeURIComponent(productKey || "Product");

  const summary = useMemo(() => {
    if (!rows.length) return null;
    const varieties = Array.from(new Set(rows.map((p) => String(p.variety || "").trim()).filter(Boolean)));
    const category = [primary?.category, primary?.subCategory].filter(Boolean).join(" · ") || "—";
    const unit = primary?.unit || "Kg";

    const gradeTotals = new Map();
    const addGrade = (label, qty) => {
      const key = String(label || "").trim();
      const n = Number(qty || 0);
      if (!key) return;
      gradeTotals.set(key, (gradeTotals.get(key) || 0) + n);
    };

    rows.forEach((p) => {
      if (Array.isArray(p.grades) && p.grades.length) {
        p.grades.forEach((g) => addGrade(g.label || g.name, g.quantity));
      } else {
        if (p.gradeAQty != null) addGrade("Grade A", p.gradeAQty);
        if (p.gradeBQty != null) addGrade("Grade B", p.gradeBQty);
        if (p.gradeCQty != null) addGrade("Grade C", p.gradeCQty);
        if (!p.gradeAQty && !p.gradeBQty && !p.gradeCQty) {
          addGrade("Total", productQty(p));
        }
      }
    });

    const preferred = ["Grade A", "Grade B", "Grade C"];
    const orderedGrades = [
      ...preferred.map((label) => ({ label, quantity: gradeTotals.get(label) || 0 })),
      ...Array.from(gradeTotals.entries())
        .filter(([label]) => !preferred.includes(label) && label !== "Total")
        .map(([label, quantity]) => ({ label, quantity })),
    ];

    const gradesTotal = orderedGrades.reduce((sum, g) => sum + Number(g.quantity || 0), 0);
    const totalQty = gradesTotal || rows.reduce((sum, p) => sum + productQty(p), 0);

    return {
      productId: formatProductId(primary || { productId, name: title }),
      variety: varieties.join(", ") || primary?.variety || "—",
      category,
      unit,
      farmers: rows.length,
      totalQty,
      grades: orderedGrades,
      status: primary?.status || "Active",
    };
  }, [rows, primary, productId, title]);

  return (
    <div className="min-w-0 space-y-2 p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[10px] text-[#6B7280]">
            <Link to={backTo} className="hover:text-[#217346]">
              All Products
            </Link>
            <span>›</span>
            <span className="text-[#1F2937]">Farmers</span>
          </div>
          <h1 className="mt-0.5 truncate text-base font-bold text-[#1F2937] sm:text-lg">{title}</h1>
        </div>
        <Link to={backTo} className={`${BTN} shrink-0`}>
          Back
        </Link>
      </div>

      {toast ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {toast}
        </div>
      ) : null}

      {loading ? (
        <div className={`${PANEL} p-4 text-center text-xs text-[#6B7280]`}>Loading…</div>
      ) : (
        <>
          {summary ? (
            <section className={PANEL}>
              <ProductSummaryMobile title={title} summary={summary} />
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[720px] text-xs">
                  <thead>
                    <tr className="border-b border-[#D4D4D4] bg-[#F2F2F2] text-left">
                      {["Product", "Product ID", "Qty", ...(summary.grades || []).map((g) => g.label), "Status"].map((h) => (
                        <th key={h} className="px-3 py-2 font-semibold text-[#6B7280]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#E5E7EB]">
                      <td className="px-3 py-2">
                        <p className="font-semibold text-[#217346]">{title}</p>
                        <p className="text-[10px] text-[#9CA3AF]">
                          {[summary.variety !== "—" ? summary.variety : null, summary.category].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        <CopyId value={summary.productId} />
                      </td>
                      <td className="px-3 py-2 font-semibold text-[#1F2937]">
                        {Number(summary.totalQty || 0).toLocaleString("en-IN")} {summary.unit}
                      </td>
                      {(summary.grades || []).map((g) => (
                        <td key={g.label} className="px-3 py-2 font-semibold tabular-nums text-[#1F2937]">
                          {Number(g.quantity || 0).toLocaleString("en-IN")} {summary.unit}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${productStatusClass(summary.status)}`}>
                          {summary.status}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {rows.length === 0 ? (
            <div className={`${PANEL} p-4 text-center text-xs text-[#6B7280]`}>
              No farmer has added this product yet.
            </div>
          ) : (
            <section>
              <p className="px-0.5 py-1 text-[12px] font-semibold text-[#1F2937] sm:hidden">
                Farmers ({rows.length})
              </p>

              <div className="grid grid-cols-2 gap-2 sm:hidden">
                {rows.map((p) => (
                  <FarmerCard
                    key={`${p.farmerId || ""}-${p.id || p.productId}`}
                    product={p}
                    farmerId={p.farmerId || ""}
                    farmerLabel={p.farmerLabel}
                    busyId={busyId}
                    onReview={handleReview}
                  />
                ))}
              </div>

              <div className={`${PANEL} hidden overflow-x-auto sm:block`}>
                <p className="border-b border-[#E5E7EB] px-3 py-2 text-[12px] font-semibold text-[#1F2937]">
                  Farmers ({rows.length})
                </p>
                <table className="w-full min-w-[640px] text-xs">
                  <thead>
                    <tr className="border-b border-[#D4D4D4] bg-[#F2F2F2] text-left">
                      {["Farmer", "Variety", "Product ID", "Qty", "Harvest", "Status"].map((h) => (
                        <th key={h} className="px-3 py-1.5 font-semibold text-[#6B7280]">
                          {h}
                        </th>
                      ))}
                      <th className="px-3 py-1.5 text-right font-semibold text-[#6B7280]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => {
                      const farmerId = p.farmerId || "";
                      const id = p.id || p.productId;
                      const canReview = isPendingProduct(p.status);
                      return (
                        <tr
                          key={`${farmerId}-${p.id || p.productId}`}
                          className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]"
                        >
                          <td className="px-3 py-1.5">
                            {farmerId ? (
                              <Link
                                to={`/vendor/all-farmers/${farmerId}`}
                                className="font-semibold text-[#217346] hover:underline"
                              >
                                {p.farmerLabel}
                              </Link>
                            ) : (
                              <span className="font-semibold text-[#1F2937]">{p.farmerLabel}</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-[#374151]">{p.variety || "—"}</td>
                          <td className="px-3 py-1.5">
                            <CopyId value={formatProductId(p)} />
                          </td>
                          <td className="px-3 py-1.5 font-semibold text-[#1F2937]">
                            {productQty(p).toLocaleString("en-IN")} {p.unit || "Kg"}
                          </td>
                          <td className="px-3 py-1.5 text-[#6B7280]">{harvestLabel(p)}</td>
                          <td className="px-3 py-1.5">
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${productStatusClass(p.status)}`}>
                              {p.status || "Active"}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {canReview ? (
                              <div className="flex flex-nowrap items-center justify-end gap-1">
                                <button type="button" disabled={busyId === id} onClick={() => handleReview(p, "approved")} className={APPROVE_BTN}>
                                  Approve
                                </button>
                                <button type="button" disabled={busyId === id} onClick={() => handleReview(p, "rejected")} className={REJECT_BTN}>
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-[#9CA3AF]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
