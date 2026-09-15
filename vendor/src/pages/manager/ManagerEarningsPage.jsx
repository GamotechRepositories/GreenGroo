import { Fragment, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getManagerAllHarvestOrders,
  getManagerAllProducts,
  getManagerFarmers,
} from "../../api/managerPortApi";
import { vendorApi } from "../../api/vendorApi";
import { usePolling } from "../../hooks/usePolling";
import LoadingState from "../../components/ui/LoadingState";
import EmptyState from "../../components/ui/EmptyState";
import SpreadsheetViewport from "../../components/ui/SpreadsheetViewport";
import StatusBadge from "../../components/ui/StatusBadge";
import CopyId, { CopyButton, CopyIcon, CheckIcon, copyText } from "../../components/ui/CopyId";
import { canonicalOrderStatus } from "../../utils/orderDisplay";
import {
  STATEMENT_GRADES,
  gradeStatementMap,
  gradeStatementRows,
  gradeStatementTotals,
} from "../../utils/gradeStatement";
import { formatCropDate, formatProductBusinessId } from "../../utils/cropLinks";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
} from "../../utils/excelStyles";

const BASE = "/vendor/earnings";
const ORDER_DETAIL = "/vendor/orders/detail";
const DEFAULT_GRADES = STATEMENT_GRADES;

const TH =
  "border border-[#9CA3AF] bg-[#E8F0EA] px-0 py-0 text-center align-middle text-[10px] font-bold leading-tight text-[#374151] md:py-1 md:text-[11px]";
const TD =
  "overflow-hidden border border-[#9CA3AF] px-0 py-0 text-center align-middle text-[10px] leading-tight text-[#1F2937] md:py-1 md:text-[11px]";

const PAY_TH =
  "border border-[#9CA3AF] bg-[#E8F0EA] px-0.5 py-1 text-center align-middle text-[10px] font-bold leading-tight text-[#374151] sm:px-1.5 sm:py-2 sm:text-xs md:text-[13px]";
const PAY_TD =
  "overflow-hidden border border-[#9CA3AF] px-0.5 py-1 text-center align-middle text-[10px] leading-tight text-[#1F2937] sm:px-1.5 sm:py-2 sm:text-xs md:text-sm";

function formatOrderId3Lines(id = "") {
  const str = String(id || "").trim();
  if (!str) return ["—"];

  if (str.includes("-")) {
    const parts = str.split("-").filter(Boolean);
    if (parts.length === 4 && parts[0].toUpperCase() === "GGC" && parts[1].toUpperCase() === "ORD") {
      return [`${parts[0]}-${parts[1]}`, parts[2], parts[3]];
    }
    if (parts.length === 3) {
      return parts;
    }
    if (parts.length === 2) {
      const p2 = parts[1];
      const mid = Math.ceil(p2.length / 2);
      return [parts[0], p2.slice(0, mid), p2.slice(mid)].filter(Boolean);
    }
    if (parts.length >= 4) {
      const first = parts.slice(0, 2).join("-");
      const last = parts[parts.length - 1];
      const middle = parts.slice(2, -1).join("-");
      return [first, middle, last].filter(Boolean);
    }
  }

  if (str.length > 8) {
    const chunkLen = Math.ceil(str.length / 3);
    return [
      str.slice(0, chunkLen),
      str.slice(chunkLen, chunkLen * 2),
      str.slice(chunkLen * 2),
    ].filter(Boolean);
  }

  return [str];
}

function formatFarmerId2Lines(id = "") {
  const str = String(id || "").trim();
  if (!str) return ["—"];

  if (str.includes("-")) {
    const parts = str.split("-").filter(Boolean);
    if (parts.length <= 2) {
      return parts;
    }
    const midIndex = Math.ceil(parts.length / 2);
    const line1 = parts.slice(0, midIndex).join("-");
    const line2 = parts.slice(midIndex).join("-");
    return [line1, line2];
  }

  if (str.length > 8) {
    const mid = Math.ceil(str.length / 2);
    return [str.slice(0, mid), str.slice(mid)].filter(Boolean);
  }

  return [str];
}

function OrderIdCell({ id }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await copyText(id);
      setCopied(true);
      toast.success("Order ID copied");
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Order ID copied!" : "Click to copy Order ID"}
      className="group/oid inline-flex items-center justify-center gap-1 px-1.5 py-1 rounded bg-emerald-50/70 hover:bg-emerald-100/90 active:bg-emerald-200 transition-colors border border-emerald-200/60 max-w-full"
    >
      <span className="font-mono text-[11px] font-bold text-emerald-900 tracking-tight truncate">
        {id}
      </span>
      {copied ? (
        <CheckIcon className="h-3.5 w-3.5 text-[#217346] shrink-0" />
      ) : (
        <CopyIcon className="h-3 w-3 text-emerald-700/80 group-hover/oid:text-emerald-900 shrink-0" />
      )}
    </button>
  );
}

function FarmerIdTag({ id }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await copyText(id);
      setCopied(true);
      toast.success("Farmer ID copied");
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Farmer ID copied!" : "Click to copy Farmer ID"}
      className="group/fid inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-slate-50 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-900 border border-slate-200/80 hover:border-emerald-300 transition-colors text-left max-w-full"
    >
      <span className="font-mono text-[10px] font-semibold tracking-tight truncate">
        {id}
      </span>
      {copied ? (
        <CheckIcon className="h-3 w-3 text-[#217346] shrink-0 ml-0.5" />
      ) : (
        <CopyIcon className="h-2.5 w-2.5 text-emerald-600/70 group-hover/fid:text-emerald-900 shrink-0 ml-0.5" />
      )}
    </button>
  );
}

function ManagerIdTag({ id }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await copyText(id);
      setCopied(true);
      toast.success("Manager ID copied");
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Manager ID copied!" : "Click to copy Manager ID"}
      className="group/mid inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 transition-colors text-left max-w-full"
    >
      <span className="font-mono text-[10px] text-gray-500 font-medium tracking-tight truncate">
        {id}
      </span>
      {copied ? (
        <CheckIcon className="h-3 w-3 text-[#217346] shrink-0 ml-0.5" />
      ) : (
        <CopyIcon className="h-2.5 w-2.5 text-gray-400 group-hover/mid:text-gray-700 shrink-0 ml-0.5" />
      )}
    </button>
  );
}

function PaymentStatusText({ status }) {
  const s = String(status || "").trim().toUpperCase();
  if (
    s === "PAID" ||
    s === "PAYMENT_COMPLETED" ||
    s === "PAYMENT COMPLETED" ||
    s === "COMPLETED" ||
    s === "PAYMENT RECEIVED" ||
    s === "PAID_ONLINE" ||
    s === "PAID ONLINE" ||
    s === "PAID_10" ||
    s === "SETTLED" ||
    s.startsWith("PAID") ||
    s.includes("PAYMENT COMPLETED") ||
    s.includes("PAYMENT_COMPLETED")
  ) {
    return <span className="font-extrabold text-[#15803D] text-[10.5px] sm:text-xs md:text-[13px] tracking-tight block">Paid</span>;
  }
  if (s === "PENDING" || s === "PAYMENT_PENDING" || s === "SUBMITTED" || s === "UNPAID" || !s) {
    return <span className="font-extrabold text-[#D97706] text-[10.5px] sm:text-xs md:text-[13px] tracking-tight block">Pending</span>;
  }
  if (s === "FAILED" || s === "REJECTED" || s === "CANCELLED") {
    return <span className="font-extrabold text-[#DC2626] text-[10.5px] sm:text-xs md:text-[13px] tracking-tight block">{status}</span>;
  }
  return <span className="font-bold text-gray-700 text-[10.5px] sm:text-xs md:text-[13px] block">{status}</span>;
}

