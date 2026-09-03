import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getManagerAllProducts } from "../../api/farmerApi";
import { formatProductBusinessId } from "../../utils/cropLinks";
import { isPendingProductApproval } from "../../utils/productActions";
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
  return `/farmer/manager/orders/create?${params.toString()}`;
}

function matchesViewedProduct(product, { productId, productName, productKey }) {
  const idNeedle = String(productId || "").trim();
  const nameNeedle = String(productName || "").trim().toLowerCase();
  const keyNeedle = decodeURIComponent(String(productKey || "")).trim().toLowerCase();
  const pid = String(product.productId || product.id || "").trim();
  const pname = productNameOf(product).trim().toLowerCase();

  if (nameNeedle && pname === nameNeedle) return true;
  if (idNeedle && isBusinessProductId(idNeedle) && pid === idNeedle) return true;
  if (keyNeedle && (pid.toLowerCase() === keyNeedle || pname === keyNeedle)) return true;
  return false;
}

function FarmerCard({ product, farmerId, farmerLabel }) {
  const qty = productQty(product);
  return (
    <div className="border-b border-[#E5E7EB] px-3 py-2.5 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {farmerId ? (
            <Link to={`/farmer/manager/farmers/${farmerId}`} className="block truncate text-[13px] font-semibold text-[#217346]">
              {farmerLabel}
            </Link>
          ) : (
            <p className="truncate text-[13px] font-semibold text-[#1F2937]">{farmerLabel}</p>
          )}
          <p className="mt-0.5 text-[11px] text-[#6B7280]">{product.variety || "—"}</p>
          <p className="mt-0.5 break-all font-mono text-[10px] text-emerald-700">{formatProductBusinessId(product)}</p>
        </div>
        <span className="shrink-0 rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
          {product.status || "Active"}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[13px] font-bold text-[#1F2937]">
          {qty.toLocaleString("en-IN")} {product.unit || "Kg"}
        </p>
        {isAvailableForOrder(product) ? (
          <Link to={orderCreatePath(product)} className={`${EXCEL_BTN_PRIMARY} !min-h-9 px-3 py-1.5 text-[11px]`}>
            Create Order
          </Link>
        ) : (
          <span className="text-[10px] text-[#9CA3AF]">Not available</span>
        )}
      </div>
    </div>
  );
}

export default function ManagerProductFarmersPage() {
  const { productKey } = useParams();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId") || "";
  const productNameParam = searchParams.get("name") || "";

  const [farmers, setFarmers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
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
    })();
  }, [productKey, productId, productNameParam]);

  const farmerName = (farmerId, fallback) =>
    fallback || farmers.find((f) => f.id === farmerId || f.farmerId === farmerId)?.name || "—";

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
            <Link to="/farmer/manager/orders?tab=by-product" className="hover:text-[#217346]">
              By Product
            </Link>
            <span>›</span>
            <span className="text-[#1F2937]">Details</span>
          </div>
          <h1 className="mt-0.5 truncate text-base font-bold text-[#1F2937] sm:text-lg">{title}</h1>
        </div>
        <Link to="/farmer/manager/orders?tab=by-product" className={`${EXCEL_BTN} shrink-0 !min-h-9 px-3 py-1.5 text-[11px]`}>
          Back
        </Link>
      </div>

      {loading ? (
        <div className={`${EXCEL_PANEL} p-4 text-center text-xs text-[#6B7280]`}>Loading…</div>
      ) : (
        <>
          {summary ? (
            <section className={EXCEL_PANEL}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-xs">
                  <thead>
                    <tr className="border-b border-[#D4D4D4] bg-[#F2F2F2] text-left">
                      {["Product", "Product ID", "Qty", "Status"].map((h) => (
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
                      <td className="px-3 py-2 font-mono text-[11px] text-emerald-700">{summary.productId}</td>
                      <td className="px-3 py-2 font-semibold text-[#1F2937]">
                        {Number(summary.totalQty || 0).toLocaleString("en-IN")} {summary.unit}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                          {summary.status}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {summary.grades.some((g) => Number(g.quantity) > 0) ? (
                <p className="border-t border-[#E5E7EB] px-3 py-2 text-[11px] text-[#6B7280]">
                  Grades:{" "}
                  <span className="font-semibold text-[#1F2937]">
                    {summary.grades
                      .filter((g) => Number(g.quantity) > 0)
                      .map((g) => `${g.label} ${Number(g.quantity).toLocaleString("en-IN")} ${summary.unit}`)
                      .join(" · ")}
                  </span>
                </p>
              ) : null}
            </section>
          ) : null}

          {rows.length === 0 ? (
            <div className={`${EXCEL_PANEL} p-4 text-center text-xs text-[#6B7280]`}>
              No farmer has added this product yet.
            </div>
          ) : (
            <section className={EXCEL_PANEL}>
              <p className="border-b border-[#E5E7EB] px-3 py-2 text-[12px] font-semibold text-[#1F2937]">
                Farmers ({rows.length})
              </p>

              <div className="sm:hidden">
                {rows.map((p) => (
                  <FarmerCard
                    key={`${p.farmerId || ""}-${p.id || p.productId}`}
                    product={p}
                    farmerId={p.farmerId || ""}
                    farmerLabel={p.farmerLabel}
                  />
                ))}
              </div>

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[640px] text-xs">
                  <thead>
                    <tr className="border-b border-[#D4D4D4] bg-[#F2F2F2] text-left">
                      {["Farmer", "Variety", "Product ID", "Qty", "Status"].map((h) => (
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
                                to={`/farmer/manager/farmers/${farmerId}`}
                                className="font-semibold text-[#217346] hover:underline"
                              >
                                {p.farmerLabel}
                              </Link>
                            ) : (
                              <span className="font-semibold text-[#1F2937]">{p.farmerLabel}</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-[#374151]">{p.variety || "—"}</td>
                          <td className="px-3 py-1.5 font-mono text-[11px] text-emerald-700">
                            {formatProductBusinessId(p)}
                          </td>
                          <td className="px-3 py-1.5 font-semibold text-[#1F2937]">
                            {productQty(p).toLocaleString("en-IN")} {p.unit || "Kg"}
                          </td>
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
