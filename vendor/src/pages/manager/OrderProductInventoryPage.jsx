import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getManagerAllProducts } from "../../api/managerPortApi";
import CopyId from "../../components/ui/CopyId";

import {
  extractProductGradeAndStock,
  formatProductId,
  matchesViewedProduct,
  productNameOf,
  productQty,
  productStatusClass,
  summarizeProductRows,
} from "../../utils/productList";
import { ArrowLeft, Leaf, Package, RefreshCw, ShoppingCart } from "lucide-react";

// ─── Style constants ─────────────────────────────────────────────────────────
const PANEL = "rounded-xl border border-[#D4D4D4] bg-white shadow-sm";
const TH =
  "border border-[#C5D4C8] bg-[#E8F0EA] px-2 py-2 text-center text-[9px] font-bold leading-tight text-[#374151] sm:px-3 sm:text-[10px]";
const TD =
  "border border-[#E5E7EB] px-2 py-2 text-[10px] leading-tight text-[#1F2937] sm:px-3 sm:text-[11px]";

const GRADE_COLORS = {
  "Grade A": {
    header:
      "border-l border-[#D4D4D4] bg-[#D1FAE5]/60 px-2 py-2 text-center text-[9px] font-bold text-[#065F46] sm:px-3 sm:text-[10px]",
    cell: "border border-[#E5E7EB] bg-[#ECFDF5]/30 px-2 py-2 text-center font-semibold tabular-nums text-[#065F46] sm:px-3 text-[10px] sm:text-[11px]",
  },
  "Grade B": {
    header:
      "border-l border-[#D4D4D4] bg-[#DBEAFE]/60 px-2 py-2 text-center text-[9px] font-bold text-[#1E40AF] sm:px-3 sm:text-[10px]",
    cell: "border border-[#E5E7EB] bg-[#EFF6FF]/30 px-2 py-2 text-center font-semibold tabular-nums text-[#1E40AF] sm:px-3 text-[10px] sm:text-[11px]",
  },
  "Grade C": {
    header:
      "border-l border-[#D4D4D4] bg-[#FEF3C7]/60 px-2 py-2 text-center text-[9px] font-bold text-[#92400E] sm:px-3 sm:text-[10px]",
    cell: "border border-[#E5E7EB] bg-[#FFFBEB]/30 px-2 py-2 text-center font-semibold tabular-nums text-[#92400E] sm:px-3 text-[10px] sm:text-[11px]",
  },
};
const DEFAULT_GRADES = ["Grade A", "Grade B", "Grade C"];

function gradeHeaderClass(label) {
  return (
    GRADE_COLORS[label]?.header ||
    "border-l border-[#D4D4D4] bg-[#F3F4F6] px-2 py-2 text-center text-[9px] font-bold text-[#374151] sm:px-3 sm:text-[10px]"
  );
}
function gradeCellClass(label) {
  return (
    GRADE_COLORS[label]?.cell ||
    "border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-2 text-center font-semibold tabular-nums text-[#374151] sm:px-3 text-[10px] sm:text-[11px]"
  );
}

