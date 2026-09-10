import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { listManagerQuality } from "../../api/farmerApi";
import { CopyButton } from "../../components/ui/CopyId";
import { formatProductBusinessId } from "../../utils/cropLinks";
import { EXCEL_PAGE_TITLE } from "../../utils/excelStyles";
import { todayISODate, yesterdayISODate } from "../../utils/orderDisplay";

const FILTER_CTRL =
  "h-9 w-full min-w-0 rounded-lg border border-[#D1D5DB] bg-white px-2 text-[12px] text-[#1F2937] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#217346] focus:ring-2 focus:ring-[#217346]/20";
const FILTER_CHIP =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-lg border px-2.5 text-[11px] font-semibold transition";
const FILTER_CHIP_IDLE = `${FILTER_CHIP} border-[#D1D5DB] bg-white text-[#374151] hover:bg-[#F9FAFB]`;
const FILTER_CHIP_ACTIVE = `${FILTER_CHIP} border-[#217346] bg-[#217346] text-white`;
const FILTER_LABEL = "mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]";

const TH =
  "border border-[#E5E7EB] bg-[#F3F4F6] px-0.5 py-1 text-left text-[8px] font-semibold leading-tight text-[#374151] sm:px-2 sm:py-2 sm:text-[10px]";
const TD =
  "border border-[#E5E7EB] px-0.5 py-1 text-[8px] leading-tight text-[#1F2937] align-top sm:px-2 sm:py-2 sm:text-[11px]";
const GRADE_TD =
  "border px-0.5 py-1 text-center text-[8px] font-bold tabular-nums sm:px-2 sm:py-2 sm:text-[11px]";

