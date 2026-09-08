import { EXCEL_PANEL } from "../../utils/excelStyles";
import { toOrderDateKey } from "../../utils/orderDisplay";

const STATUS = [
  { key: "pending", label: "Pending", color: "#0284C7" },
  { key: "accepted", label: "Accepted", color: "#047857" },
  { key: "rejected", label: "Rejected", color: "#DC2626" },
];

function isoDay(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function last7Days(orders = []) {
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({
      key: isoDay(d),
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
      count: 0,
      qty: 0,
    });
  }
  const map = Object.fromEntries(days.map((day) => [day.key, day]));
  orders.forEach((order) => {
    const key = toOrderDateKey(order);
    if (!map[key]) return;
    map[key].count += 1;
    map[key].qty += Number(order.totalQuantity || order.orderedQuantity || 0);
  });
  return days;
}

function topProducts(orders = [], limit = 5) {
  const map = new Map();
  orders.forEach((order) => {
    const name = String(order.productName || order.products?.[0]?.name || "Other").trim() || "Other";
    const prev = map.get(name) || { name, qty: 0, count: 0 };
    prev.qty += Number(order.totalQuantity || order.orderedQuantity || 0);
    prev.count += 1;
    map.set(name, prev);
  });
  return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, limit);
}

function Donut({ segments, total, size = 132 }) {
  const radius = 42;
  const stroke = 14;
  const c = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
        {total > 0
          ? segments.map((seg) => {
              if (!(seg.value > 0)) return null;
              const len = (seg.value / total) * c;
              const el = (
                <circle
                  key={seg.key}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += len;
              return el;
            })
          : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums text-[#1F2937]">{total}</span>
        <span className="text-[10px] font-semibold text-[#6B7280]">Orders</span>
      </div>
    </div>
  );
}

function StatusChart({ counts, onStatus }) {
  const segments = STATUS.map((s) => ({ ...s, value: Number(counts?.[s.key] || 0) }));
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const max = Math.max(...segments.map((s) => s.value), 1);

  return (
    <div className={`${EXCEL_PANEL} p-3 sm:p-4`}>
      <p className="text-sm font-semibold text-slate-900">Order status</p>
      <p className="text-[11px] text-[#6B7280]">Pending, accepted and rejected</p>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Donut segments={segments} total={total} />
        <div className="min-w-0 flex-1 space-y-2.5">
          {segments.map((seg) => {
            const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
            const widthPct = Math.max((seg.value / max) * 100, seg.value > 0 ? 8 : 0);
            return (
              <button
                key={seg.key}
                type="button"
                onClick={() => onStatus?.(seg.key)}
                className="block w-full text-left"
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                  <span className="flex items-center gap-1.5 font-semibold" style={{ color: seg.color }}>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                    {seg.label}
                  </span>
                  <span className="tabular-nums text-[#6B7280]">
                    {seg.value} · {pct}%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[#F3F4F6]">
                  <div className="h-full rounded-full" style={{ width: `${widthPct}%`, backgroundColor: seg.color }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekBarChart({ days }) {
  const max = Math.max(...days.map((d) => d.count), 1);
  const h = 140;
  const barW = 28;
  const gap = 14;
  const left = 28;
  const width = left + days.length * (barW + gap);
  const chartH = 100;

  return (
    <div className={`${EXCEL_PANEL} p-3 sm:p-4`}>
      <p className="text-sm font-semibold text-slate-900">Orders this week</p>
      <p className="text-[11px] text-[#6B7280]">Last 7 days by order count</p>
      <div className="mt-2 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${h}`} className="h-[160px] w-full min-w-[280px]">
          {[0, 0.5, 1].map((t) => {
            const y = 12 + chartH - t * chartH;
            return (
              <g key={t}>
                <line x1={left - 8} x2={width - 8} y1={y} y2={y} stroke="#F3F4F6" strokeWidth="1" />
                <text x={4} y={y + 3} fontSize="9" fill="#9CA3AF">
                  {Math.round(max * t)}
                </text>
              </g>
            );
          })}
          {days.map((day, i) => {
            const bh = (day.count / max) * chartH;
            const x = left + i * (barW + gap);
            const y = 12 + chartH - bh;
            return (
              <g key={day.key}>
                <rect x={x} y={y} width={barW} height={Math.max(bh, day.count ? 4 : 0)} rx="6" fill="#217346" opacity={day.count ? 1 : 0.18} />
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="#1F2937">
                  {day.count || ""}
                </text>
                <text x={x + barW / 2} y={h - 8} textAnchor="middle" fontSize="10" fill="#6B7280">
                  {day.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function ProductBars({ products }) {
  const max = Math.max(...products.map((p) => p.qty), 1);
  return (
    <div className={`${EXCEL_PANEL} p-3 sm:p-4 lg:col-span-2`}>
      <p className="text-sm font-semibold text-slate-900">Top Order Products</p>
      <p className="text-[11px] text-[#6B7280]">Products with the highest ordered quantity</p>
      {products.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#6B7280]">No product order data yet</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {products.map((p) => (
            <div key={p.name}>
              <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                <span className="min-w-0 truncate font-semibold text-slate-800">{p.name}</span>
                <span className="shrink-0 tabular-nums text-[#6B7280]">
                  {p.qty.toLocaleString("en-IN")} Kg · {p.count} orders
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#F3F4F6]">
                <div
                  className="h-full rounded-full bg-[#217346]"
                  style={{ width: `${Math.max((p.qty / max) * 100, p.qty > 0 ? 6 : 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ManagerDashboardCharts({ orders = [], counts, onStatus }) {
  const days = last7Days(orders);
  const products = topProducts(orders);

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <StatusChart counts={counts} onStatus={onStatus} />
      <WeekBarChart days={days} />
      <ProductBars products={products} />
    </div>
  );
}