// ─── Mobile farmer card ───────────────────────────────────────────────────────
function FarmerInventoryCard({ product, farmerLabel, farmerId }) {
  const qty = productQty(product);
  const unit = product.unit || "Kg";
  const parsed = extractProductGradeAndStock(product);
  const activeGrades = parsed.grades.filter((g) => Number(g.quantity || 0) > 0);

  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-3">
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          {farmerId ? (
            <Link
              to={`/vendor/all-farmers/${farmerId}`}
              className="block truncate text-[12px] font-semibold text-[#217346] hover:underline"
            >
              {farmerLabel}
            </Link>
          ) : (
            <p className="truncate text-[12px] font-semibold text-[#1F2937]">{farmerLabel}</p>
          )}
          <p className="mt-0.5 truncate text-[10px] text-[#6B7280]">{product.variety || "—"}</p>
        </div>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${productStatusClass(
            product.status
          )}`}
        >
          {product.status || "Active"}
        </span>
      </div>
      <CopyId
        value={formatProductId(product)}
        className="mt-1"
        textClassName="font-mono text-[9px] text-emerald-700"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-[#6B7280]">Total</span>
        <span className="text-[13px] font-bold tabular-nums text-[#1F2937]">
          {qty.toLocaleString("en-IN")} {unit}
        </span>
      </div>
      {activeGrades.length > 0 && (
        <div className="mt-1.5 overflow-hidden rounded-md border border-[#E5E7EB]">
          <div className="grid grid-cols-2 bg-[#F8FAF8] px-2 py-1 text-[9px] font-bold text-[#6B7280]">
            <span>Grade</span>
            <span className="text-right">Stock</span>
          </div>
          {activeGrades.map((g) => (
            <div
              key={g.label}
              className="grid grid-cols-2 items-center border-t border-[#E5E7EB] px-2 py-1 text-[11px]"
            >
              <span className="font-semibold text-[#1F2937]">{g.label}</span>
              <span className="text-right font-semibold tabular-nums text-[#1F2937]">
                {Number(g.quantity).toLocaleString("en-IN")} {unit}
              </span>
            </div>
          ))}
        </div>
      )}
      {farmerId && (
        <div className="mt-2">
          <Link
            to={`/vendor/orders/create?farmerId=${farmerId}&productId=${formatProductId(product) || product.id || product.productId || ""}`}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#217346] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#1a5c38]"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Create Order
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────
export default function OrderProductInventoryPage() {
  const { productKey } = useParams();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId") || "";
  const productNameParam = searchParams.get("name") || "";

  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await getManagerAllProducts().catch(() => ({
        farmers: [],
        products: [],
      }));
      setFarmers(Array.isArray(data.farmers) ? data.farmers : []);
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch {
      setFarmers([]);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productKey, productId, productNameParam]);

  const farmerName = (fid, fallback) =>
    fallback ||
    farmers.find((f) => f.id === fid || f.farmerId === fid)?.name ||
    "—";

  // Filter & enrich rows
  const rows = useMemo(
    () =>
      products
        .filter((p) =>
          matchesViewedProduct(p, {
            productId,
            productName: productNameParam,
            productKey,
          })
        )
        .map((p) => ({ ...p, farmerLabel: farmerName(p.farmerId, p.farmerName) }))
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
    productNameParam ||
    productNameOf(primary || {}) ||
    decodeURIComponent(productKey || "Product");

  // Summary stats
  const summary = useMemo(() => {
    if (!rows.length) return null;
    const varieties = Array.from(
      new Set(rows.map((p) => String(p.variety || "").trim()).filter(Boolean))
    );
    const category =
      [primary?.category, primary?.subCategory].filter(Boolean).join(" · ") || "—";
    const unit = primary?.unit || "Kg";
    const parsed = summarizeProductRows(rows);
    return {
      productId: formatProductId(primary || { productId, name: title }),
      variety: varieties.join(", ") || primary?.variety || "—",
      category,
      unit,
      farmerCount: rows.length,
      totalQty: parsed.totalQty,
      gradeA: parsed.gradeA,
      gradeB: parsed.gradeB,
      gradeC: parsed.gradeC,
      grades: parsed.grades,
    };
  }, [rows, primary, productId, title]);

  const extraGrades = useMemo(
    () =>
      (summary?.grades || []).filter(
        (g) => !DEFAULT_GRADES.includes(g.label) && Number(g.quantity || 0) > 0
      ),
    [summary]
  );
  const allGradeCols = [...DEFAULT_GRADES, ...extraGrades.map((g) => g.label)];

  const summaryGradeMap = useMemo(
    () =>
      new Map(
        (summary?.grades || []).map((g) => [g.label, Number(g.quantity || 0)])
      ),
    [summary]
  );

  return (
    <div className="min-w-0 space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-1 text-[10px] text-[#6B7280]">
            <Link to="/vendor/orders/products" className="hover:text-[#217346]">
              Order By Products
            </Link>
            <span>›</span>
            <span className="truncate font-medium text-[#1F2937]">{title}</span>
          </div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-[#1F2937] sm:text-xl">
            <Package className="h-5 w-5 shrink-0 text-[#217346]" />
            {title}
          </h1>
          {summary && (
            <p className="mt-0.5 text-[11px] text-[#6B7280]">
              {[summary.variety !== "—" ? summary.variety : null, summary.category]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4D4D4] bg-white px-3 py-1.5 text-[11px] font-medium text-[#374151] hover:bg-[#F9F9F9] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-emerald-600" : ""}`}
            />
            Refresh
          </button>
          <Link
            to="/vendor/orders/products"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4D4D4] bg-white px-3 py-1.5 text-[11px] font-medium text-[#374151] hover:bg-[#F9F9F9]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>
      </div>

      {loading ? (
        <div
          className={`${PANEL} flex items-center justify-center gap-2 p-8 text-xs text-[#6B7280]`}
        >
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
          Loading inventory…
        </div>
      ) : (
        <>
          {/* Summary tiles */}
          {summary ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                {
                  label: "Total Stock",
                  value: `${summary.totalQty.toLocaleString("en-IN")} ${summary.unit}`,
                  color: "text-[#1F2937]",
                },
                {
                  label: "Grade A",
                  value:
                    summary.gradeA > 0
                      ? `${summary.gradeA.toLocaleString("en-IN")} ${summary.unit}`
                      : "—",
                  color: "text-[#065F46]",
                },
                {
                  label: "Grade B",
                  value:
                    summary.gradeB > 0
                      ? `${summary.gradeB.toLocaleString("en-IN")} ${summary.unit}`
                      : "—",
                  color: "text-[#1E40AF]",
                },
                {
                  label: "Grade C",
                  value:
                    summary.gradeC > 0
                      ? `${summary.gradeC.toLocaleString("en-IN")} ${summary.unit}`
                      : "—",
                  color: "text-[#92400E]",
                },
              ].map((s) => (
                <div key={s.label} className={`${PANEL} px-3 py-2`}>
                  <p className="text-[10px] text-[#6B7280]">{s.label}</p>
                  <p className={`mt-0.5 text-sm font-bold sm:text-base ${s.color}`}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {/* Extra grade tiles */}
          {extraGrades.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {extraGrades.map((g) => (
                <div key={g.label} className={`${PANEL} px-3 py-2`}>
                  <p className="text-[10px] text-[#6B7280]">{g.label}</p>
                  <p className="mt-0.5 text-sm font-bold text-[#374151]">
                    {Number(g.quantity).toLocaleString("en-IN")} {summary?.unit || "Kg"}
                  </p>
                </div>
              ))}
            </div>
          )}

          {rows.length === 0 ? (
            <div
              className={`${PANEL} flex flex-col items-center gap-2 p-10 text-center`}
            >
              <Leaf className="h-8 w-8 text-[#9CA3AF]" />
              <p className="text-sm font-medium text-[#6B7280]">
                No farmers have added this product yet.
              </p>
            </div>
          ) : (
            <div className={PANEL}>
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-2.5">
                <p className="text-[12px] font-semibold text-[#1F2937]">
                  Farmer-wise Inventory
                </p>
                <span className="rounded-full bg-[#E8F0EA] px-2 py-0.5 text-[10px] font-semibold text-[#217346]">
                  {rows.length} farmer{rows.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Mobile cards */}
              <div className="grid grid-cols-1 gap-2 p-3 sm:hidden">
                {rows.map((p) => (
                  <FarmerInventoryCard
                    key={`${p.farmerId || ""}-${p.id || p.productId}`}
                    product={p}
                    farmerLabel={p.farmerLabel}
                    farmerId={p.farmerId || ""}
                  />
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[700px] border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className={TH + " border text-left"}>Farmer</th>
                      <th className={TH + " border text-left"}>Variety</th>
                      <th className={TH + " border text-left"}>Product ID</th>
                      {allGradeCols.map((label) => (
                        <th key={label} className={gradeHeaderClass(label)}>
                          {label}
                        </th>
                      ))}
                      <th className="border border-[#C5D4C8] bg-[#E8F5E9] px-2 py-2 text-right text-[9px] font-bold text-[#1F2937] sm:px-3 sm:text-[10px]">
                        Total Qty
                      </th>
                      <th className={TH + " border"}>Status</th>
                      <th className="sticky right-0 z-20 border border-[#C5D4C8] bg-[#E8F0EA] px-2 py-2 text-center text-[9px] font-bold text-[#374151] sm:px-3 sm:text-[10px]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>

                    {/* Per-farmer rows */}
                    {rows.map((p) => {
                      const fid = p.farmerId || "";
                      const unit = p.unit || "Kg";
                      const parsed = extractProductGradeAndStock(p);
                      const total = parsed.totalStock;
                      const gMap = parsed.gradeMap;

                      return (
                        <tr
                          key={`${fid}-${p.id || p.productId}`}
                          className="border-b border-[#E5E7EB] last:border-0 hover:bg-[#F9FAFB]"
                        >
                          <td className={TD}>
                            {fid ? (
                              <Link
                                to={`/vendor/all-farmers/${fid}`}
                                className="font-semibold text-[#217346] hover:underline"
                              >
                                {p.farmerLabel}
                              </Link>
                            ) : (
                              <span className="font-semibold text-[#1F2937]">
                                {p.farmerLabel}
                              </span>
                            )}
                          </td>
                          <td className={TD + " text-[#374151]"}>{p.variety || "—"}</td>
                          <td className={TD}>
                            <CopyId value={formatProductId(p)} />
                          </td>
                          {allGradeCols.map((label) => {
                            const qty = gMap.get(label) || 0;
                            return (
                              <td key={label} className={gradeCellClass(label)}>
                                {qty > 0
                                  ? `${qty.toLocaleString("en-IN")} ${unit}`
                                  : "—"}
                              </td>
                            );
                          })}
                          <td className="border border-[#E5E7EB] bg-[#E8F5E9]/20 px-2 py-2 text-right text-[11px] font-bold tabular-nums text-[#1F2937] sm:px-3">
                            {total.toLocaleString("en-IN")} {unit}
                          </td>
                          <td className={TD + " text-center"}>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${productStatusClass(
                                p.status
                              )}`}
                            >
                              {p.status || "Active"}
                            </span>
                          </td>
                          <td className="sticky right-0 z-10 whitespace-nowrap border border-[#D4D4D4] bg-white px-2 py-2 text-center sm:px-3">
                            {fid ? (
                              <Link
                                to={`/vendor/orders/create?farmerId=${fid}&productId=${formatProductId(p) || p.id || p.productId || ""}`}
                                className="inline-flex items-center gap-1 rounded-md bg-[#217346] px-2 py-1 text-[9px] font-semibold text-white hover:bg-[#1a5c38] sm:text-[10px]"
                              >
                                <ShoppingCart className="h-3 w-3" />
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