function shortDate(value) {
  if (!value) return "—";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw) && !raw.includes("T") && raw.length <= 10) {
    const [y, m, d] = raw.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const [y, m, day] = raw.slice(0, 10).split("-");
      return `${day}/${m}/${y}`;
    }
    return "—";
  }
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatTime12h(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (/am|pm/i.test(raw) && !raw.includes("T")) {
    return raw.replace(/\s+/g, " ").replace(/am/i, "AM").replace(/pm/i, "PM");
  }
  const asDate = new Date(raw);
  if (!Number.isNaN(asDate.getTime()) && (raw.includes("T") || raw.length > 12)) {
    return asDate.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
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

function completedAtOf(row) {
  return (
    row.gradingConfirmedAt ||
    row.inspectionCompletedAt ||
    row.updatedAt ||
    row.receivedAt ||
    null
  );
}

function toCompletedDateKey(row) {
  const raw = completedAtOf(row);
  if (!raw) return "";
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function matchesCompletedDateRange(row, from = "", to = "") {
  if (!from && !to) return true;
  const key = toCompletedDateKey(row);
  if (!key) return false;
  if (from && key < from) return false;
  if (to && key > to) return false;
  return true;
}

function splitIdIntoRows(value, parts = 3) {
  const text = String(value || "").trim();
  if (!text || text === "—") return ["—"];
  const chunks = text.split("-").filter(Boolean);
  if (chunks.length <= 1) {
    const size = Math.ceil(text.length / parts);
    return Array.from({ length: parts }, (_, i) => text.slice(i * size, (i + 1) * size)).filter(Boolean);
  }
  if (chunks.length <= parts) return chunks;
  const rows = Array.from({ length: parts }, () => []);
  chunks.forEach((chunk, i) => {
    const rowIdx = Math.min(parts - 1, Math.floor((i * parts) / chunks.length));
    rows[rowIdx].push(chunk);
  });
  return rows.map((r) => r.join("-")).filter(Boolean);
}

function IdThreeLines({ value, textClassName = "font-mono text-[8px] font-semibold text-[#217346] sm:text-[10px]" }) {
  const full = String(value || "").trim();
  if (!full || full === "—") return <span className="text-[#9CA3AF]">—</span>;
  const lines = splitIdIntoRows(full, 3);
  return (
    <span className="inline-flex max-w-full items-start gap-0.5">
      <span className={`min-w-0 leading-snug ${textClassName}`} title={full}>
        {lines.map((line) => (
          <span key={line} className="block break-all">
            {line}
          </span>
        ))}
      </span>
      <CopyButton value={full} />
    </span>
  );
}

function IdOneLine({ label, value, textClassName = "font-mono text-[9px] font-semibold text-[#217346]" }) {
  const full = String(value || "").trim();
  if (!full || full === "—") {
    return (
      <p className="min-w-0 leading-tight text-[9px] text-[#6B7280]">
        <span className="font-semibold">{label} </span>
        <span className="text-[#9CA3AF]">—</span>
      </p>
    );
  }
  return (
    <div className="flex min-w-0 items-start gap-0.5 leading-tight text-[9px]">
      <span className="shrink-0 font-semibold text-[#6B7280]">{label}</span>
      <span className={`min-w-0 flex-1 break-all ${textClassName}`} title={full}>
        {full}
      </span>
      <CopyButton value={full} />
    </div>
  );
}

function HistoryMobileCard({ row, index, onOpen }) {
  const completedAt = completedAtOf(row);
  const dateText = shortDate(completedAt);
  const timeText = formatTime12h(completedAt);
  const product = row.productName || row.product || "—";
  return (
    <article
      className="flex h-full cursor-pointer flex-col rounded-lg border border-[#E5E7EB] bg-white p-2 shadow-sm active:bg-[#F9FBF9]"
      onClick={() => onOpen(row)}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold text-[#9CA3AF]">#{index}</p>
          <p className="line-clamp-2 text-[11px] font-bold leading-tight text-[#1F2937]">
            {product}
            {row.variety ? <span className="font-medium text-[#6B7280]"> · {row.variety}</span> : null}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[10px] font-medium leading-tight text-[#374151]">
            {row.farmerName || "—"}
          </p>
        </div>
        <div className="shrink-0 text-right leading-tight">
          <p className="text-[9px] font-semibold text-[#1F2937]">{dateText}</p>
          <p className="text-[8px] text-[#6B7280]">{timeText || "—"}</p>
          <p className="mt-0.5 text-[8px] font-semibold text-[#6B7280]">{row.unit}</p>
        </div>
      </div>

      <div className="mt-1.5 space-y-0.5 border-t border-[#F3F4F6] pt-1.5" onClick={(e) => e.stopPropagation()}>
        <IdOneLine label="O:" value={row.orderDisplay} />
        <IdOneLine
          label="B:"
          value={row.batchId}
          textClassName="font-mono text-[9px] font-semibold text-[#1E40AF]"
        />
        <IdOneLine label="C:" value={row.collectionCentreId} />
      </div>

      <div className="mt-auto grid grid-cols-2 gap-1 pt-1.5 text-center">
        <div className="rounded border border-[#A7F3D0] bg-[#ECFDF5] px-0.5 py-1">
          <p className="text-[8px] font-semibold text-[#065F46]">A</p>
          <p className="text-[10px] font-bold tabular-nums leading-none text-[#065F46]">{row.gradeA.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded border border-[#BFDBFE] bg-[#EFF6FF] px-0.5 py-1">
          <p className="text-[8px] font-semibold text-[#1E40AF]">B</p>
          <p className="text-[10px] font-bold tabular-nums leading-none text-[#1E40AF]">{row.gradeB.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded border border-[#FDE68A] bg-[#FFFBEB] px-0.5 py-1">
          <p className="text-[8px] font-semibold text-[#92400E]">C</p>
          <p className="text-[10px] font-bold tabular-nums leading-none text-[#92400E]">{row.gradeC.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded border border-[#FECACA] bg-[#FEF2F2] px-0.5 py-1">
          <p className="text-[8px] font-semibold text-[#991B1B]">R</p>
          <p className="text-[10px] font-bold tabular-nums leading-none text-[#DC2626]">{row.rejected.toLocaleString("en-IN")}</p>
        </div>
      </div>
    </article>
  );
}

function splitNameTwoRows(value) {
  const text = String(value || "").trim();
  if (!text || text === "—") return ["—"];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    const mid = Math.ceil(text.length / 2);
    return [text.slice(0, mid), text.slice(mid)].filter(Boolean);
  }
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")].filter(Boolean);
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function gradeQty(row, letter) {
  const label = `Grade ${letter}`;
  const assigned = num(row[`grade${letter}Quantity`] ?? row[`grade${letter}Assigned`]);
  const grades = Array.isArray(row.grades) ? row.grades : [];
  const fromGrade = grades.find((g) => String(g.label || g.grade || "").trim() === label);
  const finalRows = Array.isArray(row.finalStatement) ? row.finalStatement : [];
  const fromFinal = finalRows.find((g) => String(g.label || g.grade || "").trim() === label);
  const gq = row.gradeQuality && typeof row.gradeQuality === "object" ? row.gradeQuality : {};
  const rejected = num(gq[label]?.rejectedQuantity || fromFinal?.rejectedQuantity);
  const base = num(
    fromFinal?.finalQty ?? fromFinal?.quantity ?? fromFinal?.qty ?? fromGrade?.quantity ?? fromGrade?.qty ?? assigned
  );
  return Math.max(0, fromFinal?.finalQty != null ? base : base - rejected);
}

function rejectedQty(row) {
  const gq = row.gradeQuality && typeof row.gradeQuality === "object" ? row.gradeQuality : {};
  const fromGq = ["Grade A", "Grade B", "Grade C"].reduce(
    (sum, label) => sum + num(gq[label]?.rejectedQuantity),
    0
  );
  if (fromGq > 0) return fromGq;
  return num(row.rejectedQuantity);
}

function matchesProduct(row, { productId, productBizId, name, variety }) {
  if (!productId && !productBizId && !name) return true;
  const entryProductId = String(row.productId || "").trim().toLowerCase();
  const entryBiz = String(formatProductBusinessId(row) || "").trim().toLowerCase();
  const entryName = String(row.productName || row.product || "").trim().toLowerCase();
  const entryVariety = String(row.variety || "").trim().toLowerCase();
  const wantId = String(productId || productBizId || "").trim().toLowerCase();
  const wantName = String(name || "").trim().toLowerCase();
  const wantVariety = String(variety || "").trim().toLowerCase();

  if (wantId) {
    if (entryProductId && (entryProductId === wantId || entryProductId.includes(wantId) || wantId.includes(entryProductId))) {
      return true;
    }
    if (entryBiz && (entryBiz === wantId || entryBiz.includes(wantId) || wantId.includes(entryBiz))) return true;
  }
  if (wantName && entryName === wantName) {
    if (!wantVariety) return true;
    return entryVariety === wantVariety || entryVariety.includes(wantVariety);
  }
  if (wantName && entryName.includes(wantName)) {
    if (!wantVariety) return true;
    return entryVariety === wantVariety || entryVariety.includes(wantVariety);
  }
  return false;
}

export default function ManagerInventoryHistoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId") || "";
  const productBizId = searchParams.get("productBizId") || "";
  const productName = searchParams.get("name") || "";
  const variety = searchParams.get("variety") || "";
  const productFilter = { productId, productBizId, name: productName, variety };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [farmerFilter, setFarmerFilter] = useState("");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const setDateRange = (from, to) => {
    setDateFrom(from || "");
    setDateTo(to || "");
  };
  const setTodayFilter = () => {
    const today = todayISODate();
    setDateRange(today, today);
  };
  const setYesterdayFilter = () => {
    const yesterday = yesterdayISODate();
    setDateRange(yesterday, yesterday);
  };
  const clearDateFilter = () => setDateRange("", "");

  useEffect(() => {
    setLoading(true);
    listManagerQuality({ bucket: "completed" })
      .then((data) => setItems(Array.isArray(data?.items) ? data.items : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const farmers = useMemo(() => {
    const map = new Map();
    items.forEach((row) => {
      const id = row.farmerId || "";
      const name = row.farmerName || id;
      if (id && !map.has(id)) map.set(id, name);
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((row) => matchesProduct(row, productFilter))
      .filter((row) => !farmerFilter || row.farmerId === farmerFilter)
      .filter((row) => matchesCompletedDateRange(row, dateFrom, dateTo))
      .filter((row) => {
        if (!q) return true;
        return [
          row.productName,
          row.product,
          row.variety,
          row.farmerName,
          row.orderDisplayId,
          row.orderId,
          row.batchId,
          row.collectionCentre,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      })
      .map((row) => ({
        ...row,
        gradeA: gradeQty(row, "A"),
        gradeB: gradeQty(row, "B"),
        gradeC: gradeQty(row, "C"),
        rejected: rejectedQty(row),
        orderDisplay: row.orderDisplayId || row.orderId || "—",
        unit: row.unit || "Kg",
        source: "Quality & Grading · Completed",
      }))
      .sort((a, b) => {
        const ta = new Date(completedAtOf(a) || 0).getTime();
        const tb = new Date(completedAtOf(b) || 0).getTime();
        return tb - ta;
      });
  }, [items, productFilter, farmerFilter, query, dateFrom, dateTo, productId, productBizId, productName, variety]);

  const todayKey = todayISODate();
  const yesterdayKey = yesterdayISODate();
  const isTodayActive = dateFrom === todayKey && dateTo === todayKey;
  const isYesterdayActive = dateFrom === yesterdayKey && dateTo === yesterdayKey;

  return (
    <div className="space-y-4">
      <div className="min-w-0">
        <Link to="/manager/inventory" className="mb-1 inline-block text-[12px] font-semibold text-[#217346]">
          ← All Inventory
        </Link>
        <h1 className={EXCEL_PAGE_TITLE}>Inventory History</h1>
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-1.5 sm:flex sm:flex-wrap sm:items-end sm:gap-2">
            <label className="min-w-0 sm:w-[9rem]">
              <span className={FILTER_LABEL}>From</span>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateRange(e.target.value, dateTo)}
                className={FILTER_CTRL}
              />
            </label>
            <label className="min-w-0 sm:w-[9rem]">
              <span className={FILTER_LABEL}>To</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateRange(dateFrom, e.target.value)}
                className={FILTER_CTRL}
              />
            </label>
            <div className="min-w-0 shrink-0">
              <span className={`${FILTER_LABEL} max-sm:sr-only`}>Quick</span>
              <div className="flex h-9 gap-1">
                <button
                  type="button"
                  onClick={setTodayFilter}
                  className={isTodayActive ? FILTER_CHIP_ACTIVE : FILTER_CHIP_IDLE}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={setYesterdayFilter}
                  className={isYesterdayActive ? FILTER_CHIP_ACTIVE : FILTER_CHIP_IDLE}
                >
                  Yesterday
                </button>
                {dateFrom || dateTo ? (
                  <button type="button" onClick={clearDateFilter} className={FILTER_CHIP_IDLE}>
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <label className="min-w-0">
              <span className={FILTER_LABEL}>Farmer</span>
        <select
          value={farmerFilter}
          onChange={(e) => setFarmerFilter(e.target.value)}
                className={FILTER_CTRL}
        >
          <option value="">All Farmers</option>
          {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
          ))}
        </select>
            </label>
            <label className="min-w-0">
              <span className={FILTER_LABEL}>Search</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={FILTER_CTRL}
                placeholder="Order, batch, farmer…"
              />
            </label>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-[#6B7280]">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#6B7280]">No Quality & Grading · Completed history found</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 md:hidden">
            {rows.map((row, idx) => (
              <HistoryMobileCard
                key={row.inspectionId || row.orderId || idx}
                row={row}
                index={idx + 1}
                onOpen={(r) => navigate(`/manager/quality/${r.orderId}`)}
              />
            ))}
          </div>

          <div className="hidden w-full overflow-hidden border border-[#E5E7EB] bg-white shadow-sm md:block">
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col className="w-[3%] sm:w-[3.5%] md:w-[4%]" />
              <col className="w-[10%] sm:w-[9%] md:w-[8%]" />
              <col className="w-[11%] sm:w-[10%] md:w-[11%]" />
              <col className="w-[9%] sm:w-[8%] md:w-[8%]" />
              <col className="w-[9%] sm:w-[8%] md:w-[8%]" />
              <col className="w-[11%] sm:w-[11%] md:w-[11%]" />
              <col className="w-[6%] sm:w-[7%] md:w-[7%]" />
              <col className="w-[6%] sm:w-[7%] md:w-[7%]" />
              <col className="w-[8%] sm:w-[9%] md:w-[9%]" />
              <col className="w-[8%] sm:w-[9%] md:w-[9%]" />
              <col className="w-[8%] sm:w-[9%] md:w-[9%]" />
              <col className="w-[6%] sm:w-[6%] md:w-[5.5%]" />
              <col className="w-[5%] sm:w-[3.5%] md:w-[4%]" />
            </colgroup>
            <thead>
              <tr>
                <th className={`${TH} w-[3%] text-center sm:w-[3.5%] md:w-[4%]`}>#</th>
                <th className={`${TH} w-[10%] sm:w-[9%] md:w-[8%]`}>Date</th>
                <th className={`${TH} w-[11%] sm:w-[10%] md:w-[11%]`}>Farmer</th>
                <th className={`${TH} w-[9%] sm:w-[8%]`}>
                  <span className="sm:hidden">Order</span>
                  <span className="hidden sm:inline">Order ID</span>
                </th>
                <th className={`${TH} w-[9%] sm:w-[8%]`}>
                  <span className="sm:hidden">Batch</span>
                  <span className="hidden sm:inline">Batch ID</span>
                </th>
                <th className={`${TH} w-[11%]`}>
                  <span className="sm:hidden">CC ID</span>
                  <span className="hidden sm:inline">Collection Centre ID</span>
                </th>
                <th className={`${TH} w-[6%] sm:w-[7%]`}>Product</th>
                <th className={`${TH} w-[6%] sm:w-[7%]`}>Variety</th>
                <th className={`${TH} w-[8%] border-[#A7F3D0] bg-[#D1FAE5] text-center text-[#065F46] sm:w-[9%]`}>
                  <span className="sm:hidden">A</span>
                  <span className="hidden sm:inline">Grade A</span>
                </th>
                <th className={`${TH} w-[8%] border-[#BFDBFE] bg-[#DBEAFE] text-center text-[#1E40AF] sm:w-[9%]`}>
                  <span className="sm:hidden">B</span>
                  <span className="hidden sm:inline">Grade B</span>
                </th>
                <th className={`${TH} w-[8%] border-[#FDE68A] bg-[#FEF3C7] text-center text-[#92400E] sm:w-[9%]`}>
                  <span className="sm:hidden">C</span>
                  <span className="hidden sm:inline">Grade C</span>
                </th>
                <th className={`${TH} w-[6%] border-[#FECACA] bg-[#FEE2E2] text-center text-[#991B1B] sm:w-[6%] md:w-[5.5%]`}>
                  <span className="sm:hidden">R</span>
                  <span className="hidden sm:inline">Rejected</span>
                </th>
                <th className={`${TH} w-[5%] text-center sm:w-[3.5%] md:w-[4%]`}>Unit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                  <tr
                    key={row.inspectionId || row.orderId || idx}
                    className="cursor-pointer hover:bg-[#F9FBF9]"
                    onClick={() => navigate(`/manager/quality/${row.orderId}`)}
                  >
                    <td className={`${TD} text-center text-[#9CA3AF]`}>{idx + 1}</td>
                    <td className={TD}>
                      {(() => {
                        const completedAt = completedAtOf(row);
                        const dateText = shortDate(completedAt);
                        const timeText = formatTime12h(completedAt);
                        return (
                          <>
                            <p className="font-semibold text-[#1F2937]">{dateText}</p>
                            <p className="text-[7px] font-medium text-[#6B7280] sm:text-[10px]">
                              {timeText || "—"}
                            </p>
                          </>
                        );
                      })()}
                    </td>
                    <td className={`${TD} min-w-0 font-medium`}>
                      {(() => {
                        const lines = splitNameTwoRows(row.farmerName);
                        return (
                          <span className="block leading-snug" title={row.farmerName || ""}>
                            {lines.map((line) => (
                              <span key={line} className="block break-words">
                                {line}
                              </span>
                            ))}
                      </span>
                        );
                      })()}
                    </td>
                    <td className={`${TD} min-w-0`} onClick={(e) => e.stopPropagation()}>
                      <IdThreeLines value={row.orderDisplay} />
                    </td>
                    <td className={`${TD} min-w-0`} onClick={(e) => e.stopPropagation()}>
                      <IdThreeLines
                        value={row.batchId}
                        textClassName="font-mono text-[8px] font-semibold text-[#1E40AF] sm:text-[10px]"
                      />
                    </td>
                    <td className={`${TD} min-w-0`} onClick={(e) => e.stopPropagation()}>
                      <IdThreeLines
                        value={row.collectionCentreId}
                        textClassName="font-mono text-[8px] font-semibold text-[#217346] sm:text-[9px]"
                      />
                    </td>
                    <td className={`${TD} break-words font-semibold`}>{row.productName || row.product || "—"}</td>
                    <td className={`${TD} break-words`}>{row.variety || "—"}</td>
                    <td className={`${GRADE_TD} border-[#A7F3D0] bg-[#ECFDF5]`}>
                      {row.gradeA.toLocaleString("en-IN")}
                    </td>
                    <td className={`${GRADE_TD} border-[#BFDBFE] bg-[#EFF6FF]`}>
                      {row.gradeB.toLocaleString("en-IN")}
                    </td>
                    <td className={`${GRADE_TD} border-[#FDE68A] bg-[#FFFBEB]`}>
                      {row.gradeC.toLocaleString("en-IN")}
                    </td>
                    <td className={`${GRADE_TD} border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]`}>
                      {row.rejected.toLocaleString("en-IN")}
                    </td>
                    <td className={`${TD} text-center font-semibold`}>{row.unit}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
