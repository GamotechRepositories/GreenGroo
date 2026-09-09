import { EXCEL_PANEL } from "../../utils/excelStyles";

export default function OrderStatusChart({ counts, statusFilter = "all", onStatus }) {
  const segments = [
    { key: "pending", label: "Approval Pending", value: Number(counts?.pending || 0), color: "#0284C7" },
    { key: "accepted", label: "Accepted", value: Number(counts?.accepted || 0), color: "#047857" },
    { key: "rejected", label: "Rejected", value: Number(counts?.rejected || 0), color: "#DC2626" },
  ];
  const total = segments.reduce((s, x) => s + x.value, 0) || 0;
  const max = Math.max(...segments.map((x) => x.value), 1);

  const radius = 36;
  const stroke = 12;
  const c = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={`${EXCEL_PANEL} flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-6`}>
      <div className="flex shrink-0 items-center gap-3">
        <div className="relative h-[88px] w-[88px]">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
            {total > 0
              ? segments.map((seg) => {
                  if (!(seg.value > 0)) return null;
                  const len = (seg.value / total) * c;
                  const dash = `${len} ${c - len}`;
                  const el = (
                    <circle
                      key={seg.key}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={stroke}
                      strokeDasharray={dash}
                      strokeDashoffset={-offset}
                      strokeLinecap="butt"
                    />
                  );
                  offset += len;
                  return el;
                })
              : null}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold tabular-nums text-[#1F2937]">{total}</span>
            <span className="text-[9px] font-semibold text-[#6B7280]">Orders</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {segments.map((seg) => (
            <button
              key={seg.key}
              type="button"
              onClick={() => onStatus?.(statusFilter === seg.key ? "all" : seg.key)}
              className={`flex items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors hover:bg-slate-50 ${
                statusFilter === seg.key ? "ring-1 ring-slate-200" : ""
              }`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-[11px] font-semibold" style={{ color: seg.color }}>
                {seg.label}
              </span>
              <span className="text-[11px] font-bold tabular-nums text-[#1F2937]">{seg.value}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        {segments.map((seg) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          const widthPct = Math.max((seg.value / max) * 100, seg.value > 0 ? 6 : 0);
          return (
            <button
              key={`bar-${seg.key}`}
              type="button"
              onClick={() => onStatus?.(statusFilter === seg.key ? "all" : seg.key)}
              className="block w-full text-left"
            >
              <div className="mb-0.5 flex items-center justify-between gap-2 text-[10px]">
                <span className="font-semibold" style={{ color: seg.color }}>
                  {seg.label}
                </span>
                <span className="tabular-nums text-[#6B7280]">
                  {seg.value} · {pct}%
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#F3F4F6]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${widthPct}%`, backgroundColor: seg.color }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
