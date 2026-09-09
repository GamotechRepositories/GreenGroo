import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getManagerAllProducts, reviewManagerFarmerProduct } from "../../api/farmerApi";
import { formatProductBusinessId } from "../../utils/cropLinks";
import { isPendingProductApproval } from "../../utils/productActions";
import CopyId from "../../components/ui/CopyId";
import {
  EXCEL_PANEL,
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
} from "../../utils/excelStyles";

function isBusinessProductId(value) {
  const id = String(value || "").trim();
  return Boolean(id) && !/^[a-f0-9]{24}$/i.test(id);
}

function productNameOf(item = {}) {
  return item.productName || item.name || "Farm Produce";
}

function productQty(product) {
  const gradesSum = (product.grades || []).reduce((s, g) => s + Number(g.quantity || 0), 0);
  return gradesSum || Number(product.availableQuantity ?? product.stock ?? 0);
}

function isAvailableForOrder(product) {
  const status = String(product?.status || "").trim();
  if (!status) return true;
  if (isPendingProductApproval(status)) return false;
  if (status === "Draft" || status === "Rejected" || status === "Paused") return false;
  return true;
}

function orderCreatePath(product) {
  const params = new URLSearchParams({
    farmerId: product.farmerId || "",
    productId: product.id || product.productId || "",
  });
  return `/manager/orders/create?${params.toString()}`;
}

function matchesViewedProduct(product, { productId, productName, productKey }) {
  const idNeedle = String(productId || "").trim();
  const nameNeedle = String(productName || "").trim().toLowerCase();
  const keyNeedle = decodeURIComponent(String(productKey || "")).trim();
  const pid = String(product.productId || product.id || "").trim();
  const pname = productNameOf(product).trim().toLowerCase();
  const varietyKey = `${pname}|${String(product.variety || "").trim().toLowerCase()}`;

  if (idNeedle && isBusinessProductId(idNeedle)) {
    return pid.toUpperCase() === idNeedle.toUpperCase();
  }
  if (keyNeedle && isBusinessProductId(keyNeedle)) {
    return pid.toUpperCase() === keyNeedle.toUpperCase();
  }
  if (keyNeedle.includes("|") && varietyKey === keyNeedle.toLowerCase()) return true;
  if (nameNeedle && pname === nameNeedle) return true;
  if (keyNeedle && (pid.toLowerCase() === keyNeedle.toLowerCase() || pname === keyNeedle.toLowerCase())) return true;
  return false;
}

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

