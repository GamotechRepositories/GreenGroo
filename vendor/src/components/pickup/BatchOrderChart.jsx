import { useMemo, useState } from "react";
import CopyId from "../ui/CopyId";
import OrderQrModal from "./OrderQrModal";
import { orderQrValue } from "../../utils/orderQr";

const DEFAULT_GRADES = ["Grade A", "Grade B", "Grade C"];

const TH =
  "border border-[#C5D4C8] bg-[#E8F0EA] px-1 py-1.5 text-center text-[9px] font-bold leading-tight text-[#374151] sm:px-1.5 sm:text-[10px]";
const TD = "border border-[#E5E7EB] px-1 py-1.5 text-[10px] leading-tight text-[#1F2937] sm:px-1.5 sm:text-[11px]";

const GRADE_COLORS = {
  "Grade A": {
    head: "border-[#A7F3D0] bg-[#D1FAE5] text-[#065F46]",
    cell: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
  },
  "Grade B": {
    head: "border-[#BFDBFE] bg-[#DBEAFE] text-[#1E40AF]",
    cell: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
  },
  "Grade C": {
    head: "border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]",
    cell: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  },
};

function gradeTone(label = "") {
  return (
    GRADE_COLORS[label] || {
      head: "border-[#E5E7EB] bg-[#F3F4F6] text-[#374151]",
      cell: "border-[#E5E7EB] bg-[#F9FAFB] text-[#1F2937]",
    }
  );
}

