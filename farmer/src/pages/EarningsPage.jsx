import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  FileSpreadsheet,
  Download,
  Layers,
  Table,
  Check,
  Edit2,
  Copy,
  Sparkles,
  Calendar,
} from "lucide-react";
import { getMyOrders, getMyProducts } from "../api/farmerApi";
import { usePolling } from "../hooks/usePolling";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import SpreadsheetViewport from "../components/ui/SpreadsheetViewport";
import StatusBadge from "../components/ui/StatusBadge";
import CopyId from "../components/ui/CopyId";
import { canonicalOrderStatus } from "../utils/orderDisplay";
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

function isOrderDeleted(o) {
  if (!o) return true;
  if (o.isDeleted === true || o.deleted === true) return true;
  const s = String(o.status || "").trim().toUpperCase();
  return s === "DELETED" || s === "CANCELLED" || s === "CANCELED" || s === "DELETED_ORDER";
}

function isGradedOrder(order) {
  if (isOrderDeleted(order)) return false;
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

function formatQty(qty, _unit, { danger = false } = {}) {
  const n = Number(qty || 0);
  if (!(n > 0)) return <span className="font-semibold text-[#9CA3AF]">×</span>;
  return (
    <span className={`text-[12px] font-bold leading-tight tabular-nums ${danger ? "text-[#DC2626]" : "text-[#1F2937]"}`}>
      {n.toLocaleString("en-IN")}
    </span>
  );
}

function formatRate(rate, qty = 0) {
  if (!(Number(qty || 0) > 0)) return <span className="font-semibold text-[#9CA3AF]">×</span>;
  const n = Number(rate || 0);
  if (!(n > 0)) return <span className="font-semibold text-[#9CA3AF]">×</span>;
  return <span className="font-semibold tabular-nums text-[#1F2937]">{n.toLocaleString("en-IN")}</span>;
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

function getOrderTimestamp(order) {
  if (!order) return 0;
  const raw = order.createdAt || order.orderDate || order.date || order.requiredDate;
  if (!raw) return 0;
  const d = new Date(raw);
  const time = d.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function isOrderInSheet(order, sheet) {
  if (!sheet) return true;
  if (sheet.filterMode === "all" || !sheet.sinceTimestamp) {
    return true;
  }
  if (sheet.filterMode === "new_only") {
    const oTime = getOrderTimestamp(order);
    return oTime >= sheet.sinceTimestamp;
  }
  return true;
}

const WORKBOOK_STORAGE_KEY = "farmer_earnings_workbook_sheets_v2";

function loadSavedSheets() {
  try {
    const saved = localStorage.getItem(WORKBOOK_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (_e) {}
  return null;
}

function saveSheetsToStorage(sheetsList) {
  try {
    localStorage.setItem(WORKBOOK_STORAGE_KEY, JSON.stringify(sheetsList));
  } catch (_e) {}
}

function isOrderPaid(order) {
  const s = String(order?.paymentStatus || "").toUpperCase().trim();
  return s === "PAID" || s === "PAYMENT_COMPLETED" || s === "COMPLETED" || s === "PAYMENT RECEIVED";
}

function computeEarningsFromOrders(ordersList = []) {
  let total = 0;
  let deposited = 0;
  let pending = 0;

  ordersList.forEach((order) => {
    const amt = orderAmount(order);
    total += amt;
    if (isOrderPaid(order)) {
      deposited += amt;
    } else {
      pending += amt;
    }
  });

  return {
    total: Math.round(total),
    deposited: Math.round(deposited),
    balance: Math.round(pending),
  };
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

function ProductEarningsCard({ item, onOpen, onCreateNewSheet, openCount = 0 }) {
  const src = item.product || {};
  const unit = src.unit || item.unit || "Kg";
  const money = {
    total: Math.round(item.amount || 0),
    deposited: Math.round(item.deposited || 0),
    balance: Math.round(item.pending != null ? item.pending : ((item.amount || 0) - (item.deposited || 0))),
  };
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
      className={`${EXCEL_PANEL} p-2 text-left hover:border-[#217346] hover:bg-[#F8FBF8] transition-all hover:shadow-md flex flex-col justify-between`}
    >
      <div>
        <div className="flex items-start gap-1.5">
          <ProductPhoto src={item.photo} name={item.name} className="h-9 w-9 shrink-0 rounded-md sm:h-10 sm:w-10" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-1">
              <p className="min-w-0 text-[12px] font-bold leading-tight text-[#1F2937] sm:text-[13px]">
                {item.name}
                {item.variety ? <span className="font-medium text-slate-500"> · {item.variety}</span> : null}
              </p>
              <div className="flex items-center gap-1 shrink-0">
                {openCount > 0 && (
                  <span className="rounded bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800">
                    📄 {openCount} Sheet{openCount === 1 ? "" : "s"}
                  </span>
                )}
                {src.stockStatus || src.status ? (
                  <StatusBadge status={src.stockStatus || src.status} className="scale-90 origin-top-right" />
                ) : null}
              </div>
            </div>
            <p className="mt-0.5 truncate text-[9px] leading-snug text-slate-500 sm:text-[10px]">
              {[src.cropName, src.farmName].filter(Boolean).join(" • ") || "Earning statement produce"}
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
      </div>

      {/* Action Footer Buttons */}
      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-200/80 pt-2">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1 rounded-lg border border-[#217346] bg-emerald-50/50 hover:bg-emerald-100 text-[#217346] px-2.5 py-1 text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <Table className="h-3.5 w-3.5" />
          <span>{openCount > 0 ? "View Sheet" : "Open Sheet"}</span>
        </button>

        <button
          type="button"
          onClick={onCreateNewSheet}
          className="inline-flex items-center gap-1 rounded-lg bg-[#217346] hover:bg-[#1B5E39] text-white px-2.5 py-1 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
          title={openCount > 0 ? `Create an additional sheet for ${item.name} (Sheet ${openCount + 1})` : "Create new sheet"}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{openCount > 0 ? `+ Sheet ${openCount + 1}` : "+ New Sheet"}</span>
        </button>
      </div>
    </article>
  );
}

function EarningsSummary({ total, deposited, balance, compact = false }) {
  const rows = [
    { label: "Total", value: Number(total || 0).toLocaleString("en-IN"), tone: "bg-[#ECFDF5] text-[#217346]" },
    { label: "Deposited", value: Number(deposited || 0).toLocaleString("en-IN"), tone: "bg-[#F0FDF4] text-[#065F46]" },
    { label: "Pending", value: Number(balance || 0).toLocaleString("en-IN"), tone: "bg-[#FFFBEB] text-[#B45309]" },
  ];

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {rows.map((item) => (
          <div key={item.label} className="rounded-md border border-slate-200/80 bg-[#F8FAF8] px-1 py-1.5 text-center">
            <p className="text-[9px] font-medium leading-tight text-slate-500">{item.label}</p>
            <p className={`mt-0.5 text-[11px] break-words font-bold leading-none tabular-nums sm:text-[12px] ${item.tone.split(" ").pop()}`}>
              ₹{item.value}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-[#9CA3AF] bg-white shadow-sm rounded-lg">
      <table className="w-full border-collapse text-[11px] sm:text-[12px]">
        <thead>
          <tr>
            {rows.map((row) => (
              <th
                key={`h-${row.label}`}
                className="border border-[#9CA3AF] bg-[#E8F0EA] px-2 py-1.5 text-center font-bold text-[#374151] sm:px-3 sm:py-2"
              >
                {row.label} <span className="font-semibold text-[#6B7280]">₹</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {rows.map((row) => (
              <td
                key={row.label}
                className={`border border-[#9CA3AF] px-2 py-2 text-center font-bold tabular-nums sm:px-3 sm:py-2.5 sm:text-[14px] ${row.tone}`}
              >
                ₹{row.value}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** Excel-Like New Sheet Selection Modal */
function NewSheetModal({
  isOpen,
  onClose,
  products,
  sheets,
  onCreateProductSheet,
  onSelectSheet,
  onOpenAllSheets,
}) {
  const [search, setSearch] = useState("");
  const [customSheetName, setCustomSheetName] = useState("");
  const [selectedProductForCustom, setSelectedProductForCustom] = useState("");
  const [startFresh, setStartFresh] = useState(true);

  if (!isOpen) return null;

  const filtered = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.variety && p.variety.toLowerCase().includes(q)) ||
      (p.product?.farmName && p.product.farmName.toLowerCase().includes(q))
    );
  });

  const selectedProductObj = products.find((p) => p.id === selectedProductForCustom);
  const selectedProductOpenCount = selectedProductForCustom
    ? sheets.filter((s) => s.productId === selectedProductForCustom).length
    : 0;

  const handleCreateCustom = (e) => {
    e.preventDefault();
    if (!selectedProductForCustom) {
      toast.error("Please select a product for the new sheet");
      return;
    }
    onCreateProductSheet(selectedProductForCustom, customSheetName, {
      filterMode: startFresh ? "new_only" : "all",
    });
    setCustomSheetName("");
    setSelectedProductForCustom("");
    onClose();
  };

  const quickTitleSuggestions = selectedProductObj
    ? [
        `Sheet ${selectedProductOpenCount + 1}`,
        `${selectedProductObj.name} - Batch 1`,
        `${selectedProductObj.name} - Batch 2`,
        `${selectedProductObj.name} - Grade A High`,
        `${selectedProductObj.name} - Log`,
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-sm">
                📑
              </span>
              <h2 className="text-base font-bold text-[#1F2937]">Add / Create New Sheet</h2>
            </div>
            <p className="text-xs text-[#6B7280] mt-1">
              Create a fresh sheet tab for any crop or produce — previous orders are excluded so you can record only new incoming orders.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Custom Named Sheet Section */}
        <form onSubmit={handleCreateCustom} className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
              <span>Create Custom Named Sheet for Any Product</span>
            </div>
            {selectedProductOpenCount > 0 && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                {selectedProductOpenCount} Sheet{selectedProductOpenCount === 1 ? "" : "s"} Already Open
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={selectedProductForCustom}
              onChange={(e) => {
                setSelectedProductForCustom(e.target.value);
                if (e.target.value) {
                  const p = products.find((x) => x.id === e.target.value);
                  const count = sheets.filter((s) => s.productId === e.target.value).length;
                  if (count > 0 && p) {
                    setCustomSheetName(`${p.name} (Sheet ${count + 1})`);
                  } else if (p) {
                    setCustomSheetName(`${p.name}${p.variety ? ` (${p.variety})` : ""}`);
                  }
                }
              }}
              className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-medium focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">-- Select Product / Crop --</option>
              {products.map((p) => {
                const count = sheets.filter((s) => s.productId === p.id).length;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.variety ? `(${p.variety})` : ""} {count > 0 ? `[${count} open]` : ""}
                  </option>
                );
              })}
            </select>

            <input
              type="text"
              placeholder="Sheet Title (e.g. Tomato - Sept Batch)"
              value={customSheetName}
              onChange={(e) => setCustomSheetName(e.target.value)}
              className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-medium focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {quickTitleSuggestions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-semibold text-emerald-800">Quick Titles:</span>
              {quickTitleSuggestions.map((title) => (
                <button
                  type="button"
                  key={title}
                  onClick={() => setCustomSheetName(title)}
                  className="rounded-full bg-white border border-emerald-300 px-2 py-0.5 text-[10px] font-semibold text-emerald-900 hover:bg-emerald-100 hover:border-emerald-500 transition-colors cursor-pointer"
                >
                  {title}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-950 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={startFresh}
                onChange={(e) => setStartFresh(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Start Fresh (Exclude previous orders · Only record new orders)</span>
            </label>

            <button
              type="submit"
              disabled={!selectedProductForCustom}
              className="inline-flex items-center gap-1 bg-[#217346] hover:bg-[#1B5E39] disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Sheet {customSheetName ? `"${customSheetName}"` : ""}</span>
            </button>
          </div>
        </form>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search crop, variety, or farm to open a sheet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#D1D5DB] bg-[#F9FAFB] pl-9 pr-3 py-2 text-xs focus:border-[#217346] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#217346]/20 transition-all font-medium"
          />
        </div>

        {/* Product Selection List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9CA3AF]">
              No matching products found.
            </div>
          ) : (
            filtered.map((p) => {
              const openSheets = sheets.filter((s) => s.productId === p.id);
              const openCount = openSheets.length;
              return (
                <div
                  key={p.id}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left transition-all hover:border-[#217346] hover:bg-[#F2F8F3] hover:shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ProductPhoto src={p.photo} name={p.name} className="h-10 w-10 shrink-0 rounded-lg shadow-2xs" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-bold text-[#1F2937] truncate">{p.name}</p>
                        {p.variety ? (
                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-700 border border-slate-200">
                            {p.variety}
                          </span>
                        ) : null}
                        {openCount > 0 && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 border border-emerald-300">
                            📄 {openCount} Sheet{openCount === 1 ? "" : "s"} Created
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#6B7280] truncate mt-0.5">
                        {[p.product?.cropName, p.product?.farmName, p.product?.farmLocation].filter(Boolean).join(" · ") || "Product"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-semibold">
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          {p.count} Orders
                        </span>
                        <span className="text-slate-600">
                          Earnings: ₹{Number(p.amount || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    {openCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSheet(openSheets[0].sheetId);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                        title="Switch to existing sheet tab"
                      >
                        <Table className="h-3 w-3" />
                        <span>View</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onCreateProductSheet(p.id);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 bg-[#217346] hover:bg-[#1B5E39] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                      title={openCount > 0 ? `Create an additional new sheet for ${p.name} (Sheet ${openCount + 1})` : "Create new sheet"}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{openCount > 0 ? `+ Sheet ${openCount + 1}` : "+ New Sheet"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              onOpenAllSheets();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#217346] hover:text-[#1B5E39] hover:underline cursor-pointer"
          >
            <Layers className="h-3.5 w-3.5" /> Open All Products as Sheets
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-bold text-[#374151] hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/** Excel-Like Sheet Tab Bar with In-Place Renaming and Duplication */
function ExcelSheetTabBar({
  sheets,
  activeSheetId,
  onSelectSheet,
  onAddSheet,
  onCloseSheet,
  onRenameSheet,
  onDuplicateSheet,
}) {
  const scrollRef = useRef(null);
  const [editingSheetId, setEditingSheetId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -160, behavior: "smooth" });
  };

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 160, behavior: "smooth" });
  };

  const handleStartRename = (s) => {
    if (!s.isClosable) return;
    setEditingSheetId(s.sheetId);
    setEditingTitle(s.title);
  };

  const handleFinishRename = () => {
    if (editingSheetId && editingTitle.trim()) {
      onRenameSheet(editingSheetId, editingTitle.trim());
    }
    setEditingSheetId(null);
  };

  return (
    <div className="flex items-center justify-between rounded-t-xl border border-b-0 border-[#BACCC0] bg-[#E8F0EA] px-2 pt-2 shadow-2xs">
      <div className="flex items-center gap-1 min-w-0 flex-1">
        {/* Navigation scroll arrows */}
        <div className="flex items-center gap-0.5 shrink-0 pr-1 border-r border-[#C2D6C6]">
          <button
            type="button"
            onClick={scrollLeft}
            className="rounded p-1 text-[#374151] hover:bg-[#D3E4D6] hover:text-black transition-colors"
            title="Scroll tabs left"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={scrollRight}
            className="rounded p-1 text-[#374151] hover:bg-[#D3E4D6] hover:text-black transition-colors"
            title="Scroll tabs right"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Scrollable Tabs Area */}
        <div ref={scrollRef} className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 min-w-0">
          {sheets.map((s) => {
            const isActive = s.sheetId === activeSheetId;
            const isEditing = editingSheetId === s.sheetId;

            return (
              <div
                key={s.sheetId}
                onClick={() => onSelectSheet(s.sheetId)}
                onDoubleClick={() => handleStartRename(s)}
                className={`group relative flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs font-semibold select-none cursor-pointer transition-all shrink-0 ${
                  isActive
                    ? "bg-white text-[#217346] font-bold border-t-2 border-x border-b-0 border-[#217346] shadow-xs z-10 -mb-px"
                    : "bg-[#D8E6DB] text-[#374151] hover:bg-[#E3EEE6] hover:text-[#1F2937] border-t border-x border-[#BACCC0]"
                }`}
                title={`${s.title} (Double-click to rename)`}
              >
                <span className="text-[13px] shrink-0">{s.icon || "📄"}</span>

                {isEditing ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={handleFinishRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFinishRename();
                      if (e.key === "Escape") setEditingSheetId(null);
                    }}
                    autoFocus
                    className="w-28 rounded border border-emerald-500 bg-white px-1 py-0.5 text-xs text-black font-bold focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">{s.title}</span>
                )}

                {s.badge != null && !isEditing && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9px] font-mono font-bold ${
                      isActive ? "bg-emerald-100 text-emerald-800" : "bg-[#C5D8C9] text-[#374151]"
                    }`}
                  >
                    {s.badge}
                  </span>
                )}

                {/* Edit rename icon on active tab */}
                {isActive && s.isClosable && !isEditing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(s);
                    }}
                    className="rounded-full p-0.5 text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0 ml-0.5 opacity-60 hover:opacity-100"
                    title="Rename Sheet"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                )}

                {/* Duplicate Sheet button */}
                {isActive && s.isClosable && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSheet(s.sheetId);
                    }}
                    className="rounded-full p-0.5 text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0 ml-0.5 opacity-60 hover:opacity-100"
                    title="Duplicate Sheet"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                )}

                {/* Close tab button */}
                {s.isClosable && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseSheet(s.sheetId);
                    }}
                    className="rounded-full p-0.5 text-slate-400 hover:bg-red-100 hover:text-red-700 transition-colors shrink-0 ml-0.5"
                    title="Close sheet"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add New Sheet Button (+ New Sheet) */}
        <button
          type="button"
          onClick={onAddSheet}
          className="inline-flex items-center gap-1 bg-[#217346] hover:bg-[#1B5E39] text-white px-2.5 py-1.5 rounded-t-lg text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 ml-1 border-t border-x border-[#1B5E39]"
          title="Open a new product earning sheet (or create multiple sheets)"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Sheet</span>
        </button>
      </div>
    </div>
  );
}

function EarningsPage() {
  const navigate = useNavigate();
  const { productId: productIdParam } = useParams();
  const urlProductId = productIdParam ? decodeURIComponent(productIdParam) : "";
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Multi-Sheet Workbook State
  const [sheets, setSheets] = useState([
    {
      sheetId: "overview",
      productId: null,
      title: "Summary Overview",
      icon: "📊",
      isClosable: false,
    },
  ]);
  const [activeSheetId, setActiveSheetId] = useState("overview");
  const [isNewSheetModalOpen, setIsNewSheetModalOpen] = useState(false);

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
        deposited: 0,
        pending: 0,
        soldQty: 0,
        rejected: 0,
        gradeTotals: Object.fromEntries(STATEMENT_GRADES.map((g) => [g, { qty: 0, rate: 0, rejected: 0 }])),
      });
    });
    orders.forEach((order) => {
      if (isOrderDeleted(order)) return;
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
          deposited: 0,
          pending: 0,
          soldQty: 0,
          rejected: 0,
          gradeTotals: Object.fromEntries(STATEMENT_GRADES.map((g) => [g, { qty: 0, rate: 0, rejected: 0 }])),
        });
      }
      const row = map.get(id);
      const statementRows = gradeStatementRows(order);
      const totals = gradeStatementTotals(statementRows);
      const amt = orderAmount(order);
      row.count += 1;
      row.amount += amt;
      if (isOrderPaid(order)) {
        row.deposited += amt;
      } else {
        row.pending += amt;
      }
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

  // Initialize sheets from catalog products or URL on first load
  useEffect(() => {
    if (products.length > 0) {
      setSheets((prev) => {
        const saved = loadSavedSheets();
        if (saved && saved.length > 0) {
          if (urlProductId) {
            const match = saved.find((s) => s.productId === urlProductId);
            if (match) setActiveSheetId(match.sheetId);
          }
          return saved;
        }

        if (prev.length <= 1) {
          const prodSheets = products.map((p, idx) => ({
            sheetId: `sheet-${p.id}-${idx + 1}`,
            productId: p.id,
            title: `${p.name}${p.variety ? ` (${p.variety})` : ""}`,
            icon: "📄",
            isClosable: true,
            createdAt: 0,
            filterMode: "all",
            sinceTimestamp: null,
          }));

          const initial = [
            prev[0] || { sheetId: "overview", productId: null, title: "Summary Overview", icon: "📊", isClosable: false },
            ...prodSheets,
          ];

          if (urlProductId) {
            const match = initial.find((s) => s.productId === urlProductId);
            if (match) setActiveSheetId(match.sheetId);
          }

          saveSheetsToStorage(initial);
          return initial;
        }
        return prev;
      });
    }
  }, [products, urlProductId]);

  const handleSelectSheet = (sheetId) => {
    setActiveSheetId(sheetId);
    const s = sheets.find((item) => item.sheetId === sheetId);
    if (!s || s.sheetId === "overview" || !s.productId) {
      navigate("/farmer/earnings", { replace: true });
    } else {
      navigate(`/farmer/earnings/product/${encodeURIComponent(s.productId)}`, { replace: true });
    }
  };

  const handleCreateProductSheet = (productId, customTitle = "", options = {}) => {
    const p = products.find((item) => item.id === productId);
    if (!p) return;

    // Count how many sheets currently exist for this same product
    const existingCount = sheets.filter((s) => s.productId === productId).length;
    const isAdditional = existingCount > 0;
    const defaultTitle =
      existingCount === 0
        ? `${p.name}${p.variety ? ` (${p.variety})` : ""}`
        : `${p.name} (Sheet ${existingCount + 1})`;

    const sheetTitle = customTitle.trim() || defaultTitle;
    const now = Date.now();
    // For any newly created additional sheet, exclude previous orders by default so it starts fresh!
    const filterMode = options.filterMode || (isAdditional ? "new_only" : "all");
    const sinceTimestamp = filterMode === "new_only" ? (options.sinceTimestamp || now) : null;

    const newSheet = {
      sheetId: `sheet-${productId}-${now}`,
      productId: productId,
      title: sheetTitle,
      icon: "📄",
      isClosable: true,
      createdAt: now,
      filterMode: filterMode,
      sinceTimestamp: sinceTimestamp,
    };

    setSheets((prev) => {
      const updated = [...prev, newSheet];
      saveSheetsToStorage(updated);
      return updated;
    });
    setActiveSheetId(newSheet.sheetId);
    navigate(`/farmer/earnings/product/${encodeURIComponent(productId)}`, { replace: true });
    toast.success(
      filterMode === "new_only"
        ? `Created fresh sheet: ${sheetTitle} (Previous orders excluded)`
        : `Created new sheet: ${sheetTitle}`
    );
  };

  const handleOpenAllSheets = () => {
    const newSheets = products.map((p, idx) => ({
      sheetId: `sheet-${p.id}-${Date.now()}-${idx}`,
      productId: p.id,
      title: `${p.name}${p.variety ? ` (${p.variety})` : ""}`,
      icon: "📄",
      isClosable: true,
      createdAt: 0,
      filterMode: "all",
      sinceTimestamp: null,
    }));

    setSheets((prev) => {
      const updated = [
        prev.find((s) => s.sheetId === "overview") || {
          sheetId: "overview",
          productId: null,
          title: "Summary Overview",
          icon: "📊",
          isClosable: false,
        },
        ...newSheets,
      ];
      saveSheetsToStorage(updated);
      return updated;
    });

    if (newSheets.length > 0) {
      handleSelectSheet(newSheets[0].sheetId);
    }
    toast.success("Opened all product sheets");
  };

  const handleCloseSheet = (sheetId) => {
    const nextSheets = sheets.filter((s) => s.sheetId !== sheetId);
    setSheets(nextSheets);
    saveSheetsToStorage(nextSheets);
    if (activeSheetId === sheetId) {
      const fallback = nextSheets.length > 0 ? nextSheets[nextSheets.length - 1].sheetId : "overview";
      handleSelectSheet(fallback);
    }
    toast.success("Sheet closed");
  };

  const handleRenameSheet = (sheetId, newTitle) => {
    setSheets((prev) => {
      const updated = prev.map((s) => (s.sheetId === sheetId ? { ...s, title: newTitle } : s));
      saveSheetsToStorage(updated);
      return updated;
    });
    toast.success(`Sheet renamed to: ${newTitle}`);
  };

  const handleDuplicateSheet = (sheetId) => {
    const target = sheets.find((s) => s.sheetId === sheetId);
    if (!target) return;
    const now = Date.now();
    const copyTitle = `${target.title} (Copy)`;
    const newSheet = {
      sheetId: `sheet-${target.productId || "sheet"}-${now}`,
      productId: target.productId,
      title: copyTitle,
      icon: target.icon || "📄",
      isClosable: true,
      createdAt: now,
      filterMode: "new_only",
      sinceTimestamp: now,
    };
    setSheets((prev) => {
      const updated = [...prev, newSheet];
      saveSheetsToStorage(updated);
      return updated;
    });
    setActiveSheetId(newSheet.sheetId);
    toast.success(`Duplicated fresh sheet: ${copyTitle} (Previous orders excluded)`);
  };

  const handleToggleSheetFilter = (sheetId, newFilterMode) => {
    setSheets((prev) => {
      const updated = prev.map((s) => {
        if (s.sheetId !== sheetId) return s;
        return {
          ...s,
          filterMode: newFilterMode,
          sinceTimestamp: newFilterMode === "new_only" ? (s.sinceTimestamp || s.createdAt || Date.now()) : null,
        };
      });
      saveSheetsToStorage(updated);
      return updated;
    });
    toast.success(newFilterMode === "new_only" ? "Filtered to new orders only" : "Showing all orders in this sheet");
  };

  // Find active sheet and selected product
  const activeSheet = sheets.find((s) => s.sheetId === activeSheetId) || sheets[0] || {
    sheetId: "overview",
    productId: null,
    title: "Summary Overview",
  };

  const selectedProduct = activeSheet.productId
    ? products.find((p) => p.id === activeSheet.productId) || null
    : null;

  const visibleOrders = useMemo(() => {
    if (!selectedProduct) return [];
    return orders.filter((order) => {
      if (isOrderDeleted(order)) return false;
      const matches =
        (selectedProduct.product && orderMatchesProduct(order, selectedProduct.product)) ||
        String(order.productId || `${order.productName || order.product || "Product"}::${order.variety || ""}`) === selectedProduct.id;
      if (!matches) return false;
      return isOrderInSheet(order, activeSheet);
    });
  }, [orders, selectedProduct, activeSheet]);

  // Add badge counts to sheets for tab rendering (filtered by each sheet's specific rules)
  const workbookSheetsWithBadges = useMemo(() => {
    return sheets.map((s) => {
      if (s.sheetId === "overview") {
        return { ...s, badge: products.length };
      }
      const prod = products.find((p) => p.id === s.productId);
      if (!prod) return { ...s, badge: 0 };
      const count = orders.filter((order) => {
        if (isOrderDeleted(order)) return false;
        const matches =
          (prod.product && orderMatchesProduct(order, prod.product)) ||
          String(order.productId || `${order.productName || order.product || "Product"}::${order.variety || ""}`) === prod.id;
        if (!matches) return false;
        return isOrderInSheet(order, s);
      }).length;
      return { ...s, badge: count };
    });
  }, [sheets, products, orders]);

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

  const listSplit = computeEarningsFromOrders(selectedProduct ? visibleOrders : orders);
  const sheetUnit = selectedProduct?.unit || visibleOrders[0]?.unit || "Kg";

  // CSV Export for active product sheet
  const handleExportCSV = () => {
    if (!selectedProduct || visibleOrders.length === 0) {
      toast.error("No data to export on this sheet");
      return;
    }

    const headers = [
      "#",
      "Order Date",
      "Pickup Date",
      "Pickup Time",
      ...gradeColumns.flatMap((g) => [`${g} Qty (${sheetUnit})`, `${g} Rate (Rs)`]),
      `Rejected Qty (${sheetUnit})`,
      "Amount (Rs)",
      "Payment Status",
    ];

    const rows = visibleOrders.map((order, idx) => {
      const map = gradeDetailMap(order);
      const orderDate = shortDate(order.orderDate || order.date || order.createdAt);
      const pickupDate = shortDate(order.pickupDate || order.pickup?.pickupDate);
      const pickupTime = formatTime12h(order.pickupTime || order.pickup?.pickupTime);
      const rej = rejectedTotal(order, map);
      const amt = orderAmount(order);
      const pay = order.paymentStatus || "Pending";

      const gradeCells = gradeColumns.flatMap((g) => {
        const r = map[g] || { qty: 0, rate: 0 };
        return [r.qty || 0, r.rate || 0];
      });

      return [idx + 1, orderDate, pickupDate, pickupTime, ...gradeCells, rej, amt, pay];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Earning_Sheet_${activeSheet.title.replace(/\s+/g, "_")}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sheet exported to CSV successfully");
  };

  if (loading) return <LoadingState rows={6} />;

  return (
    <div className="space-y-3 font-sans">
      {/* 1. Header with Actions */}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-sm">
              📗
            </span>
            <h1 className={`${EXCEL_PAGE_TITLE} !text-lg sm:!text-xl`}>Earning Statement</h1>
          </div>
          <p className={`${EXCEL_PAGE_SUB} mt-0.5`}>
            Excel Workbook · {sheets.length - 1} Sheet{sheets.length === 2 ? "" : "s"} Created
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedProduct && (
            <>
              <button
                type="button"
                onClick={() => handleDuplicateSheet(activeSheetId)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-[#374151] hover:bg-slate-50 transition-all shadow-2xs"
                title="Duplicate this sheet"
              >
                <Copy className="h-3.5 w-3.5 text-slate-600" /> Duplicate Sheet
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-[#374151] hover:bg-slate-50 transition-all shadow-2xs"
              >
                <Download className="h-3.5 w-3.5 text-slate-600" /> Export Sheet (CSV)
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsNewSheetModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#217346] hover:bg-[#1B5E39] text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New Sheet
          </button>
        </div>
      </div>

      {/* 2. Top Financial Summary */}
      <EarningsSummary total={listSplit.total} deposited={listSplit.deposited} balance={listSplit.balance} />

      {/* 3. Excel Sheet Tab Bar (Workbook Navigation) */}
      <ExcelSheetTabBar
        sheets={workbookSheetsWithBadges}
        activeSheetId={activeSheetId}
        onSelectSheet={handleSelectSheet}
        onAddSheet={() => setIsNewSheetModalOpen(true)}
        onCloseSheet={handleCloseSheet}
        onRenameSheet={handleRenameSheet}
        onDuplicateSheet={handleDuplicateSheet}
      />

      {/* 4. Active Sheet Content */}
      <div className={`rounded-b-xl border border-t-0 border-[#BACCC0] bg-white shadow-xs ${activeSheetId === "overview" ? "p-3" : "p-0"}`}>
        {activeSheetId === "overview" ? (
          /* ========================================================= */
          /* SUMMARY OVERVIEW SHEET VIEW                                */
          /* ========================================================= */
          products.length === 0 ? (
            <EmptyState
              title="No products yet"
              description="Add a product first. After Quality and Grading Final Summary is confirmed, earnings will appear here."
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Table className="h-4 w-4 text-emerald-700" />
                  <span className="text-xs font-bold text-[#1F2937]">All Products Earning Overview</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewSheetModalOpen(true)}
                  className="text-xs font-bold text-[#217346] hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> + New Sheet Tab
                </button>
              </div>

              <div className="grid gap-2 sm:gap-2.5 lg:grid-cols-2">
                {products.map((p) => {
                  const openSheets = sheets.filter((s) => s.productId === p.id);
                  return (
                    <ProductEarningsCard
                      key={p.id}
                      item={p}
                      openCount={openSheets.length}
                      onOpen={() => {
                        if (openSheets.length > 0) {
                          handleSelectSheet(openSheets[0].sheetId);
                        } else {
                          handleCreateProductSheet(p.id);
                        }
                      }}
                      onCreateNewSheet={() => handleCreateProductSheet(p.id)}
                    />
                  );
                })}
              </div>
            </div>
          )
        ) : !selectedProduct ? (
          <div className="p-4">
            <EmptyState
              title="Sheet not found"
              description="The selected product sheet could not be loaded."
            />
          </div>
        ) : visibleOrders.length === 0 ? (
          /* ========================================================= */
          /* EMPTY SHEET VIEW                                          */
          /* ========================================================= */
          activeSheet.filterMode === "new_only" ? (
            <div className="py-10 px-4 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 text-2xl shadow-xs">
                ✨
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1F2937]">
                  Fresh Sheet: {activeSheet.title}
                </h3>
                <p className="mt-1 text-xs text-[#6B7280] max-w-md mx-auto">
                  This new sheet is created fresh and ready to record new incoming harvest orders for <strong>{selectedProduct.name}</strong>. Previous orders are safely preserved in your primary sheet tab.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                {sheets.find((s) => s.productId === selectedProduct.id && s.sheetId !== activeSheet.sheetId) && (
                  <button
                    type="button"
                    onClick={() => {
                      const primary = sheets.find((s) => s.productId === selectedProduct.id && s.sheetId !== activeSheet.sheetId);
                      if (primary) handleSelectSheet(primary.sheetId);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <Table className="h-3.5 w-3.5" /> View Previous Orders
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleToggleSheetFilter(activeSheet.sheetId, "all")}
                  className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  Include Previous Orders in this Sheet
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 px-4">
              <EmptyState
                title={`No earning records for ${activeSheet.title}`}
                description="After Quality and Grading Final Summary is confirmed for this product, records will appear in this sheet."
              />
            </div>
          )
        ) : (
          /* ========================================================= */
          /* PRODUCT SPREADSHEET TABLE SHEET VIEW                      */
          /* ========================================================= */
          <SpreadsheetViewport className="overflow-hidden bg-white">
            <table className="w-max min-w-[760px] border-collapse text-[10px] md:w-full md:min-w-0 md:table-fixed md:text-[11px]">
                <colgroup>
                  <col className="w-[4%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[7%]" />
                  {gradeColumns.map((g) => (
                    <Fragment key={`col-${g}`}>
                      <col className="w-[9%]" />
                      <col className="w-[8%]" />
                    </Fragment>
                  ))}
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                </colgroup>
                <thead className="sticky top-0 z-30">
                  <tr>
                    <th className={TH} rowSpan={2}>
                      #
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
                          className={`border border-[#9CA3AF] px-1 py-1 text-center align-middle text-[11px] font-bold leading-tight md:px-2 md:py-1.5 md:text-[12px] ${tone.head}`}
                          colSpan={2}
                        >
                          {g}
                        </th>
                      );
                    })}
                    <th className={`border border-[#9CA3AF] px-1 py-1 text-center align-middle text-[11px] font-bold leading-tight md:px-2 md:py-1.5 md:text-[12px] ${REJECTED_TONE.head}`}>
                      Rejected
                    </th>
                    <th className={TH} rowSpan={2}>
                      <HeadLabel line1="Amount" line2="₹" />
                    </th>
                    <th className={TH} rowSpan={2}>
                      <HeadLabel line1="Payment" line2="Status" />
                    </th>
                  </tr>
                  <tr>
                    {gradeColumns.map((g) => {
                      const tone = gradeTone(g);
                      const sub = `border border-[#9CA3AF] px-1 py-1 text-center align-middle text-[10px] font-semibold md:px-2 md:py-1.5 md:text-[11px] ${tone.head}`;
                      return (
                        <Fragment key={`h-${g}`}>
                          <th className={sub}>
                            <HeadLabel line1="Qty" line2={sheetUnit} />
                          </th>
                          <th className={sub}>
                            <HeadLabel line1="Rate" line2="₹" />
                          </th>
                        </Fragment>
                      );
                    })}
                    <th className={`border border-[#9CA3AF] px-1 py-1 text-center align-middle text-[10px] font-semibold md:px-2 md:py-1.5 md:text-[11px] ${REJECTED_TONE.head}`}>
                      <HeadLabel line1="Qty" line2={sheetUnit} />
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
                        className="group cursor-pointer hover:bg-[#F2F8F3] transition-colors"
                        onClick={() => navigate(`/farmer/earnings/${id}`)}
                        title="Click to view full earning receipt"
                      >
                        <td className={`${TD} ${zebra} text-[#9CA3AF]`}>{idx + 1}</td>
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
                          const cell = `overflow-hidden whitespace-nowrap border border-[#9CA3AF] px-1 py-1 text-center align-middle text-[11px] tabular-nums md:px-2 md:py-1.5 md:text-[12px] ${zebra}`;
                          return (
                            <Fragment key={`${id}-${g}`}>
                              <td className={cell}>{formatQty(row.qty, row.unit || unit)}</td>
                              <td className={cell}>{formatRate(row.rate, row.qty)}</td>
                            </Fragment>
                          );
                        })}
                        <td className={`overflow-hidden whitespace-nowrap border border-[#9CA3AF] px-1 py-1 text-center align-middle text-[11px] tabular-nums md:px-2 md:py-1.5 md:text-[12px] ${zebra}`}>
                          {formatQty(rejectedQty, unit, { danger: true })}
                        </td>
                        <td className={`${TD} ${zebra} whitespace-nowrap font-bold tabular-nums text-[#DC2626] md:text-[#217346]`}>
                          {amount > 0 ? (
                            <span>{Number(amount).toLocaleString("en-IN")}</span>
                          ) : (
                            <span className="font-semibold text-[#9CA3AF]">×</span>
                          )}
                        </td>
                        <td className={`${TD} ${zebra} whitespace-nowrap px-1 py-0.5`}>
                          <StatusBadge status={order.paymentStatus || "Pending"} className="scale-90" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      className={`${TH} bg-[#FCE7F3] text-left text-[12px] font-bold text-[#1F2937] px-2`}
                      colSpan={4}
                    >
                      Total
                    </td>
                    {gradeColumns.map((g) => {
                      const tone = gradeTone(g);
                      const cell = `whitespace-nowrap border border-[#9CA3AF] px-1 py-1 text-center align-middle text-[11px] font-bold tabular-nums md:px-2 md:py-1.5 md:text-[13px] ${tone.head}`;
                      return (
                        <Fragment key={`total-${g}`}>
                          <td className={cell}>{formatQty(tableTotals.grades[g]?.qty, "Kg")}</td>
                          <td className={cell}>
                            <span className="font-semibold text-[#9CA3AF]">×</span>
                          </td>
                        </Fragment>
                      );
                    })}
                    <td className={`whitespace-nowrap border border-[#9CA3AF] px-1 py-1 text-center align-middle text-[11px] tabular-nums md:px-2 md:py-1.5 md:text-[13px] ${REJECTED_TONE.head}`}>
                      {formatQty(tableTotals.rejected, "Kg", { danger: true })}
                    </td>
                    <td className={`${TH} bg-[#FCE7F3] text-center font-bold tabular-nums text-[#DC2626] md:text-[13px] md:text-[#217346]`}>
                      {tableTotals.amount > 0 ? (
                        <span>{Number(tableTotals.amount).toLocaleString("en-IN")}</span>
                      ) : (
                        <span className="font-semibold text-[#9CA3AF]">×</span>
                      )}
                    </td>
                    <td className={`${TH} bg-[#FCE7F3] text-center text-[10px] font-semibold text-[#6B7280]`}>
                      —
                    </td>
                  </tr>
                </tfoot>
              </table>
            </SpreadsheetViewport>
        )}
      </div>

      {/* 5. New Sheet Selector Modal */}
      <NewSheetModal
        isOpen={isNewSheetModalOpen}
        onClose={() => setIsNewSheetModalOpen(false)}
        products={products}
        sheets={sheets}
        onCreateProductSheet={handleCreateProductSheet}
        onSelectSheet={handleSelectSheet}
        onOpenAllSheets={handleOpenAllSheets}
      />
    </div>
  );
}

export default EarningsPage;