function PaymentMobileCard({ row, onClick, idx }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5 space-y-3 cursor-pointer active:scale-[0.99] transition-all hover:border-emerald-500 hover:shadow-md relative overflow-hidden"
    >
      {/* Top Header: # Index + Order ID (Copy) + Status */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 shrink-0">
            {idx + 1}
          </span>
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-mono text-xs font-bold text-emerald-800 tracking-tight truncate" title={row.id}>
              {row.id}
            </span>
            <CopyButton value={row.id} label="Copy Order ID" className="h-5 w-5 text-emerald-700 hover:bg-emerald-50" />
          </div>
        </div>
        <div className="shrink-0">
          <PaymentStatusText status={row.paymentStatus} />
        </div>
      </div>

      {/* Body: Farmer Details (Left) + Crop & Produce (Right) */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Farmer Details</p>
          <p className="font-extrabold text-slate-900 text-[13px] leading-tight truncate">{row.farmerName || "—"}</p>
          {(row.farmerCode || row.farmerId) && (
            <div className="flex items-center gap-1 pt-0.5">
              <span className="font-mono text-[11px] font-semibold text-emerald-700 truncate">
                {row.farmerCode || row.farmerId}
              </span>
              <CopyButton value={row.farmerCode || row.farmerId} label="Copy Farmer ID" className="h-4 w-4 text-emerald-600" />
            </div>
          )}
        </div>

        <div className="space-y-0.5 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Crop / Produce</p>
          <p className="font-extrabold text-slate-900 text-[13px] leading-tight truncate">{row.productName || "—"}</p>
          {row.variety ? (
            <div className="pt-0.5">
              <span className="inline-block rounded-md bg-emerald-50 px-1.5 py-0.2 text-[10.5px] font-bold text-emerald-800 border border-emerald-200/60">
                {row.variety}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Collection Centre / Manager Row */}
      {(row.managerName || row.collectionCentre || row.managerId) ? (
        <div className="pt-2 text-xs border-t border-slate-100 flex items-center justify-between text-slate-600">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Manager & Centre</span>
            <span className="font-bold text-slate-800 text-[12px] truncate">{row.managerName || "—"}</span>
          </div>
          <div className="text-right flex flex-col items-end min-w-0">
            {row.collectionCentre ? (
              <span className="font-semibold text-emerald-800 text-[11px] truncate max-w-[170px]">
                📍 {row.collectionCentre}
              </span>
            ) : null}
            {row.managerId ? (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]">{row.managerId}</span>
                <CopyButton value={row.managerId} label="Copy Manager ID" className="h-3.5 w-3.5 text-slate-400" />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Bottom Bar: Pickup Date/Time (Left) + Payable Amount (Right) */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs bg-slate-50/70 -mx-3.5 -mb-3.5 px-3.5 py-2.5 rounded-b-xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Pickup Date & Time</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-bold text-slate-800 text-[11.5px]">{shortDate(row.pickupDate || row.orderDate)}</span>
            {weekdayName(row.pickupDate || row.orderDate) ? (
              <span className="text-[10.5px] text-slate-600 font-semibold">({weekdayName(row.pickupDate || row.orderDate)})</span>
            ) : null}
            {row.pickupTime ? (
              <span className="text-[10.5px] font-semibold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {formatTime12h(row.pickupTime)}
              </span>
            ) : null}
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Payable Amount</span>
          <span className="text-base font-black text-[#15803D] tabular-nums leading-tight">
            ₹{Number(row.amount || 0).toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  );
}

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
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.slice(0, 10).split("-").map(Number);
    const local = new Date(y, m - 1, d);
    return Number.isNaN(local.getTime()) ? null : local;
  }
  const dmyMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const d = Number(dmyMatch[1]);
    const m = Number(dmyMatch[2]);
    const y = Number(dmyMatch[3]);
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

function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function matchPaymentDateFilter(dateVal, dateFilter, customFrom = "", customTo = "") {
  if (!dateFilter || dateFilter === "all") return true;
  const d = parseDate(dateVal);
  if (!d) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dateFilter === "today") {
    return isSameDay(d, today);
  }

  if (dateFilter === "yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return isSameDay(d, yesterday);
  }

  if (dateFilter === "this_week") {
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return d >= startOfWeek && d <= endOfWeek;
  }

  if (dateFilter === "last_week") {
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1) - 7;
    const startOfLastWeek = new Date(today);
    startOfLastWeek.setDate(diff);
    startOfLastWeek.setHours(0, 0, 0, 0);

    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
    endOfLastWeek.setHours(23, 59, 59, 999);

    return d >= startOfLastWeek && d <= endOfLastWeek;
  }

  if (dateFilter === "this_month") {
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
  }

  if (dateFilter === "custom") {
    const from = customFrom ? parseDate(customFrom) : null;
    const to = customTo ? parseDate(customTo) : null;
    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(23, 59, 59, 999);

    if (from && to) return d >= from && d <= to;
    if (from) return d >= from;
    if (to) return d <= to;
    return true;
  }

  return true;
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

function isOrderPaid(order) {
  if (!order) return false;
  const candidates = [
    order.paymentStatus,
    order.payment_status,
    order.paymentDetails?.paymentStatus,
    order.paymentDetails?.status,
    order.payment?.status,
    order.payment?.paymentStatus,
    order.earningStatus,
    order.earningsStatus,
    order.settlementStatus,
  ].filter(Boolean);

  return candidates.some((val) => {
    const s = String(val).toUpperCase().trim();
    return (
      s === "PAID" ||
      s === "PAYMENT_COMPLETED" ||
      s === "PAYMENT COMPLETED" ||
      s === "COMPLETED" ||
      s === "PAYMENT RECEIVED" ||
      s === "PAID_ONLINE" ||
      s === "PAID ONLINE" ||
      s === "PAID_10" ||
      s === "SETTLED" ||
      s.startsWith("PAID") ||
      s.includes("PAYMENT COMPLETED") ||
      s.includes("PAYMENT_COMPLETED")
    );
  });
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

function ProductEarningsCard({ item, onOpen }) {
  const src = item.product || {};
  const unit = src.unit || item.unit || "Kg";
  const money = {
    total: Math.round(item.amount || 0),
    deposited: Math.round(item.deposited || 0),
    balance: Math.round(item.pending != null ? item.pending : ((item.amount || 0) - (item.deposited || 0))),
  };
  const productId = formatProductBusinessId(src);
  const details = [
    ["Crop", src.cropName || "—"],
    ["Variety", src.variety || item.variety || "—"],
    ["Farm", src.farmName || "—"],
    ["Location", src.farmLocation || "—"],
    ["Harvest", formatCropDate(src.harvestDate) || "—"],
    ["From", formatCropDate(src.availableFrom) || "—"],
    ["Until", formatCropDate(src.availableUntil) || "—"],
    ["Orders", String(item.count || 0)],
  ];
  const grades = STATEMENT_GRADES.map((label) => {
    const t = item.gradeTotals?.[label] || {};
    return {
      label: label.replace("Grade ", ""),
      quantity: Number(t.qty) || 0,
      price: Number(t.rate) || 0,
      rejected: Number(t.rejected) || 0,
      unit,
      fullLabel: label,
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
      className={`${EXCEL_PANEL} cursor-pointer overflow-hidden p-1.5 text-left hover:border-[#217346] hover:bg-[#F8FBF8]`}
    >
      <div className="flex items-start gap-1.5">
        <ProductPhoto src={item.photo} name={item.name} className="h-8 w-8 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="min-w-0 flex-1 truncate text-[11px] font-bold leading-tight text-[#1F2937]">
              {item.name}
              {item.variety ? <span className="font-medium text-slate-500"> · {item.variety}</span> : null}
            </p>
            {src.stockStatus || src.status ? (
              <span className="shrink-0 rounded px-1 py-0.5 text-[8px] font-semibold uppercase text-[#217346] bg-emerald-50">
                {String(src.stockStatus || src.status).slice(0, 3)}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[9px] text-slate-500">
            {[src.cropName, src.farmName].filter(Boolean).join(" · ") || "Open statement"}
          </p>
          {productId ? (
            <div className="mt-0.5 flex min-w-0 items-center gap-0.5">
              <p className="min-w-0 truncate font-mono text-[8px] leading-tight text-emerald-700" title={productId}>
                {shortId(productId, 20)}
              </p>
              <CopyButton value={productId} label="Copy Product ID" />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-1.5 grid grid-cols-3 gap-x-1 gap-y-1">
        {details.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <p className="text-[7px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="truncate text-[9px] font-semibold leading-tight text-[#1F2937]" title={String(value || "")}>
              {value || "—"}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-1.5 overflow-hidden rounded border border-[#9CA3AF]">
        <table className="w-full border-collapse text-[9px]">
          <thead>
            <tr>
              <th className="border-b border-[#9CA3AF] bg-[#E8F0EA] px-1 py-0.5 text-left font-bold text-[#374151]">G</th>
              <th className="border-b border-l border-[#9CA3AF] bg-[#E8F0EA] px-1 py-0.5 text-center font-bold text-[#374151]">Qty</th>
              <th className="border-b border-l border-[#9CA3AF] bg-[#E8F0EA] px-1 py-0.5 text-center font-bold text-[#374151]">Rate</th>
              <th className={`border-b border-l border-[#9CA3AF] px-1 py-0.5 text-center font-bold ${REJECTED_TONE.head}`}>Rej</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade) => {
              const tone = gradeTone(grade.fullLabel);
              return (
                <tr key={grade.fullLabel}>
                  <td className={`border-t border-[#9CA3AF] px-1 py-0.5 font-bold ${tone.cell} ${tone.text}`}>{grade.label}</td>
                  <td className={`border-t border-l border-[#9CA3AF] px-1 py-0.5 text-center tabular-nums font-semibold ${tone.cell}`}>
                    {Number(grade.quantity || 0).toLocaleString("en-IN")}
                  </td>
                  <td className={`border-t border-l border-[#9CA3AF] px-1 py-0.5 text-center tabular-nums font-semibold ${tone.cell}`}>
                    {Number(grade.price || 0) > 0 ? Number(grade.price).toLocaleString("en-IN") : "×"}
                  </td>
                  <td className={`border-t border-l border-[#9CA3AF] px-1 py-0.5 text-center tabular-nums font-semibold ${REJECTED_TONE.cell}`}>
                    {Number(grade.rejected || 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-1 grid grid-cols-3 gap-0.5 text-center">
        <div className="rounded border border-slate-200/80 bg-[#F8FAF8] px-0.5 py-1">
          <p className="text-[7px] text-slate-500">Total</p>
          <p className="truncate text-[9px] font-bold tabular-nums text-[#217346]">₹{money.total.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded border border-slate-200/80 bg-[#F8FAF8] px-0.5 py-1">
          <p className="text-[7px] text-slate-500">Dep</p>
          <p className="truncate text-[9px] font-bold tabular-nums text-[#065F46]">₹{money.deposited.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded border border-slate-200/80 bg-[#F8FAF8] px-0.5 py-1">
          <p className="text-[7px] text-slate-500">Pend</p>
          <p className="truncate text-[9px] font-bold tabular-nums text-[#B45309]">₹{money.balance.toLocaleString("en-IN")}</p>
        </div>
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
    <div className="overflow-hidden border border-[#9CA3AF] bg-white shadow-sm">
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

function unwrapOrders(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;
  return [];
}

function unwrapProducts(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  return [];
}

function unwrapFarmers(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.farmers)) return data.farmers;
  return [];
}

function farmerKey(farmer) {
  return String(farmer?.id || farmer?.farmerId || farmer?._id || "").trim();
}

function orderFarmerId(order) {
  return String(order?.farmerId || order?.farmer_id || "").trim();
}

function productFarmerId(product) {
  return String(product?.farmerId || product?.farmer_id || "").trim();
}

function orderMatchesFarmer(order, farmerId, farmerName = "") {
  if (!farmerId) return false;
  const oid = orderFarmerId(order);
  if (oid && oid === farmerId) return true;
  if (farmerName) {
    const oname = String(order?.farmerName || "").trim().toLowerCase();
    if (oname && oname === farmerName.trim().toLowerCase()) return true;
  }
  return false;
}

function shortId(value = "", keep = 14) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.length <= keep) return text;
  return `…${text.slice(-keep)}`;
}

function FarmerEarningsCard({ item, onOpen }) {
  const money = {
    total: Math.round(item.amount || 0),
    deposited: Math.round(item.deposited || 0),
    balance: Math.round(item.pending != null ? item.pending : ((item.amount || 0) - (item.deposited || 0))),
  };
  const managerLabel =
    item.managerName && item.managerName !== "—" ? item.managerName : "Unassigned";

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
      className={`${EXCEL_PANEL} cursor-pointer overflow-hidden p-1.5 text-left hover:border-[#217346] hover:bg-[#F8FBF8]`}
    >
      <div className="flex items-start gap-1.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-[#E8F5E9] text-[10px] font-bold text-[#217346]">
          {item.initials || String(item.name || "F").charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="min-w-0 flex-1 truncate text-[11px] font-bold leading-tight text-[#1F2937]">
              {item.name || "Farmer"}
            </p>
            {item.status ? (
              <span className="shrink-0 rounded px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-[#217346] bg-emerald-50">
                {String(item.status).slice(0, 3)}
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 flex min-w-0 items-center gap-0.5">
            <p className="min-w-0 truncate font-mono text-[8px] leading-tight text-emerald-700" title={item.code || item.id}>
              {shortId(item.code || item.id, 16)}
            </p>
            <CopyButton value={item.code || item.id} label="Copy Farmer ID" />
          </div>
          <p className="mt-0.5 truncate text-[9px] font-semibold leading-tight text-[#217346]" title={managerLabel}>
            Mgr: {managerLabel}
          </p>
          {item.managerId ? (
            <div className="flex min-w-0 items-center gap-0.5">
              <p className="min-w-0 truncate font-mono text-[8px] leading-tight text-emerald-700" title={item.managerId}>
                {shortId(item.managerId, 18)}
              </p>
              <CopyButton value={item.managerId} label="Copy Manager ID" />
            </div>
          ) : null}
          <p className="mt-0.5 truncate text-[9px] leading-tight text-[#6B7280]">
            {[item.mobile, item.farmName].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
      </div>

      <div className="mt-1.5 grid grid-cols-3 gap-0.5 text-center">
        <div className="rounded bg-slate-50 px-0.5 py-1">
          <p className="text-[7px] uppercase tracking-wide text-[#6B7280]">Prod</p>
          <p className="text-[10px] font-bold leading-none text-slate-900">{item.productCount || 0}</p>
        </div>
        <div className="rounded bg-slate-50 px-0.5 py-1">
          <p className="text-[7px] uppercase tracking-wide text-[#6B7280]">Ord</p>
          <p className="text-[10px] font-bold leading-none text-slate-900">{item.orderCount || 0}</p>
        </div>
        <div className="rounded bg-slate-50 px-0.5 py-1">
          <p className="text-[7px] uppercase tracking-wide text-[#6B7280]">Earn</p>
          <p className="truncate text-[9px] font-bold leading-none text-[#217346]">
            ₹{Number(item.amount || 0).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="mt-1 grid grid-cols-3 gap-0.5 text-center">
        <div className="rounded border border-slate-200/80 bg-[#F8FAF8] px-0.5 py-1">
          <p className="text-[7px] text-slate-500">Total</p>
          <p className="truncate text-[9px] font-bold tabular-nums text-[#217346]">₹{money.total.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded border border-slate-200/80 bg-[#F8FAF8] px-0.5 py-1">
          <p className="text-[7px] text-slate-500">Dep</p>
          <p className="truncate text-[9px] font-bold tabular-nums text-[#065F46]">₹{money.deposited.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded border border-slate-200/80 bg-[#F8FAF8] px-0.5 py-1">
          <p className="text-[7px] text-slate-500">Pend</p>
          <p className="truncate text-[9px] font-bold tabular-nums text-[#B45309]">₹{money.balance.toLocaleString("en-IN")}</p>
        </div>
      </div>
    </article>
  );
}

export default function ManagerEarningsPage({ defaultTab }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isPaymentsPath = location.pathname.endsWith("/payments");
  const tabQuery = searchParams.get("tab");
  const mainTab = isPaymentsPath || defaultTab === "payments" || tabQuery === "payments" ? "payments" : "statements";

  const { farmerId: farmerIdParam, productId: productIdParam } = useParams();
  const selectedFarmerId = farmerIdParam ? decodeURIComponent(farmerIdParam) : "";
  const selectedProductId = productIdParam ? decodeURIComponent(productIdParam) : "";
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // All Payments Tab Filters
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentDateFilter, setPaymentDateFilter] = useState("all");
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [paymentFarmerFilter, setPaymentFarmerFilter] = useState("all");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentStatus: "Paid",
    paymentMethod: "Bank Transfer",
    transactionId: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const setMainTab = (tab) => {
    if (tab === "payments") {
      navigate("/vendor/earnings/payments");
    } else {
      navigate("/vendor/earnings");
    }
  };

  usePolling(() => {
    Promise.all([
      getManagerAllHarvestOrders().catch(() => ({ orders: [] })),
      getManagerAllProducts().catch(() => ({ products: [] })),
      getManagerFarmers().catch(() => []),
    ])
      .then(([harvest, prods, farmerList]) => {
        setOrders(unwrapOrders(harvest).filter(isStatementOrder));
        setCatalog(unwrapProducts(prods));
        setFarmers(unwrapFarmers(farmerList));
      })
      .catch((err) => toast.error(err.message || "Failed to load earning statement"))
      .finally(() => setLoading(false));
  }, [], 8000);

  const farmerRows = useMemo(() => {
    const map = new Map();
    farmers.forEach((farmer) => {
      const id = farmerKey(farmer);
      if (!id) return;
      map.set(id, {
        id,
        name: farmer.name || "Farmer",
        initials: farmer.initials || "",
        code: farmer.farmerCode || farmer.farmerId || id,
        mobile: farmer.mobile || "",
        farmName: farmer.farmName || "",
        farmLocation: farmer.farmLocation || "",
        status: farmer.status || "",
        managerId: farmer.managerId || "",
        managerName: farmer.managerName || "",
        productCount: 0,
        orderCount: 0,
        amount: 0,
        deposited: 0,
        pending: 0,
        productIds: new Set(),
      });
    });

    catalog.forEach((product) => {
      const fid = productFarmerId(product);
      if (!fid) return;
      if (!map.has(fid)) {
        map.set(fid, {
          id: fid,
          name: product.farmerName || "Farmer",
          initials: "",
          code: fid,
          mobile: "",
          farmName: product.farmName || "",
          farmLocation: product.farmLocation || "",
          status: "",
          managerId: product.managerId || "",
          managerName: product.managerName || "",
          productCount: 0,
          orderCount: 0,
          amount: 0,
          deposited: 0,
          pending: 0,
          productIds: new Set(),
        });
      } else {
        const row = map.get(fid);
        if (!row.managerName && product.managerName) row.managerName = product.managerName;
        if (!row.managerId && product.managerId) row.managerId = product.managerId;
      }
      const row = map.get(fid);
      const pid = catalogKey(product);
      if (!row.productIds.has(pid)) {
        row.productIds.add(pid);
        row.productCount += 1;
      }
    });

    orders.forEach((order) => {
      const fid = orderFarmerId(order);
      if (!fid) return;
      if (!map.has(fid)) {
        map.set(fid, {
          id: fid,
          name: order.farmerName || "Farmer",
          initials: "",
          code: fid,
          mobile: order.farmerMobile || "",
          farmName: order.farmName || "",
          farmLocation: order.farmLocation || "",
          status: "",
          managerId: order.managerId || "",
          managerName: order.managerName || "",
          productCount: 0,
          orderCount: 0,
          amount: 0,
          deposited: 0,
          pending: 0,
          productIds: new Set(),
        });
      } else {
        const row = map.get(fid);
        if (!row.managerName && order.managerName) row.managerName = order.managerName;
        if (!row.managerId && order.managerId) row.managerId = order.managerId;
      }
      const row = map.get(fid);
      const amt = orderAmount(order);
      row.orderCount += 1;
      row.amount += amt;
      if (isOrderPaid(order)) {
        row.deposited += amt;
      } else {
        row.pending += amt;
      }
      const pid = String(order.productId || `${order.productName || order.product || "Product"}::${order.variety || ""}`);
      if (pid && !row.productIds.has(pid)) {
        row.productIds.add(pid);
        row.productCount += 1;
      }
    });

    return Array.from(map.values())
      .map(({ productIds, ...rest }) => rest)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [farmers, catalog, orders]);

  const selectedFarmer = farmerRows.find((f) => f.id === selectedFarmerId) || null;

  const farmerCatalog = useMemo(() => {
    if (!selectedFarmerId) return [];
    return catalog.filter((product) => productFarmerId(product) === selectedFarmerId);
  }, [catalog, selectedFarmerId]);

  const farmerOrders = useMemo(() => {
    if (!selectedFarmerId) return [];
    return orders.filter((order) =>
      orderMatchesFarmer(order, selectedFarmerId, selectedFarmer?.name || "")
    );
  }, [orders, selectedFarmerId, selectedFarmer]);

  const products = useMemo(() => {
    const map = new Map();
    farmerCatalog.forEach((product) => {
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
    farmerOrders.forEach((order) => {
      const match = farmerCatalog.find((product) => orderMatchesProduct(order, product));
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
  }, [farmerCatalog, farmerOrders]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;

  const needle = search.trim().toLowerCase();

  const filteredFarmerRows = useMemo(() => {
    if (!needle) return farmerRows;
    return farmerRows.filter((f) =>
      [
        f.name,
        f.mobile,
        f.code,
        f.id,
        f.managerName,
        f.managerId,
        f.farmName,
        f.farmLocation,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle))
    );
  }, [farmerRows, needle]);

  const filteredProducts = useMemo(() => {
    if (!needle) return products;
    return products.filter((p) =>
      [
        p.name,
        p.variety,
        p.id,
        p.product?.productId,
        p.product?.cropName,
        p.product?.farmName,
        formatProductBusinessId(p.product || {}),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle))
    );
  }, [products, needle]);

  const visibleOrders = useMemo(() => {
    if (!selectedProduct) return [];
    return farmerOrders.filter((order) => {
      if (selectedProduct.product && orderMatchesProduct(order, selectedProduct.product)) return true;
      const fallback = String(order.productId || `${order.productName || order.product || "Product"}::${order.variety || ""}`);
      return fallback === selectedProduct.id;
    });
  }, [farmerOrders, selectedProduct]);

  const filteredVisibleOrders = useMemo(() => {
    if (!needle) return visibleOrders;
    return visibleOrders.filter((order) => {
      const id = order.orderId || order.id || "";
      const orderDate = order.orderDate || order.date || order.createdAt || order.requiredDate || "";
      const pickupDate = order.pickupDate || order.pickup?.pickupDate || "";
      const pickupTime = order.pickupTime || order.pickup?.pickupTime || "";
      const amount = String(orderAmount(order) || "");
      return [
        id,
        orderDate,
        pickupDate,
        pickupTime,
        amount,
        order.productName,
        order.variety,
        shortDate(orderDate),
        shortDate(pickupDate),
        formatTime12h(pickupTime),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [visibleOrders, needle]);

  const gradeColumns = useMemo(() => {
    const set = new Set(DEFAULT_GRADES);
    farmerOrders.forEach((o) => {
      Object.keys(gradeDetailMap(o)).forEach((label) => set.add(label));
    });
    const extras = Array.from(set).filter((g) => !DEFAULT_GRADES.includes(g)).sort();
    return [...DEFAULT_GRADES, ...extras];
  }, [farmerOrders]);

  const tableTotals = useMemo(() => {
    const grades = Object.fromEntries(gradeColumns.map((g) => [g, { qty: 0, rejected: 0 }]));
    let rejected = 0;
    let amount = 0;
    filteredVisibleOrders.forEach((order) => {
      const map = gradeDetailMap(order);
      gradeColumns.forEach((g) => {
        grades[g].qty += Number(map[g]?.qty || 0);
        grades[g].rejected += Number(map[g]?.rejected || 0);
      });
      rejected += rejectedTotal(order, map);
      amount += orderAmount(order);
    });
    return { grades, rejected, amount };
  }, [filteredVisibleOrders, gradeColumns]);

  const overallTotals = useMemo(() => {
    if (selectedFarmerId) {
      return Math.round(farmerOrders.reduce((sum, order) => sum + orderAmount(order), 0));
    }
    return Math.round(farmerRows.reduce((sum, row) => sum + Number(row.amount || 0), 0));
  }, [farmerRows, farmerOrders, selectedFarmerId]);

  const allPaymentRows = useMemo(() => {
    const farmerMap = new Map();
    farmers.forEach((f) => {
      const id = farmerKey(f);
      if (id) farmerMap.set(id, f);
    });

    return orders.map((order) => {
      const id = order.orderId || order.id || "";
      const map = gradeDetailMap(order);
      const unit = order.unit || "Kg";
      const statementRows = gradeStatementRows(order);
      const totals = gradeStatementTotals(statementRows);
      const finalAcceptedQty =
        totals.finalQty > 0
          ? totals.finalQty
          : Object.values(map).reduce((s, r) => s + Number(r.qty || 0), 0);
      const rejQty = rejectedTotal(order, map);
      const amount = orderAmount(order);
      const isPaid = isOrderPaid(order);
      const orderDate = order.orderDate || order.date || order.createdAt || order.requiredDate || "";
      const pickupDate = order.pickupDate || order.pickup?.pickupDate || "";
      const pickupTime = order.pickupTime || order.pickup?.pickupTime || "";
      const farmerId = orderFarmerId(order);
      const matchedFarmer = farmerMap.get(farmerId) || {};
      const farmerName = order.farmerName || matchedFarmer.name || "Farmer";
      const farmerCode = order.farmerCode || matchedFarmer.farmerCode || matchedFarmer.farmerId || farmerId || "—";
      const farmerMobile = order.farmerMobile || matchedFarmer.mobile || "—";
      const managerName = order.managerName || order.manager || matchedFarmer.managerName || matchedFarmer.manager || "—";
      const managerId = order.managerId || order.manager_id || matchedFarmer.managerId || matchedFarmer.manager_id || "";
      const matchedProduct = catalog.find((p) => orderMatchesProduct(order, p) || (p.productId && p.productId === order.productId));
      const variety = order.variety || matchedProduct?.variety || order.products?.[0]?.variety || "";
      const collectionCentre =
        order.collectionCentreName ||
        order.collectionCentre ||
        order.collectionCenter ||
        matchedFarmer.collectionCentre ||
        matchedFarmer.collectionCentreName ||
        matchedFarmer.centre ||
        "";
      const details = order.paymentDetails || {};
      const paymentMethod = details.paymentMethod || order.paymentMethod || (isPaid ? "Bank Transfer" : "—");
      const transactionId = details.transactionId || order.transactionId || "";
      const paymentDate = details.paymentDate || order.paymentDate || (isPaid ? (order.updatedAt || pickupDate) : "");
      const paymentNotes = details.notes || order.notes || "";

      return {
        id,
        order,
        orderDate,
        pickupDate,
        pickupTime,
        farmerId,
        farmerName,
        farmerCode,
        farmerMobile,
        managerName,
        managerId,
        collectionCentre,
        productName: order.productName || order.product || "Product",
        variety,
        unit,
        statementRows,
        finalAcceptedQty,
        rejQty,
        amount,
        isPaid,
        paymentStatus: isPaid ? "Paid" : (order.paymentStatus || "Pending"),
        paymentMethod,
        transactionId,
        paymentDate,
        paymentNotes,
      };
    }).sort((a, b) => {
      const da = new Date(a.pickupDate || a.orderDate || 0).getTime();
      const db = new Date(b.pickupDate || b.orderDate || 0).getTime();
      return db - da;
    });
  }, [orders, farmers, catalog]);

  const dateCounts = useMemo(() => {
    const counts = {
      all: 0,
      today: 0,
      yesterday: 0,
      this_week: 0,
      last_week: 0,
      this_month: 0,
    };

    allPaymentRows.forEach((row) => {
      if (paymentStatusFilter === "paid" && !row.isPaid) return;
      if (paymentStatusFilter === "pending" && row.isPaid) return;

      counts.all += 1;
      const targetDate = row.pickupDate || row.orderDate || row.paymentDate;
      if (matchPaymentDateFilter(targetDate, "today")) counts.today += 1;
      if (matchPaymentDateFilter(targetDate, "yesterday")) counts.yesterday += 1;
      if (matchPaymentDateFilter(targetDate, "this_week")) counts.this_week += 1;
      if (matchPaymentDateFilter(targetDate, "last_week")) counts.last_week += 1;
      if (matchPaymentDateFilter(targetDate, "this_month")) counts.this_month += 1;
    });

    return counts;
  }, [allPaymentRows, paymentStatusFilter]);

  const filteredPaymentRows = useMemo(() => {
    return allPaymentRows.filter((row) => {
      // 1. Status Filter
      if (paymentStatusFilter === "paid" && !row.isPaid) return false;
      if (paymentStatusFilter === "pending" && row.isPaid) return false;

      // 2. Date Filter
      const targetDate = row.pickupDate || row.orderDate || row.paymentDate;
      if (!matchPaymentDateFilter(targetDate, paymentDateFilter, customFromDate, customToDate)) {
        return false;
      }

      // 3. Payment Method Filter
      if (
        paymentMethodFilter !== "all" &&
        row.paymentMethod.toLowerCase() !== paymentMethodFilter.toLowerCase()
      ) {
        return false;
      }

      // 4. Farmer Filter
      if (paymentFarmerFilter !== "all" && row.farmerId !== paymentFarmerFilter) {
        return false;
      }

      // 5. Text Search
      if (!needle) return true;

      return [
        row.id,
        row.farmerName,
        row.farmerCode,
        row.farmerMobile,
        row.managerName,
        row.managerId,
        row.productName,
        row.variety,
        row.transactionId,
        row.paymentMethod,
        row.paymentStatus,
        shortDate(row.orderDate),
        shortDate(row.pickupDate),
        shortDate(row.paymentDate),
        String(row.amount),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [
    allPaymentRows,
    paymentStatusFilter,
    paymentDateFilter,
    customFromDate,
    customToDate,
    paymentMethodFilter,
    paymentFarmerFilter,
    needle,
  ]);

  const paymentStats = useMemo(() => {
    let totalAmt = 0;
    let paidAmt = 0;
    let pendingAmt = 0;
    let paidCount = 0;
    let pendingCount = 0;

    allPaymentRows.forEach((row) => {
      totalAmt += row.amount;
      if (row.isPaid) {
        paidAmt += row.amount;
        paidCount += 1;
      } else {
        pendingAmt += row.amount;
        pendingCount += 1;
      }
    });

    return {
      totalAmt: Math.round(totalAmt),
      paidAmt: Math.round(paidAmt),
      pendingAmt: Math.round(pendingAmt),
      paidCount,
      pendingCount,
      totalCount: allPaymentRows.length,
    };
  }, [allPaymentRows]);

  const paymentTableTotals = useMemo(() => {
    let accepted = 0;
    let rejected = 0;
    let amount = 0;
    let paid = 0;
    let pending = 0;

    filteredPaymentRows.forEach((row) => {
      accepted += row.finalAcceptedQty;
      rejected += row.rejQty;
      amount += row.amount;
      if (row.isPaid) paid += row.amount;
      else pending += row.amount;
    });

    return {
      accepted: Math.round(accepted),
      rejected: Math.round(rejected),
      amount: Math.round(amount),
      paid: Math.round(paid),
      pending: Math.round(pending),
    };
  }, [filteredPaymentRows]);

  const openPaymentModal = (row, e) => {
    if (e) e.stopPropagation();
    setActivePaymentOrder(row);
    setPaymentForm({
      paymentStatus: row.isPaid ? "Paid" : "Paid",
      paymentMethod: row.paymentMethod !== "—" ? row.paymentMethod : "Bank Transfer",
      transactionId: row.transactionId || `TXN-${Date.now().toString().slice(-6)}`,
      paymentDate: row.paymentDate ? String(row.paymentDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
      notes: row.paymentNotes || "",
    });
    setPaymentModalOpen(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!activePaymentOrder) return;
    setPaymentSaving(true);
    try {
      await vendorApi.updateOrderPayment(activePaymentOrder.id, {
        ...paymentForm,
        amount: activePaymentOrder.amount,
      });
      toast.success(`Payment updated for ${activePaymentOrder.id} successfully!`);
      setPaymentModalOpen(false);
      setOrders((prev) =>
        prev.map((o) => {
          const oid = o.orderId || o.id;
          if (oid === activePaymentOrder.id) {
            return {
              ...o,
              paymentStatus: paymentForm.paymentStatus,
              paymentMethod: paymentForm.paymentMethod,
              transactionId: paymentForm.transactionId,
              paymentDetails: {
                ...(o.paymentDetails || {}),
                ...paymentForm,
                amount: activePaymentOrder.amount,
              },
            };
          }
          return o;
        })
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update payment");
    } finally {
      setPaymentSaving(false);
    }
  };

  const listSplit = computeEarningsFromOrders(
    selectedProduct ? filteredVisibleOrders : selectedFarmerId ? farmerOrders : orders
  );
  const sheetUnit = selectedProduct?.unit || visibleOrders[0]?.unit || "Kg";
  const farmerBase = selectedFarmerId ? `${BASE}/farmer/${encodeURIComponent(selectedFarmerId)}` : BASE;

  if (loading) return <LoadingState rows={6} />;

  return (
    <div className="space-y-4">
      {/* Top Header (Statements only) */}
      {mainTab === "statements" && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            {selectedProduct ? (
              <button
                type="button"
                onClick={() => navigate(farmerBase)}
                className="shrink-0 text-[12px] font-semibold text-[#217346] hover:underline"
              >
                ← All Products
              </button>
            ) : selectedFarmerId ? (
              <button
                type="button"
                onClick={() => navigate(BASE)}
                className="shrink-0 text-[12px] font-semibold text-[#217346] hover:underline"
              >
                ← All Farmers
              </button>
            ) : null}
            <h1 className={`${EXCEL_PAGE_TITLE} !text-lg sm:!text-xl`}>
              Earning Statement
            </h1>
            {selectedProduct ? (
              <p className="min-w-0 truncate text-[13px] font-medium text-slate-500 sm:text-sm">
                · {selectedFarmer?.name || "Farmer"}
                {selectedFarmer?.managerName && selectedFarmer.managerName !== "—"
                  ? ` · Mgr: ${selectedFarmer.managerName}`
                  : ""}{" "}
                · {selectedProduct.name}
                {selectedProduct.variety ? ` · ${selectedProduct.variety}` : ""}
              </p>
            ) : selectedFarmerId ? (
              <p className="min-w-0 truncate text-[13px] font-medium text-slate-500 sm:text-sm">
                · {selectedFarmer?.name || "Farmer"}
                {selectedFarmer?.managerName && selectedFarmer.managerName !== "—"
                  ? ` · Mgr: ${selectedFarmer.managerName}`
                  : ""}
              </p>
            ) : (
              <p className={`${EXCEL_PAGE_SUB} w-full sm:w-auto`}>
                Select a farmer to view products and earnings
              </p>
            )}
          </div>
        </div>
      )}

      {mainTab === "payments" ? (
        /* ================= ALL PAYMENTS TAB ================= */
        <div className="space-y-4 px-0 py-3 sm:p-5 md:p-6">
          {/* Payment KPI Cards (Interactive - 1 Single Row) - Placed Above Filters */}
          <div className="px-3 sm:px-0">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setPaymentStatusFilter("all")}
                className={`rounded border p-2 sm:p-4 text-left transition-all ${
                  paymentStatusFilter === "all"
                    ? "border-[#217346] bg-emerald-50/40 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium leading-tight truncate">
                  Total Settlement
                </p>
                <p className="mt-0.5 sm:mt-1 text-sm sm:text-xl font-bold text-[#217346] truncate">
                  ₹{paymentStats.totalAmt.toLocaleString("en-IN")}
                </p>
                <p className="mt-0.5 text-[9px] sm:text-[10px] text-gray-400 truncate">
                  {paymentStats.totalCount} Graded
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentStatusFilter("paid")}
                className={`rounded border p-2 sm:p-4 text-left transition-all ${
                  paymentStatusFilter === "paid"
                    ? "border-green-600 bg-green-50/40 shadow-sm ring-1 ring-green-500"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium leading-tight truncate">
                  Paid
                </p>
                <p className="mt-0.5 sm:mt-1 text-sm sm:text-xl font-bold text-green-700 truncate">
                  ₹{paymentStats.paidAmt.toLocaleString("en-IN")}
                </p>
                <p className="mt-0.5 text-[9px] sm:text-[10px] text-green-600 font-semibold truncate">
                  {paymentStats.paidCount} Paid
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentStatusFilter("pending")}
                className={`rounded border p-2 sm:p-4 text-left transition-all ${
                  paymentStatusFilter === "pending"
                    ? "border-amber-600 bg-amber-50/40 shadow-sm ring-1 ring-amber-500"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium leading-tight truncate">
                  Pending
                </p>
                <p className="mt-0.5 sm:mt-1 text-sm sm:text-xl font-bold text-amber-600 truncate">
                  ₹{paymentStats.pendingAmt.toLocaleString("en-IN")}
                </p>
                <p className="mt-0.5 text-[9px] sm:text-[10px] text-amber-600 font-semibold truncate">
                  {paymentStats.pendingCount} Pending
                </p>
              </button>
            </div>
          </div>

          {/* Top-Level Integrated Filters: Search, Status, Methods, Farmers & Date-wise */}
          <div className="space-y-3 px-3 sm:px-0">
            {/* Top Row: Search + Mobile Filter Toggle Button + Payment Status Pills */}
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
              {/* Search Bar + Mobile Filter Toggle Button */}
              <div className="flex items-center gap-2 w-full lg:w-72 lg:flex-none">
                <div className="relative flex-1">
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Order, Farmer, Crop, TXN…"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#217346] focus:ring-1 focus:ring-[#217346]"
                  />
                </div>

                {/* Mobile Filter Toggle Button */}
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen((prev) => !prev)}
                  aria-label="Filter Options"
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold lg:hidden transition-all shrink-0 ${
                    mobileFilterOpen ||
                    paymentMethodFilter !== "all" ||
                    paymentFarmerFilter !== "all" ||
                    paymentDateFilter !== "all" ||
                    customFromDate ||
                    customToDate
                      ? "bg-[#217346] text-white shadow-sm ring-1 ring-[#217346]"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Filter</span>
                  {(paymentMethodFilter !== "all" ||
                    paymentFarmerFilter !== "all" ||
                    paymentDateFilter !== "all" ||
                    customFromDate ||
                    customToDate) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300 ring-2 ring-white" />
                  )}
                </button>
              </div>

              {/* Payment Status Segment Pills */}
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                  Payment Status:
                </span>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-gray-100 p-1 sm:flex sm:items-center">
                  <button
                    type="button"
                    onClick={() => setPaymentStatusFilter("all")}
                    className={`flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                      paymentStatusFilter === "all"
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <span>All</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        paymentStatusFilter === "all" ? "bg-gray-200 text-gray-800" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {paymentStats.totalCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentStatusFilter("paid")}
                    className={`flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                      paymentStatusFilter === "paid"
                        ? "bg-[#217346] text-white shadow-sm ring-1 ring-[#217346]"
                        : "text-green-700 hover:bg-green-50"
                    }`}
                  >
                    <span>✓ Paid</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        paymentStatusFilter === "paid"
                          ? "bg-emerald-800 text-white"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {paymentStats.paidCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentStatusFilter("pending")}
                    className={`flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                      paymentStatusFilter === "pending"
                        ? "bg-amber-600 text-white shadow-sm ring-1 ring-amber-600"
                        : "text-amber-700 hover:bg-amber-50"
                    }`}
                  >
                    <span>⏳ Pending</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        paymentStatusFilter === "pending"
                          ? "bg-amber-800 text-white"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {paymentStats.pendingCount}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible Filter Panel on Mobile, Always Visible on Desktop (lg:block) */}
            <div
              className={`${
                mobileFilterOpen ? "block" : "hidden"
              } lg:block space-y-3 rounded-lg border border-emerald-100 bg-emerald-50/30 p-3 lg:border-0 lg:bg-transparent lg:p-0 transition-all`}
            >
              {/* Mobile Filter Header */}
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 lg:hidden">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-gray-800">
                  <svg className="h-3.5 w-3.5 text-[#217346]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Filter Options</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="rounded px-2 py-0.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 text-xs font-bold"
                >
                  ✕ Close
                </button>
              </div>

              {/* Dropdowns (Method & Farmer) */}
              <div className="grid grid-cols-2 gap-2 w-full lg:w-auto lg:inline-flex lg:items-center">
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#217346]"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="bank transfer">Bank Transfer</option>
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online Gateway</option>
                </select>

                <select
                  value={paymentFarmerFilter}
                  onChange={(e) => setPaymentFarmerFilter(e.target.value)}
                  className="w-full lg:max-w-[180px] rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#217346]"
                >
                  <option value="all">All Farmers</option>
                  {farmers.map((f) => (
                    <option key={farmerKey(f)} value={farmerKey(f)}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date-wise Quick Filter Pills */}
              <div className="space-y-2">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                    Date Range:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: "all", label: "All Time", count: dateCounts.all },
                      { id: "today", label: "Today", count: dateCounts.today },
                      { id: "yesterday", label: "Yesterday", count: dateCounts.yesterday },
                      { id: "this_week", label: "This Week", count: dateCounts.this_week },
                      { id: "last_week", label: "Last Week", count: dateCounts.last_week },
                      { id: "this_month", label: "This Month", count: dateCounts.this_month },
                      { id: "custom", label: "📅 Custom Range" },
                    ].map((tab) => {
                      const active = paymentDateFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setPaymentDateFilter(tab.id)}
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                            active
                              ? "bg-[#217346] text-white shadow-sm ring-1 ring-[#217346]"
                              : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                          }`}
                        >
                          <span>{tab.label}</span>
                          {tab.count != null && (
                            <span
                              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                                active ? "bg-emerald-800 text-white" : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {tab.count}
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {/* Reset All Filters Button placed to the right of Custom Range */}
                    {(paymentStatusFilter !== "all" ||
                      paymentDateFilter !== "all" ||
                      customFromDate ||
                      customToDate ||
                      paymentMethodFilter !== "all" ||
                      paymentFarmerFilter !== "all" ||
                      search.trim()) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentStatusFilter("all");
                          setPaymentDateFilter("all");
                          setCustomFromDate("");
                          setCustomToDate("");
                          setPaymentMethodFilter("all");
                          setPaymentFarmerFilter("all");
                          setSearch("");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                      >
                        <span>✕ Reset All Filters</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Custom Date Range Picker */}
                {paymentDateFilter === "custom" && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-md border border-emerald-200 bg-white p-2.5 text-xs shadow-sm">
                    <span className="font-semibold text-[#217346] whitespace-nowrap">📅 Select Date Range:</span>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto">
                      <div className="flex items-center gap-1.5">
                        <label className="text-gray-600 font-medium">From:</label>
                        <input
                          type="date"
                          value={customFromDate}
                          onChange={(e) => setCustomFromDate(e.target.value)}
                          className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs outline-none focus:border-[#217346]"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="text-gray-600 font-medium">To:</label>
                        <input
                          type="date"
                          value={customToDate}
                          onChange={(e) => setCustomToDate(e.target.value)}
                          className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs outline-none focus:border-[#217346]"
                        />
                      </div>
                    </div>
                    {(customFromDate || customToDate) && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomFromDate("");
                          setCustomToDate("");
                        }}
                        className="text-[11px] font-semibold text-red-600 hover:underline self-start sm:self-auto"
                      >
                        Clear Dates
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment History Table */}
          {allPaymentRows.length === 0 ? (
            <div className="px-3 sm:px-0">
              <EmptyState
                title="No payment records yet"
                description="After Quality and Grading is confirmed, order payments will appear here."
              />
            </div>
          ) : filteredPaymentRows.length === 0 ? (
            <div className="px-3 sm:px-0">
              <EmptyState title="No matching payments" description="Try adjusting your search or filters." />
            </div>
          ) : (
            <>
              {/* MOBILE VIEW: Info Cards */}
              <div className="block sm:hidden space-y-3 px-1">
                {filteredPaymentRows.map((row, idx) => (
                  <PaymentMobileCard
                    key={row.id}
                    row={row}
                    idx={idx}
                    onClick={() => navigate(`${BASE}/${encodeURIComponent(row.id)}`)}
                  />
                ))}

                {/* Mobile Summary Total Card */}
                <div className="bg-[#FCE7F3] rounded-xl border border-pink-200 p-3.5 flex items-center justify-between text-xs shadow-sm">
                  <div>
                    <span className="font-bold text-[#1F2937] text-xs block">
                      Total Filtered ({filteredPaymentRows.length} Orders)
                    </span>
                    <span className="text-[11px] font-bold text-gray-700 mt-0.5 block">
                      Paid: ₹{paymentTableTotals.paid.toLocaleString("en-IN")} · Pending: ₹{paymentTableTotals.pending.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">Total</span>
                    <span className="text-base font-black text-[#15803D] tabular-nums">
                      ₹{paymentTableTotals.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* DESKTOP VIEW: Full Table */}
              <div className="hidden sm:block w-full overflow-hidden border border-[#9CA3AF] rounded-lg bg-white shadow-sm">
                <table className="w-full table-fixed border-collapse text-xs md:text-sm">
                  <colgroup>
                    <col className="w-[3.5%]" />
                    <col className="w-[16.5%]" />
                    <col className="w-[12.5%]" />
                    <col className="w-[18%]" />
                    <col className="w-[18%]" />
                    <col className="w-[14%]" />
                    <col className="w-[9%]" />
                    <col className="w-[8.5%]" />
                  </colgroup>
                  <thead className="sticky top-0 z-30">
                    <tr>
                      <th className={PAY_TH}>#</th>
                      <th className={PAY_TH}>
                        <HeadLabel line1="Order" line2="ID" />
                      </th>
                      <th className={PAY_TH}>
                        <HeadLabel line1="Pickup / Order" line2="Date & Time" />
                      </th>
                      <th className={PAY_TH}>
                        <HeadLabel line1="Farmer" line2="Details" />
                      </th>
                      <th className={PAY_TH}>
                        <HeadLabel line1="Manager /" line2="Collection Centre" />
                      </th>
                      <th className={PAY_TH}>
                        <HeadLabel line1="Crop /" line2="Produce" />
                      </th>
                      <th className={PAY_TH}>
                        <HeadLabel line1="Payable Amount" line2="₹" />
                      </th>
                      <th className={PAY_TH}>
                        <HeadLabel line1="Payment" line2="Status" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPaymentRows.map((row, idx) => {
                      const zebra = idx % 2 === 0 ? "bg-white hover:bg-emerald-50/70" : "bg-[#F9FAFB] hover:bg-emerald-50/70";
                      return (
                        <tr
                          key={row.id}
                          onClick={() => navigate(`${BASE}/${encodeURIComponent(row.id)}`)}
                          className="group cursor-pointer transition-colors"
                          title="Click to view Payment History & Grading Details"
                        >
                          <td className={`${PAY_TD} ${zebra} text-[#9CA3AF] font-semibold text-xs`}>{idx + 1}</td>
                          <td className={`${PAY_TD} ${zebra} px-1.5 py-2 text-center align-middle`}>
                            <OrderIdCell id={row.id} />
                          </td>
                          <td className={`${PAY_TD} ${zebra} px-1.5 py-2 text-center align-middle`}>
                            <span className="text-xs font-bold text-gray-900 block leading-tight">
                              <DateWithDay value={row.pickupDate || row.orderDate} />
                            </span>
                            {row.pickupTime ? (
                              <span className="inline-block text-[10px] text-emerald-800 font-semibold bg-emerald-50/80 border border-emerald-200/60 px-1.5 py-0.2 rounded mt-0.5 leading-tight">
                                {formatTime12h(row.pickupTime)}
                              </span>
                            ) : null}
                          </td>
                          <td className={`${PAY_TD} ${zebra} px-2 py-2 text-left`}>
                            <p className="font-bold text-gray-900 text-xs leading-tight truncate">{row.farmerName}</p>
                            <FarmerIdTag id={row.farmerCode || row.farmerId} />
                          </td>
                          <td className={`${PAY_TD} ${zebra} px-2 py-2 text-left`}>
                            <p className="font-bold text-gray-900 text-xs leading-tight truncate">{row.managerName || "—"}</p>
                            {row.collectionCentre ? (
                              <p className="text-[10.5px] font-medium text-emerald-800 leading-tight mt-0.5 truncate" title={row.collectionCentre}>
                                📍 {row.collectionCentre}
                              </p>
                            ) : null}
                            {row.managerId ? (
                              <ManagerIdTag id={row.managerId} />
                            ) : null}
                          </td>
                          <td className={`${PAY_TD} ${zebra} px-2 py-2 text-left`}>
                            <div className="flex items-center gap-1 flex-wrap">
                              <p className="font-bold text-gray-900 text-xs leading-tight">{row.productName}</p>
                              {row.variety ? (
                                <span className="inline-block rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800 border border-emerald-200/60">
                                  {row.variety}
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className={`${PAY_TD} ${zebra} px-2 py-2 text-center align-middle`}>
                            <span className="text-xs md:text-sm font-black tabular-nums text-[#15803D] block leading-tight">
                              ₹{row.amount.toLocaleString("en-IN")}
                            </span>
                          </td>
                          <td className={`${PAY_TD} ${zebra} px-1.5 py-2 text-center align-middle`}>
                            <PaymentStatusText status={row.paymentStatus} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className={`${PAY_TH} bg-[#FCE7F3] text-left text-xs md:text-[13px] font-bold text-[#1F2937] px-2 py-2`} colSpan={6}>
                        Total Filtered ({filteredPaymentRows.length} Orders)
                      </td>
                      <td className={`${PAY_TH} bg-[#FCE7F3] text-center font-extrabold tabular-nums text-[#217346] text-xs md:text-sm px-1 py-2`}>
                        ₹{paymentTableTotals.amount.toLocaleString("en-IN")}
                      </td>
                      <td className={`${PAY_TH} bg-[#FCE7F3] text-center font-bold text-[11px] md:text-xs text-gray-700 px-1 py-2 leading-tight`}>
                        Paid: ₹{paymentTableTotals.paid.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ================= EARNING STATEMENTS TAB ================= */
        <div className="space-y-3">
          <EarningsSummary total={listSplit.total} deposited={listSplit.deposited} balance={listSplit.balance} />

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                selectedProduct
                  ? "Search order ID, date, time, amount…"
                  : selectedFarmerId
                    ? "Search product, variety, ID…"
                    : "Search farmer, mobile, manager, ID…"
              }
              className={`${EXCEL_INPUT} w-full max-w-md px-3 py-2 text-xs`}
            />
            {search.trim() ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-[11px] font-semibold text-[#217346]"
              >
                Clear
              </button>
            ) : null}
          </div>

          {!selectedFarmerId ? (
            farmerRows.length === 0 ? (
              <EmptyState
                title="No farmers yet"
                description="Add farmers first. After Quality and Grading Final Summary is confirmed, earnings will appear here."
              />
            ) : filteredFarmerRows.length === 0 ? (
              <EmptyState title="No match found" description="Try another farmer, mobile, manager, or ID." />
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredFarmerRows.map((f) => (
                  <FarmerEarningsCard
                    key={f.id}
                    item={f}
                    onOpen={() => navigate(`${BASE}/farmer/${encodeURIComponent(f.id)}`)}
                  />
                ))}
              </div>
            )
          ) : !selectedProduct ? (
            products.length === 0 ? (
              <EmptyState
                title="No products yet"
                description="Add a product for this farmer first. After Quality and Grading Final Summary is confirmed, earnings will appear here."
              />
            ) : filteredProducts.length === 0 ? (
              <EmptyState title="No match found" description="Try another product name, variety, or ID." />
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2 lg:grid-cols-3">
                {filteredProducts.map((p) => (
                  <ProductEarningsCard
                    key={p.id}
                    item={p}
                    onOpen={() =>
                      navigate(`${farmerBase}/product/${encodeURIComponent(p.id)}`)
                    }
                  />
                ))}
              </div>
            )
          ) : visibleOrders.length === 0 ? (
            <EmptyState
              title="No earning records yet"
              description="After Quality and Grading Final Summary is confirmed, that order will appear here."
            />
          ) : filteredVisibleOrders.length === 0 ? (
            <EmptyState title="No match found" description="Try another order ID, date, time, or amount." />
          ) : (
            <SpreadsheetViewport className="overflow-hidden border border-[#9CA3AF] bg-white shadow-sm">
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
                  {filteredVisibleOrders.map((order, idx) => {
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
                        onClick={() => navigate(`${BASE}/${encodeURIComponent(id)}`)}
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
                          <PaymentStatusText status={order.paymentStatus || "Pending"} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      className={`${TH} bg-[#FCE7F3] text-left text-[12px] font-bold text-[#1F2937]`}
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
      )}

      {/* Payment Action Modal */}
      {paymentModalOpen && activePaymentOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPaymentModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-2xl border border-slate-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#1F2937]">Farmer Payment & Settlement</h2>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">{activePaymentOrder.id}</p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                onClick={() => setPaymentModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                <div>
                  <span className="text-gray-500 text-[10px] block">Farmer:</span>
                  <span className="font-bold text-gray-900">{activePaymentOrder.farmerName}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block">Produce:</span>
                  <span className="font-bold text-gray-900">
                    {activePaymentOrder.productName} {activePaymentOrder.variety ? `(${activePaymentOrder.variety})` : ""}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#374151]">Payable Amount</label>
                <input
                  type="text"
                  readOnly
                  value={`₹${activePaymentOrder.amount.toLocaleString("en-IN")}`}
                  className="mt-1 w-full bg-slate-100 border border-slate-300 rounded px-3 py-2 text-sm font-extrabold text-[#217346]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#374151]">Payment Status</label>
                <select
                  value={paymentForm.paymentStatus}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, paymentStatus: e.target.value }))}
                  className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-xs font-semibold focus:border-[#217346]"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#374151]">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                  className="mt-1 w-full border border-slate-300 rounded px-3 py-2 text-xs font-semibold focus:border-[#217346]"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT / IMPS / RTGS)</option>
                  <option value="UPI">UPI / Google Pay / PhonePe</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Online">Online Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#374151]">Transaction / Ref ID</label>
                <input
                  type="text"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, transactionId: e.target.value }))}
                  placeholder="e.g. TXN-984210"
                  className={`${EXCEL_INPUT} mt-1 w-full font-mono text-xs`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#374151]">Payment Date</label>
                <input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, paymentDate: e.target.value }))}
                  className={`${EXCEL_INPUT} mt-1 w-full text-xs`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#374151]">Remarks / Notes</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Paid to farmer bank account"
                  className={`${EXCEL_INPUT} mt-1 w-full text-xs`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={paymentSaving}
                  className={`${EXCEL_BTN_PRIMARY} flex-1 py-2 text-xs font-bold`}
                >
                  {paymentSaving ? "Saving…" : "Save Payment Details"}
                </button>
                <button
                  type="button"
                  className={`${EXCEL_BTN} py-2 text-xs`}
                  onClick={() => setPaymentModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
