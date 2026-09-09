import { Fragment, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getMyOrders, getMyProducts } from "../api/farmerApi";
import { usePolling } from "../hooks/usePolling";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import SpreadsheetViewport from "../components/ui/SpreadsheetViewport";
import StatusBadge from "../components/ui/StatusBadge";
import CopyId from "../components/ui/CopyId";
import { canonicalOrderStatus, formatMoney } from "../utils/orderDisplay";
import {
  STATEMENT_GRADES,
  gradeStatementMap,
  gradeStatementRows,
  gradeStatementTotals,
} from "../utils/gradeStatement";
import { formatCropDate, formatProductBusinessId } from "../utils/cropLinks";
import { formatProductPrice } from "../utils/productActions";
import { EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE, EXCEL_PANEL } from "../utils/excelStyles";

const DEFAULT_GRADES = STATEMENT_GRADES;

const TH =
  "border border-[#9CA3AF] bg-[#E8F0EA] px-0 py-0 text-center align-middle text-[10px] font-bold leading-tight text-[#374151] md:py-1 md:text-[11px]";
const TD =
  "overflow-hidden border border-[#9CA3AF] px-0 py-0 text-center align-middle text-[10px] leading-tight text-[#1F2937] md:py-1 md:text-[11px]";

const GRADE_COLORS = {
  "Grade A": {
    head: "border-[#A7F3D0] bg-[#D1FAE5] text-[#065F46]",
    cell: "border-[#A7F3D0] bg-[#ECFDF5]",
    text: "text-[#065F46]",
  },
  "Grade B": {
    head: "border-[#BFDBFE] bg-[#DBEAFE] text-[#1E40AF]",
    cell: "border-[#BFDBFE] bg-[#EFF6FF]",
    text: "text-[#1E40AF]",
  },
  "Grade C": {
    head: "border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]",
    cell: "border-[#FDE68A] bg-[#FFFBEB]",
    text: "text-[#92400E]",
  },
};

const REJECTED_TONE = {
  head: "border-[#FECACA] bg-[#FEE2E2] text-[#991B1B]",
  cell: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
};