function shortDate(value) {
  if (!value) return "—";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatTime12h(value) {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  if (/am|pm/i.test(raw)) return raw.replace(/\s+/g, " ");
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return raw;
  let hour = Number(m[1]);
  const min = m[2];
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return raw;
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${min} ${period}`;
}

function gradeListFrom(order) {
  if (Array.isArray(order.grades) && order.grades.length) return order.grades;
  const fromProducts = [];
  (Array.isArray(order.products) ? order.products : []).forEach((p) => {
    if (Array.isArray(p.grades) && p.grades.length) {
      fromProducts.push(...p.grades);
    } else if (p.grade || p.quantity) {
      fromProducts.push({
        label: p.grade || p.name || "Grade A",
        quantity: p.quantity,
      });
    }
  });
  return fromProducts;
}

function gradeDetailMap(order) {
  const map = {};
  const unit = order.unit || "Kg";
  gradeListFrom(order).forEach((g) => {
    const label = String(g.label || g.name || g.grade || "").trim();
    if (!label) return;
    const qty = Number(g.quantity || 0);
    if (!map[label]) map[label] = { qty: 0, unit };
    map[label].qty += qty;
  });
  if (!Object.keys(map).length) {
    const label = String(order.grade || "Grade A").trim() || "Grade A";
    const qty = Number(order.packedQuantity || order.confirmedQuantity || order.expectedQuantity || order.orderedQuantity || 0);
    map[label] = { qty, unit };
  }
  return map;
}

function formatQty(qty, unit) {
  const n = Number(qty || 0);
  if (!(n > 0)) return <span className="font-semibold text-[#9CA3AF]">×</span>;
  return (
    <span>
      {n.toLocaleString("en-IN")}
      <span className="ml-0.5 text-[8px] text-[#6B7280] sm:text-[9px]">{unit || "Kg"}</span>
    </span>
  );
}

function gradeColumnsOf(orders) {
  const set = new Set(DEFAULT_GRADES);
  orders.forEach((o) => {
    Object.keys(gradeDetailMap(o)).forEach((label) => set.add(label));
  });
  const extras = Array.from(set).filter((g) => !DEFAULT_GRADES.includes(g)).sort();
  return [...DEFAULT_GRADES, ...extras];
}

function OrderMobileCard({ order, index, gradeColumns, onView, onShowQr }) {
  const id = order.orderDisplayId || order.orderId || order.id;
  const map = gradeDetailMap(order);
  const unit = order.unit || "Kg";

  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-[#9CA3AF]">#{index + 1}</p>
          <p className="truncate text-[13px] font-bold text-[#1F2937]">
            {order.productName || "Product"}
            {order.variety ? <span className="font-semibold text-[#6B7280]"> · {order.variety}</span> : null}
          </p>
          <CopyId value={id} textClassName="truncate font-mono text-[9px] font-semibold text-[#217346] sm:text-[10px]" />
          <p className="mt-1 truncate text-[11px] text-[#6B7280]">
            Farmer <span className="font-semibold text-[#1F2937]">{order.farmerName || "—"}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-md bg-[#217346] px-3 text-[11px] font-semibold text-white"
            onClick={() => onShowQr?.(order)}
          >
            Show QR
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center rounded-md border border-[#D4D4D4] bg-white px-3 text-[11px] font-semibold text-[#1F2937]"
            onClick={() => onView?.(order)}
          >
            View
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6B7280]">
        <span>Order <span className="font-semibold text-[#1F2937]">{shortDate(order.orderDate || order.createdAt)}</span></span>
        <span>Pickup <span className="font-semibold text-[#1F2937]">{shortDate(order.pickupDate || order.scheduledDate)}</span></span>
        <span>Time <span className="font-semibold text-[#1F2937]">{formatTime12h(order.pickupTime || order.scheduledTime)}</span></span>
      </div>
      <div className="mt-2 overflow-hidden rounded-md border border-[#E5E7EB]">
        <div className="grid grid-cols-2 bg-[#F8FAF8] px-2 py-1 text-[10px] font-bold text-[#6B7280]">
          <span>Grade</span>
          <span className="text-right">Qty</span>
        </div>
        {gradeColumns.map((g) => {
          const row = map[g] || { qty: 0, unit };
          const tone = gradeTone(g);
          return (
            <div key={g} className={`grid grid-cols-2 items-center border-t border-[#E5E7EB] px-2 py-1.5 text-[12px] ${tone.cell}`}>
              <span className="font-semibold">{g}</span>
              <span className="text-right font-semibold tabular-nums">{formatQty(row.qty, row.unit || unit)}</span>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export default function BatchOrderChart({ orders = [], onView }) {
  const gradeColumns = useMemo(() => gradeColumnsOf(orders), [orders]);
  const [qrOrder, setQrOrder] = useState(null);

  if (!orders.length) {
    return <p className="border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400">No orders in this batch.</p>;
  }

  return (
    <div>
      <p className="mb-2 text-sm font-bold text-gray-900">Order details</p>

      <div className="space-y-2.5">
        {orders.map((order, idx) => (
          <OrderMobileCard
            key={order.id || order.orderDisplayId || idx}
            order={order}
            index={idx}
            gradeColumns={gradeColumns}
            onView={onView}
            onShowQr={setQrOrder}
          />
        ))}
      </div>

      <div className="hidden w-full overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm xl:block">
        <table className="w-full min-w-[720px] border-collapse text-[10px] sm:text-[11px]">
          <thead>
            <tr>
              <th className={TH}>#</th>
              <th className={TH}>Order ID</th>
              <th className={TH}>Farmer</th>
              <th className={TH}>Product</th>
              <th className={TH}>Order Date</th>
              <th className={TH}>Pickup Date</th>
              <th className={TH}>Pickup Time</th>
              {gradeColumns.map((g) => {
                const tone = gradeTone(g);
                return (
                  <th
                    key={g}
                    className={`border px-0.5 py-1.5 text-center text-[9px] font-bold leading-tight sm:text-[10px] ${tone.head}`}
                  >
                    {g}
                  </th>
                );
              })}
              <th className={TH}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => {
              const id = order.orderDisplayId || order.orderId || order.id;
              const map = gradeDetailMap(order);
              const unit = order.unit || "Kg";
              return (
                <tr key={order.id || id} className="hover:bg-[#F9FBF9]">
                  <td className={`${TD} text-center text-[#9CA3AF]`}>{idx + 1}</td>
                  <td className={TD}>
                    <CopyId value={id} textClassName="truncate font-mono text-[9px] font-semibold text-[#217346] sm:text-[10px]" />
                  </td>
                  <td className={`${TD} truncate font-semibold`} title={order.farmerName || ""}>
                    {order.farmerName || "—"}
                  </td>
                  <td className={`${TD} truncate`} title={[order.productName, order.variety].filter(Boolean).join(" · ")}>
                    <span className="font-semibold">{order.productName || "Product"}</span>
                    {order.variety ? <span className="block truncate text-[9px] text-[#6B7280]">{order.variety}</span> : null}
                  </td>
                  <td className={`${TD} text-center`}>{shortDate(order.orderDate || order.createdAt)}</td>
                  <td className={`${TD} text-center`}>{shortDate(order.pickupDate || order.scheduledDate)}</td>
                  <td className={`${TD} text-center`}>{formatTime12h(order.pickupTime || order.scheduledTime)}</td>
                  {gradeColumns.map((g) => {
                    const row = map[g] || { qty: 0, unit };
                    const tone = gradeTone(g);
                    const cell = `border px-0.5 py-1.5 text-center text-[10px] tabular-nums sm:text-[11px] ${tone.cell}`;
                    return (
                      <td key={`${id}-${g}`} className={cell}>
                        {formatQty(row.qty, row.unit || unit)}
                      </td>
                    );
                  })}
                  <td className={`${TD} bg-white px-1 py-1 text-center`}>
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      <button
                        type="button"
                        className="inline-flex h-7 min-w-[4.5rem] items-center justify-center rounded-md bg-[#217346] px-2 text-[10px] font-semibold text-white"
                        onClick={() => setQrOrder(order)}
                      >
                        Show QR
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-7 min-w-[3.5rem] items-center justify-center rounded-md border border-[#D4D4D4] bg-white px-2 text-[10px] font-semibold text-[#1F2937] hover:bg-[#F3F4F6]"
                        onClick={() => onView?.(order)}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <OrderQrModal value={orderQrValue(qrOrder)} record={qrOrder} onClose={() => setQrOrder(null)} />
    </div>
  );
}