function statusClass(status) {
  if (status === "Active" || status === "Approved") return "bg-green-50 text-green-700";
  if (isPendingProductApproval(status)) return "bg-yellow-100 text-yellow-700";
  if (status === "Rejected") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-600";
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
        <div
          key={g.label}
          className="grid grid-cols-2 items-center border-t border-[#E5E7EB] px-2 py-1.5 text-[12px]"
        >
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
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${statusClass(summary.status)}`}>
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
  const canReview = isPendingProductApproval(product.status);
  const unit = product.unit || "Kg";
  return (
    <div className="min-w-0 rounded-lg border border-[#E5E7EB] bg-white p-2">
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          {farmerId ? (
            <Link to={`/manager/farmers/${farmerId}`} className="block truncate text-[12px] font-semibold text-[#217346]">
              {farmerLabel}
            </Link>
          ) : (
            <p className="truncate text-[12px] font-semibold text-[#1F2937]">{farmerLabel}</p>
          )}
          <p className="mt-0.5 truncate text-[10px] text-[#6B7280]">
            {product.variety || "—"} · {harvestLabel(product)}
          </p>
        </div>
        <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold ${statusClass(product.status)}`}>
          {product.status || "Active"}
        </span>
      </div>
      <CopyId value={formatProductBusinessId(product)} className="mt-1" textClassName="font-mono text-[9px] text-emerald-700" />
      <p className="mt-1 text-[12px] font-bold tabular-nums text-[#1F2937]">
        {qty.toLocaleString("en-IN")} {unit}
      </p>
      <GradesTable grades={listingGrades(product)} unit={unit} />
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {isAvailableForOrder(product) ? (
          <Link to={orderCreatePath(product)} className={`${EXCEL_BTN_PRIMARY} !min-h-8 flex-1 px-2 py-1 text-center text-[10px]`}>
            Create Order
          </Link>
        ) : null}
        {canReview ? (
          <>
            <button type="button" disabled={busyId === id} onClick={() => onReview(product, "approved")} className={APPROVE_BTN}>
              Approve
            </button>
            <button type="button" disabled={busyId === id} onClick={() => onReview(product, "rejected")} className={REJECT_BTN}>
              Reject
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function ManagerProductFarmersPage() {
  const { productKey } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId") || "";
  const productNameParam = searchParams.get("name") || "";
  const fromProducts = location.pathname.includes("/manager/products/");
  const backTo = fromProducts ? "/manager/products" : "/manager/orders?tab=by-product";
  const backLabel = fromProducts ? "All Products" : "By Product";

  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getManagerAllProducts().catch(() => ({ farmers: [], products: [] }));
      setFarmers(Array.isArray(data?.farmers) ? data.farmers : []);
      setProducts(Array.isArray(data?.products) ? data.products : []);
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
      await reviewManagerFarmerProduct(product.farmerId, id, decision, reason);
      toast.success(decision === "approved" ? "Product approved" : "Product rejected");
      await loadData();
    } catch (err) {
      toast.error(err.message || "Failed to review product");
    } finally {
      setBusyId("");
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

  const title =
    productNameParam || productNameOf(primary || {}) || decodeURIComponent(productKey || "Product");

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

    // Always show Grade A / B / C, then any other grades
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
      productId: formatProductBusinessId(primary || { productId, name: title }),
      variety: varieties.join(", ") || primary?.variety || "—",
      category,
      unit,
      farmers: rows.length,
      totalQty,
      grades: orderedGrades,
      status: primary?.status || "Active",
      cropName: primary?.cropName || primary?.crop?.name || title,
    };
  }, [rows, primary, productId, title]);

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[10px] text-[#6B7280]">
            <Link to={backTo} className="hover:text-[#217346]">
              {backLabel}
            </Link>
            <span>›</span>
            <span className="text-[#1F2937]">Farmers</span>
          </div>
          <h1 className="mt-0.5 truncate text-base font-bold text-[#1F2937] sm:text-lg">{title}</h1>
        </div>
        <Link to={backTo} className={`${EXCEL_BTN} shrink-0 !min-h-9 px-3 py-1.5 text-[11px]`}>
          Back
        </Link>
      </div>

      {loading ? (
        <div className={`${EXCEL_PANEL} p-4 text-center text-xs text-[#6B7280]`}>Loading…</div>
      ) : (
        <>
          {summary ? (
            <section className={EXCEL_PANEL}>
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
                          {[summary.variety !== "—" ? summary.variety : null, summary.category]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        <CopyId value={summary.productId} />
                      </td>
                      <td className="px-3 py-2 font-semibold text-[#1F2937]">
                        {Number(summary.totalQty || 0).toLocaleString("en-IN")} {summary.unit}
                      </td>
                      {(summary.grades || []).map((g) => {
                        const qty = Number(g.quantity || 0);
                        return (
                          <td key={g.label} className="px-3 py-2 font-semibold tabular-nums text-[#1F2937]">
                            {qty.toLocaleString("en-IN")} {summary.unit}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${statusClass(summary.status)}`}>
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
            <div className={`${EXCEL_PANEL} p-4 text-center text-xs text-[#6B7280]`}>
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

              <div className={`${EXCEL_PANEL} hidden overflow-x-auto sm:block`}>
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
                      return (
                        <tr
                          key={`${farmerId}-${p.id || p.productId}`}
                          className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]"
                        >
                          <td className="px-3 py-1.5">
                            {farmerId ? (
                              <Link
                                to={`/manager/farmers/${farmerId}`}
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
                            <CopyId value={formatProductBusinessId(p)} />
                          </td>
                          <td className="px-3 py-1.5 font-semibold text-[#1F2937]">
                            {productQty(p).toLocaleString("en-IN")} {p.unit || "Kg"}
                          </td>
                          <td className="px-3 py-1.5 text-[#6B7280]">{harvestLabel(p)}</td>
                          <td className="px-3 py-1.5">
                            <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                              {p.status || "Active"}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {isAvailableForOrder(p) ? (
                              <Link
                                to={orderCreatePath(p)}
                                className={`${EXCEL_BTN_PRIMARY} !min-h-7 px-2.5 py-1 text-[10px]`}
                              >
                                Create Order
                              </Link>
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
