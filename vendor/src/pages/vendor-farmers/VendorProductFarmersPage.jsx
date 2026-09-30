import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";
import CopyId from "../../components/ui/CopyId";
import {
  extractProductGradeAndStock,
  formatProductId,
  isPendingProduct,
  matchesViewedProduct,
  productNameOf,
  productQty,
  productStatusClass,
  summarizeProductRows,
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
  return extractProductGradeAndStock(product).grades;
}

function GradesTable({ grades = [], unit = "Kg" }) {
  const rows = (grades || []).filter((g) => g.label && Number(g.quantity || 0) > 0);
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
    const parsed = summarizeProductRows(rows);

    return {
      productId: formatProductId(primary || { productId, name: title }),
      variety: varieties.join(", ") || primary?.variety || "—",
      category,
      unit,
      farmers: rows.length,
      totalQty: parsed.totalQty,
      gradeA: parsed.gradeA,
      gradeB: parsed.gradeB,
      gradeC: parsed.gradeC,
      grades: parsed.grades,
      status: primary?.status || "Active",
    };
  }, [rows, primary, productId, title]);

  const summaryGradeMap = useMemo(
    () => new Map((summary?.grades || []).map((g) => [g.label, Number(g.quantity || 0)])),
    [summary]
  );
  const summaryGradeA = summaryGradeMap.get("Grade A") || 0;
  const summaryGradeB = summaryGradeMap.get("Grade B") || 0;
  const summaryGradeC = summaryGradeMap.get("Grade C") || 0;
  const extraGrades = (summary?.grades || []).filter((g) => !["Grade A", "Grade B", "Grade C"].includes(g.label));

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
                <table className="w-full min-w-[760px] text-xs">
                  <thead>
                    <tr className="border-b border-[#D4D4D4] bg-[#F2F2F2] text-left">
                      <th className="px-3 py-2 font-semibold text-[#6B7280]">Product</th>
                      <th className="px-3 py-2 font-semibold text-[#6B7280]">Product ID</th>
                      <th className="border-l border-[#D4D4D4] bg-[#D1FAE5]/60 px-3 py-2 text-center font-bold text-[#065F46]">
                        Grade A
                      </th>
                      <th className="border-l border-[#D4D4D4] bg-[#DBEAFE]/60 px-3 py-2 text-center font-bold text-[#1E40AF]">
                        Grade B
                      </th>
                      <th className="border-l border-[#D4D4D4] bg-[#FEF3C7]/60 px-3 py-2 text-center font-bold text-[#92400E]">
                        Grade C
                      </th>
                      {extraGrades.map((g) => (
                        <th key={g.label} className="border-l border-[#D4D4D4] bg-[#F3F4F6] px-3 py-2 text-center font-bold text-[#374151]">
                          {g.label}
                        </th>
                      ))}
                      <th className="border-l border-[#D4D4D4] bg-[#E8F5E9] px-3 py-2 text-right font-bold text-[#1F2937]">
                        Total Qty
                      </th>
                      <th className="border-l border-[#D4D4D4] px-3 py-2 text-center font-semibold text-[#6B7280]">
                        Status
                      </th>
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
                      <td className="border-l border-[#E5E7EB] bg-[#ECFDF5]/30 px-3 py-2 text-center font-semibold tabular-nums text-[#065F46]">
                        {summaryGradeA > 0 ? `${summaryGradeA.toLocaleString("en-IN")} ${summary.unit}` : "—"}
                      </td>
                      <td className="border-l border-[#E5E7EB] bg-[#EFF6FF]/30 px-3 py-2 text-center font-semibold tabular-nums text-[#1E40AF]">
                        {summaryGradeB > 0 ? `${summaryGradeB.toLocaleString("en-IN")} ${summary.unit}` : "—"}
                      </td>
                      <td className="border-l border-[#E5E7EB] bg-[#FFFBEB]/30 px-3 py-2 text-center font-semibold tabular-nums text-[#92400E]">
                        {summaryGradeC > 0 ? `${summaryGradeC.toLocaleString("en-IN")} ${summary.unit}` : "—"}
                      </td>
                      {extraGrades.map((g) => (
                        <td key={g.label} className="border-l border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-center font-semibold tabular-nums text-[#374151]">
                          {Number(g.quantity || 0) > 0 ? `${Number(g.quantity).toLocaleString("en-IN")} ${summary.unit}` : "—"}
                        </td>
                      ))}
                      <td className="border-l border-[#E5E7EB] bg-[#E8F5E9]/30 px-3 py-2 text-right font-bold tabular-nums text-[#1F2937]">
                        {Number(summary.totalQty || 0).toLocaleString("en-IN")} {summary.unit}
                      </td>
                      <td className="border-l border-[#E5E7EB] px-3 py-2 text-center">
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
                <table className="w-full min-w-[760px] text-xs">
                  <thead>
                    <tr className="border-b border-[#D4D4D4] bg-[#F2F2F2] text-left">
                      <th className="px-3 py-2 font-semibold text-[#6B7280]">Farmer</th>
                      <th className="px-3 py-2 font-semibold text-[#6B7280]">Variety</th>
                      <th className="px-3 py-2 font-semibold text-[#6B7280]">Product ID</th>
                      <th className="border-l border-[#D4D4D4] bg-[#D1FAE5]/60 px-3 py-2 text-center font-bold text-[#065F46]">
                        Grade A
                      </th>
                      <th className="border-l border-[#D4D4D4] bg-[#DBEAFE]/60 px-3 py-2 text-center font-bold text-[#1E40AF]">
                        Grade B
                      </th>
                      <th className="border-l border-[#D4D4D4] bg-[#FEF3C7]/60 px-3 py-2 text-center font-bold text-[#92400E]">
                        Grade C
                      </th>
                      {extraGrades.map((g) => (
                        <th key={g.label} className="border-l border-[#D4D4D4] bg-[#F3F4F6] px-3 py-2 text-center font-bold text-[#374151]">
                          {g.label}
                        </th>
                      ))}
                      <th className="border-l border-[#D4D4D4] bg-[#E8F5E9] px-3 py-2 text-right font-bold text-[#1F2937]">
                        Total Qty
                      </th>
                      <th className="border-l border-[#D4D4D4] px-3 py-2 font-semibold text-[#6B7280]">Harvest</th>
                      <th className="border-l border-[#D4D4D4] px-3 py-2 text-center font-semibold text-[#6B7280]">Status</th>
                      <th className="sticky right-0 z-10 border-l border-[#D4D4D4] bg-[#F2F2F2] px-3 py-2 text-right font-semibold text-[#6B7280]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((p) => {
                      const farmerId = p.farmerId || "";
                      const id = p.id || p.productId;
                      const canReview = isPendingProduct(p.status);
                      const unit = p.unit || "Kg";
                      const parsed = extractProductGradeAndStock(p);
                      const gA = parsed.gradeA;
                      const gB = parsed.gradeB;
                      const gC = parsed.gradeC;
                      const total = parsed.totalStock;
                      const gMap = parsed.gradeMap;

                      return (
                        <tr
                          key={`${farmerId}-${p.id || p.productId}`}
                          className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]"
                        >
                          <td className="px-3 py-2">
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
                          <td className="px-3 py-2 text-[#374151]">{p.variety || "—"}</td>
                          <td className="px-3 py-2">
                            <CopyId value={formatProductId(p)} />
                          </td>
                          <td className="border-l border-[#E5E7EB] bg-[#ECFDF5]/30 px-3 py-2 text-center font-semibold tabular-nums text-[#065F46]">
                            {gA > 0 ? `${gA.toLocaleString("en-IN")} ${unit}` : "—"}
                          </td>
                          <td className="border-l border-[#E5E7EB] bg-[#EFF6FF]/30 px-3 py-2 text-center font-semibold tabular-nums text-[#1E40AF]">
                            {gB > 0 ? `${gB.toLocaleString("en-IN")} ${unit}` : "—"}
                          </td>
                          <td className="border-l border-[#E5E7EB] bg-[#FFFBEB]/30 px-3 py-2 text-center font-semibold tabular-nums text-[#92400E]">
                            {gC > 0 ? `${gC.toLocaleString("en-IN")} ${unit}` : "—"}
                          </td>
                          {extraGrades.map((g) => {
                            const val = gMap.get(g.label) || 0;
                            return (
                              <td key={g.label} className="border-l border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 text-center font-semibold tabular-nums text-[#374151]">
                                {val > 0 ? `${val.toLocaleString("en-IN")} ${unit}` : "—"}
                              </td>
                            );
                          })}
                          <td className="border-l border-[#E5E7EB] bg-[#E8F5E9]/30 px-3 py-2 text-right font-bold tabular-nums text-[#1F2937]">
                            {total.toLocaleString("en-IN")} {unit}
                          </td>
                          <td className="border-l border-[#E5E7EB] px-3 py-2 text-[#6B7280]">{harvestLabel(p)}</td>
                          <td className="border-l border-[#E5E7EB] px-3 py-2 text-center">
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${productStatusClass(p.status)}`}>
                              {p.status || "Active"}
                            </span>
                          </td>
                          <td className="sticky right-0 z-10 whitespace-nowrap border-l border-[#D4D4D4] bg-white px-3 py-2 text-right">
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