function gradeTone(label = "") {
  return (
    GRADE_COLORS[label] || {
      head: "border-[#E5E7EB] bg-[#F3F4F6] text-[#374151]",
      cell: "border-[#E5E7EB] bg-[#F9FAFB]",
      text: "text-[#374151]",
    }
  );
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.slice(0, 10).split("-").map(Number);
    const local = new Date(y, m - 1, d);
    return Number.isNaN(local.getTime()) ? null : local;
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function shortDate(value) {
  const d = parseDate(value);
  if (!d) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function weekdayName(value) {
  const d = parseDate(value);
  if (!d) return "";
  return WEEKDAYS[d.getDay()] || "";
}

function DateWithDay({ value }) {
  const date = shortDate(value);
  const day = weekdayName(value);
  return (
    <>
      <span className="block">{date}</span>
      {day ? <span className="block text-[10px] font-medium text-[#6B7280]">{day}</span> : null}
    </>
  );
}

function HeadLabel({ line1, line2 }) {
  return (
    <>
      <span className="block">{line1}</span>
      {line2 ? <span className="block">{line2}</span> : null}
    </>
  );
}

function formatTime12h(value) {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  if (/am|pm/i.test(raw)) {
    return raw.replace(/\s+/g, " ").replace(/am/i, "AM").replace(/pm/i, "PM");
  }
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return raw;
  let hour = Number(m[1]);
  const min = m[2];
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return raw;
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${min} ${period}`;
}

function isGradedOrder(order) {
  const status = canonicalOrderStatus(order.status);
  const quality = String(order.qualityStatus || "").toUpperCase();
  return (
    status === "GRADE_CONFIRMED" ||
    status === "ORDER_COMPLETED" ||
    quality === "GRADE_CONFIRMED" ||
    quality === "ORDER_COMPLETED"
  );
}

function isStatementOrder(order) {
  return isGradedOrder(order);
}

function gradeDetailMap(order) {
  const map = gradeStatementMap(order);
  const unit = order.unit || "Kg";
  Object.keys(map).forEach((label) => {
    map[label] = { ...map[label], unit: map[label].unit || unit };
  });
  return map;
}

function rejectedTotal(order, map) {
  const fromGrades = Object.values(map || {}).reduce((sum, row) => sum + Number(row.rejected || 0), 0);
  if (fromGrades > 0) return fromGrades;
  return Number(order.rejectedQuantity || 0);
}

function orderAmount(order) {
  const totals = gradeStatementTotals(gradeStatementRows(order));
  if (totals.amount > 0) return totals.amount;
  return Number(order.orderValue || order.totalAmount || 0);
}

function formatQty(qty, unit, { danger = false } = {}) {
  const n = Number(qty || 0);
  if (!(n > 0)) return <span className="font-semibold text-[#9CA3AF]">×</span>;
  return (
    <span className={`text-[12px] font-bold leading-tight ${danger ? "text-[#DC2626]" : "text-[#1F2937]"}`}>
      {n.toLocaleString("en-IN")}
      <span className={`ml-0.5 text-[10px] font-semibold ${danger ? "text-[#F87171]" : "text-[#6B7280]"}`}>
        {unit || "Kg"}
      </span>
    </span>
  );
}

function formatRate(rate, qty = 0) {
  if (!(Number(qty || 0) > 0)) return <span className="font-semibold text-[#9CA3AF]">×</span>;
  const n = Number(rate || 0);
  if (!(n > 0)) return <span className="font-semibold text-[#9CA3AF]">×</span>;
  return <span className="font-semibold text-[#1F2937]">{formatMoney(n)}</span>;
}

function formatCurrency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function catalogKey(product) {
  return String(
    product?.productId || product?.id || product?._id || `${product?.productName || product?.name || "Product"}::${product?.variety || ""}`
  );
}

function orderMatchesProduct(order, product) {
  if (!order || !product) return false;
  const oid = String(order.productId || order.product_id || "").trim();
  const pid = String(product.productId || product.id || product._id || "").trim();
  if (oid && pid && oid === pid) return true;
  const oname = String(order.productName || order.product || "").trim().toLowerCase();
  const pname = String(product.productName || product.name || "").trim().toLowerCase();
  const ov = String(order.variety || "").trim().toLowerCase();
  const pv = String(product.variety || "").trim().toLowerCase();
  return Boolean(oname && pname && oname === pname && ov === pv);
}

function productPhoto(product) {
  return product?.media?.mainPhoto || product?.image || "";
}

function splitEarnings(total) {
  const t = Math.round(Number(total) || 0);
  const deposited = Math.round(t * 0.7);
  return { total: t, deposited, balance: t - deposited };
}

function ProductPhoto({ src, name, className }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className={`flex items-center justify-center bg-emerald-50 text-emerald-800 ${className}`}>
        <span className="text-lg font-bold">{String(name || "P").slice(0, 1).toUpperCase()}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name || "Product"}
      className={`object-cover ${className}`}
      onError={() => setBroken(true)}
    />
  );
}

function DetailItem({ label, value, compact = false }) {
  return (
    <div className="min-w-0">
      <p className={`${compact ? "text-[9px]" : "text-[10px]"} font-semibold uppercase tracking-wide text-slate-500`}>
        {label}
      </p>
      <div
        className={`mt-0.5 break-words font-semibold leading-snug text-[#1F2937] ${
          compact ? "text-[11px]" : "text-[12px]"
        }`}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function ProductEarningsCard({ item, onOpen }) {
  const src = item.product || {};
  const unit = src.unit || item.unit || "Kg";
  const money = splitEarnings(item.amount);
  const details = [
    ["Product ID", <CopyId key="id" value={formatProductBusinessId(src)} textClassName="font-mono text-[10px] font-semibold tracking-wide text-emerald-700" />],
    ["Crop", src.cropName],
    ["Variety", src.variety || item.variety],
    ["Farm", src.farmName],
    ["Location", src.farmLocation],
    ["Harvest Date", formatCropDate(src.harvestDate)],
    ["Available From", formatCropDate(src.availableFrom)],
    ["Available Until", formatCropDate(src.availableUntil)],
    ["Orders", String(item.count || 0)],
  ];
  const grades = STATEMENT_GRADES.map((label) => {
    const t = item.gradeTotals?.[label] || {};
    return {
      label,
      quantity: Number(t.qty) || 0,
      price: Number(t.rate) || 0,
      rejected: Number(t.rejected) || 0,
      unit,
    };
  });

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`${EXCEL_PANEL} cursor-pointer p-1.5 text-left hover:border-[#217346] hover:bg-[#F8FBF8] sm:p-2`}
    >
      <div className="flex items-start gap-1.5">
        <ProductPhoto src={item.photo} name={item.name} className="h-9 w-9 shrink-0 rounded-md sm:h-10 sm:w-10" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <p className="min-w-0 text-[12px] font-bold leading-tight text-[#1F2937] sm:text-[13px]">
              {item.name}
              {item.variety ? <span className="font-medium text-slate-500"> · {item.variety}</span> : null}
            </p>
            {src.stockStatus || src.status ? (
              <StatusBadge status={src.stockStatus || src.status} className="max-w-[40%] shrink-0 scale-90 origin-top-right" />
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[9px] leading-snug text-slate-500 sm:text-[10px]">
            {[src.cropName, src.farmName].filter(Boolean).join(" • ") || "Open earning statement"}
          </p>
        </div>
      </div>

      <div className="mt-1.5 grid grid-cols-5 gap-x-1.5 gap-y-1">
        {details.map(([label, value]) => (
          <DetailItem key={label} label={label} value={value} compact />
        ))}
      </div>

      <div className="mt-1.5 overflow-hidden rounded-md border border-[#9CA3AF]">
        <table className="w-full border-collapse text-[10px] sm:text-[11px]">
          <thead>
            <tr>
              <th className="border-b border-[#9CA3AF] bg-[#E8F0EA] px-1.5 py-1 text-left font-bold text-[#374151]">
                Grade
              </th>
              <th className="border-b border-l border-[#9CA3AF] bg-[#E8F0EA] px-1.5 py-1 text-center font-bold text-[#374151]">
                Qty
              </th>
              <th className="border-b border-l border-[#9CA3AF] bg-[#E8F0EA] px-1.5 py-1 text-center font-bold text-[#374151]">
                Rate
              </th>
              <th className={`border-b border-l border-[#9CA3AF] px-1.5 py-1 text-center font-bold ${REJECTED_TONE.head}`}>
                Rejected
              </th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade) => {
              const tone = gradeTone(grade.label);
              return (
                <tr key={grade.label}>
                  <td className={`border-t border-[#9CA3AF] px-1.5 py-1 font-bold ${tone.cell} ${tone.text}`}>
                    {grade.label}
                  </td>
                  <td className={`border-t border-l border-[#9CA3AF] px-1.5 py-1 text-center tabular-nums font-semibold text-[#1F2937] ${tone.cell}`}>
                    {Number(grade.quantity || 0).toLocaleString("en-IN")} {grade.unit}
                  </td>
                  <td className={`border-t border-l border-[#9CA3AF] px-1.5 py-1 text-center tabular-nums font-semibold text-[#1F2937] ${tone.cell}`}>
                    {formatProductPrice(grade.price, grade.unit)}
                  </td>
                  <td className={`border-t border-l border-[#9CA3AF] px-1.5 py-1 text-center tabular-nums font-semibold ${REJECTED_TONE.cell}`}>
                    {Number(grade.rejected || 0).toLocaleString("en-IN")} {grade.unit}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-1.5">
        <EarningsSummary compact total={money.total} deposited={money.deposited} balance={money.balance} />
      </div>
    </article>
  );
}

function EarningsSummary({ total, deposited, balance, compact = false }) {
  const items = [
    { label: compact ? "Total" : "Total Statement Earnings", short: "Total", value: formatCurrency(total), valueClass: "text-[#217346]" },
    { label: compact ? "Deposited 70%" : "Deposited (70%)", short: "70%", value: formatCurrency(deposited), valueClass: "text-[#065F46]" },
    { label: compact ? "Pending 30%" : "Pending Balance (30%)", short: "30%", value: formatCurrency(balance), valueClass: "text-amber-600" },
  ];
  return (
    <div className={`grid grid-cols-3 ${compact ? "gap-1" : "gap-2"}`}>
      {items.map((item) => (
        <div
          key={item.label}
          className={
            compact
              ? "rounded-md border border-slate-200/80 bg-[#F8FAF8] px-1 py-1.5 text-center"
              : "rounded-xl border border-slate-200/80 bg-white px-1.5 py-2 text-center shadow-sm sm:px-4 sm:py-4 sm:text-left"
          }
        >
          <p className={compact ? "text-[9px] font-medium leading-tight text-slate-500" : "text-[10px] font-medium leading-snug text-slate-500 sm:text-xs"}>
            {item.label}
          </p>
          <p className={`${compact ? "mt-0.5 text-[11px] sm:text-[12px]" : "mt-1 text-[15px] sm:mt-2 sm:text-2xl"} break-words font-bold leading-none tabular-nums ${item.valueClass}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function EarningsPage() {
  const navigate = useNavigate();
  const { productId: productIdParam } = useParams();
  const selectedProductId = productIdParam ? decodeURIComponent(productIdParam) : "";
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  usePolling(() => {
    Promise.all([getMyOrders().catch(() => []), getMyProducts().catch(() => [])])
      .then(([rows, prods]) => {
        setOrders(Array.isArray(rows) ? rows.filter(isStatementOrder) : []);
        const list = Array.isArray(prods) ? prods : prods?.products || [];
        setCatalog(Array.isArray(list) ? list : []);
      })
      .catch((err) => toast.error(err.message || "Failed to load earning statement"))
      .finally(() => setLoading(false));
  }, [], 8000);

  const products = useMemo(() => {
    const map = new Map();
    catalog.forEach((product) => {
      const id = catalogKey(product);
      map.set(id, {
        id,
        name: product.productName || product.name || "Product",
        variety: product.variety || "",
        photo: productPhoto(product),
        product,
        unit: product.unit || "Kg",
        count: 0,
        amount: 0,
        soldQty: 0,
        rejected: 0,
        gradeTotals: Object.fromEntries(STATEMENT_GRADES.map((g) => [g, { qty: 0, rate: 0, rejected: 0 }])),
      });
    });
    orders.forEach((order) => {
      const match = catalog.find((product) => orderMatchesProduct(order, product));
      const id = match
        ? catalogKey(match)
        : String(order.productId || `${order.productName || order.product || "Product"}::${order.variety || ""}`);
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: order.productName || order.product || "Product",
          variety: order.variety || "",
          photo: "",
          product: order,
          unit: order.unit || "Kg",
          count: 0,
          amount: 0,
          soldQty: 0,
          rejected: 0,
          gradeTotals: Object.fromEntries(STATEMENT_GRADES.map((g) => [g, { qty: 0, rate: 0, rejected: 0 }])),
        });
      }
      const row = map.get(id);
      const statementRows = gradeStatementRows(order);
      const totals = gradeStatementTotals(statementRows);
      row.count += 1;
      row.amount += orderAmount(order);
      row.soldQty += totals.finalQty;
      row.rejected += totals.rejected;
      statementRows.forEach((g) => {
        if (!row.gradeTotals[g.label]) row.gradeTotals[g.label] = { qty: 0, rate: 0, rejected: 0 };
        row.gradeTotals[g.label].qty += Number((g.finalQty ?? g.qty) || 0);
        row.gradeTotals[g.label].rejected += Number(g.rejected || 0);
        if (Number(g.rate) > 0) row.gradeTotals[g.label].rate = Number(g.rate);
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [catalog, orders]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;

  const visibleOrders = useMemo(() => {
    if (!selectedProduct) return [];
    return orders.filter((order) => {
      if (selectedProduct.product && orderMatchesProduct(order, selectedProduct.product)) return true;
      const fallback = String(order.productId || `${order.productName || order.product || "Product"}::${order.variety || ""}`);
      return fallback === selectedProduct.id;
    });
  }, [orders, selectedProduct]);

  const gradeColumns = useMemo(() => {
    const set = new Set(DEFAULT_GRADES);
    orders.forEach((o) => {
      Object.keys(gradeDetailMap(o)).forEach((label) => set.add(label));
    });
    const extras = Array.from(set).filter((g) => !DEFAULT_GRADES.includes(g)).sort();
    return [...DEFAULT_GRADES, ...extras];
  }, [orders]);

  const tableTotals = useMemo(() => {
    const grades = Object.fromEntries(gradeColumns.map((g) => [g, { qty: 0, rejected: 0 }]));
    let rejected = 0;
    let amount = 0;
    visibleOrders.forEach((order) => {
      const map = gradeDetailMap(order);
      gradeColumns.forEach((g) => {
        grades[g].qty += Number(map[g]?.qty || 0);
        grades[g].rejected += Number(map[g]?.rejected || 0);
      });
      rejected += rejectedTotal(order, map);
      amount += orderAmount(order);
    });
    return { grades, rejected, amount };
  }, [visibleOrders, gradeColumns]);

  const overallTotals = useMemo(() => {
    return Math.round(orders.reduce((sum, order) => sum + orderAmount(order), 0));
  }, [orders]);

  const listSplit = splitEarnings(selectedProduct ? tableTotals.amount : overallTotals);

  if (loading) return <LoadingState rows={6} />;

  return (
    <div className="space-y-3">
      <div className="shrink-0">
        {selectedProduct ? (
          <button
            type="button"
            onClick={() => navigate("/farmer/earnings")}
            className="mb-1 text-[12px] font-semibold text-[#217346]"
          >
            ← All Products
          </button>
        ) : null}
        <h1 className={EXCEL_PAGE_TITLE}>Earning Statement</h1>
        <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>
          {selectedProduct
            ? `${selectedProduct.name}${selectedProduct.variety ? ` · ${selectedProduct.variety}` : ""}`
            : "Select a product to view its earning statement"}
        </p>
      </div>

      <EarningsSummary total={listSplit.total} deposited={listSplit.deposited} balance={listSplit.balance} />

      {!selectedProduct ? (
        products.length === 0 ? (
          <EmptyState
            title="No products yet"
            description="Add a product first. After Quality and Grading Final Summary is confirmed, earnings will appear here."
          />
        ) : (
          <div className="grid gap-2 sm:gap-2.5 lg:grid-cols-2">
            {products.map((p) => (
              <ProductEarningsCard
                key={p.id}
                item={p}
                onOpen={() => navigate(`/farmer/earnings/product/${encodeURIComponent(p.id)}`)}
              />
            ))}
          </div>
        )
      ) : visibleOrders.length === 0 ? (
        <EmptyState
          title="No earning records yet"
          description="After Quality and Grading Final Summary is confirmed, that order will appear here."
        />
      ) : (
        <SpreadsheetViewport>
              <table className="w-max border-collapse text-[10px] md:w-full md:table-fixed md:text-[11px]">
                <colgroup>
                  <col className="w-[4%]" />
                  <col className="w-[16%]" />
                  <col className="w-[11%]" />
                  <col className="w-[11%]" />
                  <col className="w-[8%]" />
                  {gradeColumns.map((g) => (
                    <Fragment key={`col-${g}`}>
                      <col className="w-[6%]" />
                      <col className="w-[6%]" />
                    </Fragment>
                  ))}
                  <col className="w-[6%]" />
                  <col className="w-[9%]" />
                </colgroup>
                <thead className="sticky top-0 z-30">
                  <tr>
                    <th className={TH} rowSpan={2}>
                      #
                    </th>
                    <th className={TH} rowSpan={2}>
                      Product
                    </th>
                    <th className={TH} rowSpan={2}>
                      <HeadLabel line1="Order" line2="Date" />
                    </th>
                    <th className={TH} rowSpan={2}>
                      <HeadLabel line1="Pickup" line2="Date" />
                    </th>
                    <th className={TH} rowSpan={2}>
                      <HeadLabel line1="Pickup" line2="Time" />
                    </th>
                    {gradeColumns.map((g) => {
                      const tone = gradeTone(g);
                      return (
                        <th
                          key={g}
                          className={`border border-[#9CA3AF] px-0 py-0 text-center align-middle text-[10px] font-bold leading-tight md:py-1 md:text-[11px] ${tone.head}`}
                          colSpan={2}
                        >
                          {g}
                        </th>
                      );
                    })}
                    <th className={`border border-[#9CA3AF] px-0 py-0 text-center align-middle text-[10px] font-bold leading-tight md:py-1 md:text-[11px] ${REJECTED_TONE.head}`}>
                      Rejected
                    </th>
                    <th className={TH} rowSpan={2}>
                      Amount
                    </th>
                  </tr>
                  <tr>
                    {gradeColumns.map((g) => {
                      const tone = gradeTone(g);
                      const sub = `border border-[#9CA3AF] px-0 py-0 text-center align-middle text-[9px] font-semibold md:py-1 md:text-[10px] ${tone.head}`;
                      return (
                        <Fragment key={`h-${g}`}>
                          <th className={sub}>Qty</th>
                          <th className={sub}>Rate</th>
                        </Fragment>
                      );
                    })}
                    <th className={`border border-[#9CA3AF] px-0 py-0 text-center align-middle text-[9px] font-semibold md:py-1 md:text-[10px] ${REJECTED_TONE.head}`}>
                      Qty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order, idx) => {
                    const id = order.orderId || order.id;
                    const map = gradeDetailMap(order);
                    const unit = order.unit || "Kg";
                    const rejectedQty = rejectedTotal(order, map);
                    const amount = orderAmount(order);
                    const orderDate = order.orderDate || order.date || order.createdAt || order.requiredDate;
                    const pickupDate = order.pickupDate || order.pickup?.pickupDate;
                    const zebra = idx % 2 === 0 ? "bg-white group-hover:bg-[#E5E7EB]" : "bg-[#F3F4F6] group-hover:bg-[#E5E7EB]";
                    return (
                      <tr
                        key={id}
                        className="group cursor-pointer"
                        onClick={() => navigate(`/farmer/earnings/${id}`)}
                      >
                        <td className={`${TD} ${zebra} text-[#9CA3AF]`}>{idx + 1}</td>
                        <td className={`${TD} ${zebra}`}>
                          <span className="block break-words font-bold text-[#1F2937]">{order.productName || order.product || "Product"}</span>
                          {order.variety ? (
                            <span className="block break-words text-[9px] text-[#6B7280] md:text-[10px]">{order.variety}</span>
                          ) : null}
                        </td>
                        <td className={`${TD} ${zebra} whitespace-nowrap`}>
                          <DateWithDay value={orderDate} />
                        </td>
                        <td className={`${TD} ${zebra} whitespace-nowrap`}>
                          <DateWithDay value={pickupDate} />
                        </td>
                        <td className={`${TD} ${zebra} whitespace-nowrap`}>
                          {formatTime12h(order.pickupTime || order.pickup?.pickupTime)}
                        </td>
                        {gradeColumns.map((g) => {
                          const row = map[g] || { qty: 0, rate: 0, unit };
                          const cell = `overflow-hidden whitespace-nowrap border border-[#9CA3AF] px-0 py-0 text-center align-middle text-[10px] tabular-nums md:py-1 md:text-[11px] ${zebra}`;
                          return (
                            <Fragment key={`${id}-${g}`}>
                              <td className={cell}>{formatQty(row.qty, row.unit || unit)}</td>
                              <td className={cell}>{formatRate(row.rate, row.qty)}</td>
                            </Fragment>
                          );
                        })}
                        <td className={`overflow-hidden whitespace-nowrap border border-[#9CA3AF] px-0 py-0 text-center align-middle text-[10px] tabular-nums md:py-1 md:text-[11px] ${zebra}`}>
                          {formatQty(rejectedQty, unit, { danger: true })}
                        </td>
                        <td className={`${TD} ${zebra} whitespace-nowrap font-bold tabular-nums text-[#DC2626] md:text-[#217346]`}>
                          {amount > 0 ? formatMoney(amount) : <span className="font-semibold text-[#9CA3AF]">×</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      className={`${TH} bg-[#FCE7F3] text-left text-[12px] font-bold text-[#1F2937]`}
                      colSpan={5}
                    >
                      Total
                    </td>
                    {gradeColumns.map((g) => {
                      const tone = gradeTone(g);
                      const cell = `whitespace-nowrap border border-[#9CA3AF] px-0 py-0 text-center align-middle text-[10px] font-bold tabular-nums md:py-1 md:text-[12px] ${tone.head}`;
                      return (
                        <Fragment key={`total-${g}`}>
                          <td className={cell}>{formatQty(tableTotals.grades[g]?.qty, "Kg")}</td>
                          <td className={cell}>
                            <span className="font-semibold text-[#9CA3AF]">×</span>
                          </td>
                        </Fragment>
                      );
                    })}
                    <td className={`whitespace-nowrap border border-[#9CA3AF] px-0 py-0 text-center align-middle text-[10px] tabular-nums md:py-1 md:text-[12px] ${REJECTED_TONE.head}`}>
                      {formatQty(tableTotals.rejected, "Kg", { danger: true })}
                    </td>
                    <td className={`${TH} bg-[#FCE7F3] text-center font-bold tabular-nums text-[#DC2626] md:text-[12px] md:text-[#217346]`}>
                      {tableTotals.amount > 0 ? formatMoney(tableTotals.amount) : <span className="font-semibold text-[#9CA3AF]">×</span>}
                    </td>
                  </tr>
                </tfoot>
              </table>
        </SpreadsheetViewport>
      )}
    </div>
  );
}

export default EarningsPage;
