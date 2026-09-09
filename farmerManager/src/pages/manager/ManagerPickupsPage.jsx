import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getManagerPickups } from "../../api/farmerApi";
import StatusBadge from "../../components/ui/StatusBadge";
import EmptyState from "../../components/ui/EmptyState";
import CopyId, { CopyButton, formatVehicleId } from "../../components/ui/CopyId";
import QrScanModal from "../../components/pickup/QrScanModal";
import { isBatchQrPayload, parseBatchQrPayload } from "../../utils/batchQr";
import { parseOrderQrPayload } from "../../utils/orderQr";
import { usePolling } from "../../hooks/usePolling";
import { EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB, EXCEL_BTN_PRIMARY, EXCEL_BTN, EXCEL_INPUT } from "../../utils/excelStyles";
import { formatMoney, formatOrderDate, todayISODate, yesterdayISODate } from "../../utils/orderDisplay";

const COPY = {
  ready: { title: "Ready for Pickup", sub: "Orders from your assigned farmers waiting for a driver.", filter: "ready", empty: "No ready-for-pickup orders yet." },
  assigned: { title: "Assigned Pickups", sub: "Pickups with a driver assigned.", filter: "assigned", empty: "No assigned pickups." },
  requests: { title: "Ready for Pickup", sub: "Orders from your assigned farmers waiting for a driver.", filter: "ready", empty: "No ready-for-pickup orders yet." },
  today: { title: "Today's Pickups", sub: "Scheduled for today and not yet picked up.", filter: "today", empty: "No pickups scheduled today." },
  active: { title: "All Pickups", sub: "Every pickup for your assigned farmers, grouped by lot / batch.", filter: "all", empty: "No pickups yet." },
  all: { title: "All Pickups", sub: "Every pickup for your assigned farmers, grouped by lot / batch.", filter: "all", empty: "No pickups yet." },
  incoming: { title: "Incoming Pickups", sub: "Batches not yet received at the collection centre, with live status.", filter: "incoming", empty: "No incoming pickups yet." },
  centre: { title: "Pickups at Centre", sub: "Batches that have reached the collection centre and are not yet received.", filter: "centre", empty: "No pickups at the collection centre." },
  completed: { title: "Picked Up", sub: "Confirmed pickups.", filter: "history", empty: "No completed pickups yet." },
  history: { title: "Picked Up", sub: "Completed pickup history for your farmers.", filter: "history", empty: "No pickup history yet." },
};

const DONE_TODAY_STATUSES = new Set([
  "PICKED_UP",
  "PICKUP_CONFIRMED",
  "IN_TRANSIT",
  "ARRIVED_AT_CENTRE",
  "COLLECTION_CENTRE_RECEIVED",
  "RECEIVED_AT_COLLECTION_CENTRE",
  "COMPLETED",
  "CANCELLED",
]);

const DEFAULT_GRADES = ["Grade A", "Grade B", "Grade C"];
const TH =
  "border border-[#C5D4C8] bg-[#E8F0EA] px-1 py-1.5 text-center text-[9px] font-bold leading-tight text-[#374151] sm:px-1.5 sm:text-[10px]";
const TD = "border border-[#E5E7EB] px-1 py-1.5 text-[10px] leading-tight text-[#1F2937] sm:px-1.5 sm:text-[11px]";
const ACTION_BTN =
  "inline-flex h-7 min-w-[3.5rem] items-center justify-center rounded px-2 text-[10px] font-semibold leading-none whitespace-nowrap border border-[#D4D4D4] bg-white text-[#1F2937] hover:bg-[#F3F4F6]";
const ACTION_BTN_PRIMARY =
  "inline-flex h-7 min-w-[3.5rem] items-center justify-center rounded px-2 text-[10px] font-semibold leading-none whitespace-nowrap border border-[#217346] bg-[#217346] text-white hover:bg-[#1a5c38]";

function shortDate(value) {
  if (!value) return "—";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  const fromId = String(value).match(/GGC-ORD-(\d{4})(\d{2})(\d{2})/i);
  if (fromId) return `${fromId[3]}/${fromId[2]}/${fromId[1]}`;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    const full = formatOrderDate(value);
    return full && full !== "—" ? full : "—";
  }
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function pickupOrderDate(pickup) {
  return pickup?.orderDate || pickup?.orderDisplayId || pickup?.orderId || "";
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

function gradeDetailMap(pickup) {
  const map = {};
  const unit = pickup.unit || "Kg";
  (Array.isArray(pickup.grades) ? pickup.grades : []).forEach((g) => {
    const label = String(g.label || g.name || "").trim();
    if (!label) return;
    const qty = Number(g.quantity || 0);
    const rate = Number(g.price ?? g.rate ?? g.pricePerKg ?? 0) || 0;
    if (!map[label]) map[label] = { qty: 0, rate: 0, unit };
    map[label].qty += qty;
    if (rate > 0) map[label].rate = rate;
  });
  if (!Object.keys(map).length) {
    const label = String(pickup.grade || "Grade A").split(",")[0].trim() || "Grade A";
    const qty = Number(pickup.packedQuantity || pickup.orderedQuantity || pickup.expectedQuantity || 0);
    map[label] = { qty, rate: Number(pickup.price || 0) || 0, unit };
  }
  return map;
}

function formatQty(qty, unit) {
  const n = Number(qty || 0);
  if (!(n > 0)) return <span className="font-semibold text-[#9CA3AF]">×</span>;
  return (
    <span className="whitespace-normal">
      {n.toLocaleString("en-IN")}
      <span className="ml-0.5 text-[8px] text-[#6B7280]">{unit || "Kg"}</span>
    </span>
  );
}

function formatRate(rate, qty = 0) {
  if (!(Number(qty || 0) > 0)) return <span className="font-semibold text-[#9CA3AF]">×</span>;
  const n = Number(rate || 0);
  if (!(n > 0)) return <span className="font-semibold text-[#9CA3AF]">×</span>;
  return formatMoney(n);
}

function pickupDateISO(pickup) {
  const raw = String(pickup?.pickupDate || pickup?.scheduledDate || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function pickupMatches(pickup, { q, farmerId, product, pickupDate }) {
  if (farmerId && String(pickup.farmerId || "") !== farmerId) return false;
  if (product && String(pickup.productName || "") !== product) return false;
  if (pickupDate && pickupDateISO(pickup) !== pickupDate) return false;
  const query = String(q || "").trim().toLowerCase();
  if (!query) return true;
  const hay = [
    pickup.farmerName,
    pickupLocation(pickup),
    pickup.orderDisplayId,
    pickup.orderId,
    pickup.productName,
    pickup.variety,
    pickup.collectionBatchId,
    pickup.lotId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(query);
}

function pickupLocation(pickup) {
  const geo = pickup?.farmGeo || {};
  const fromGeo = [geo.village, geo.taluka, geo.district, geo.pincode].filter(Boolean).join(", ");
  const candidates = [geo.farmAddress, pickup?.farmerLocation, pickup?.pickupLocation, fromGeo].filter(
    (v) => typeof v === "string" && v.trim()
  );
  if (!candidates.length) return "";
  return candidates.sort((a, b) => b.split(",").length - a.split(",").length || b.length - a.length)[0];
}

function isCentreIncoming(pickup) {
  const status = String(pickup?.status || "").toUpperCase();
  if (["IN_TRANSIT", "ARRIVED_AT_CENTRE", "PICKED_UP", "PICKUP_CONFIRMED"].includes(status)) return true;
  return status === "COLLECTION_CENTRE_RECEIVED" && String(pickup?.receiving?.status || "").toUpperCase() !== "RECEIVED";
}

function pickupPath(pickup, isIncoming) {
  const receive = isIncoming || isCentreIncoming(pickup);
  return receive ? `/manager/pickups/${pickup.id}/receive` : `/manager/pickups/${pickup.id}`;
}

function orderPath(pickup) {
  const id = pickup.orderDisplayId || pickup.orderId;
  const params = new URLSearchParams();
  if (pickup.farmerId) params.set("farmerId", pickup.farmerId);
  params.set("from", "pickups");
  return `/manager/orders/detail/${encodeURIComponent(id)}?${params.toString()}`;
}

function Fact({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg bg-[#F8FAF8] px-2.5 py-2">
      <p className="text-[10px] font-semibold text-[#6B7280]">{label}</p>
      <p className="mt-0.5 break-words text-[13px] font-bold text-[#1F2937]">{value || "—"}</p>
    </div>
  );
}

function PickupCard({ pickup, isIncoming, onView, onAssign }) {
  const unit = pickup.unit || "Kg";
  const assigned = Boolean(pickup.driverId || pickup.driverName);
  const map = gradeDetailMap(pickup);
  const location = pickupLocation(pickup);

  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
      <div className="mb-2">
        <StatusBadge status={pickup.status} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-bold text-[#1F2937]">{pickup.farmerName || "Farmer"}</p>
        <p className="mt-0.5 break-words text-[11px] font-semibold text-[#6B7280]">{location || "Location not set"}</p>
      </div>
      <div className="mt-2 min-w-0">
        <p className="truncate text-[13px] font-bold text-[#1F2937]">
          {pickup.productName || "Produce"}
          {pickup.variety ? <span className="font-semibold text-[#6B7280]"> · {pickup.variety}</span> : null}
        </p>
        <CopyId
          value={pickup.orderDisplayId || pickup.orderId}
          className="mt-0.5"
          textClassName="font-mono text-[11px] text-emerald-700"
          breakAll
        />
      </div>
      <div className="mt-1.5 flex min-w-0 items-center justify-between gap-2 text-[11px] text-[#6B7280]">
        <span>
          Order <span className="font-semibold text-[#1F2937]">{shortDate(pickupOrderDate(pickup))}</span>
        </span>
        <span>
          Pickup <span className="font-semibold text-[#1F2937]">{shortDate(pickup.pickupDate)}</span>
        </span>
        <span>
          Time <span className="font-semibold text-[#1F2937]">{formatTime12h(pickup.pickupTime)}</span>
        </span>
      </div>
      <div className="mt-2 overflow-hidden rounded-lg border border-[#E5E7EB]">
        <div className="grid grid-cols-3 bg-[#F8FAF8] px-2 py-1 text-[10px] font-bold text-[#6B7280]">
          <span>Grade</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Rate</span>
        </div>
        {DEFAULT_GRADES.map((g) => {
          const row = map[g] || { qty: 0, rate: 0, unit };
          return (
            <div key={g} className="grid grid-cols-3 items-center border-t border-[#E5E7EB] px-2 py-1 text-[12px]">
              <span className="font-semibold text-[#1F2937]">{g}</span>
              <span className="text-right font-semibold tabular-nums">{formatQty(row.qty, row.unit || unit)}</span>
              <span className="text-right font-semibold tabular-nums">{formatRate(row.rate, row.qty)}</span>
            </div>
          );
        })}
      </div>
      {assigned ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Fact label="Driver" value={pickup.driverName} />
          <Fact label="Vehicle" value={pickup.vehicleNumber} />
        </div>
      ) : null}
      <div className="mt-3 flex gap-1">
        <button type="button" className={`${EXCEL_BTN} flex-1`} onClick={onView}>
          View
        </button>
        <button
          type="button"
          className={`${isIncoming || pickup.status === "READY_FOR_PICKUP" ? EXCEL_BTN_PRIMARY : EXCEL_BTN} flex-1`}
          onClick={onAssign}
        >
          {isIncoming || isCentreIncoming(pickup) ? "Receive" : pickup.status === "READY_FOR_PICKUP" ? "Assign Driver" : "Open"}
        </button>
      </div>
    </article>
  );
}

function groupByBatch(pickups) {
  const seen = new Map();
  const cards = [];
  for (const p of pickups) {
    const bid = String(p.collectionBatchId || p.lotId || "").trim();
    if (!bid) {
      cards.push({ type: "order", pickup: p, id: p.id });
      continue;
    }
    if (!seen.has(bid)) {
      const group = { type: "batch", batchId: bid, pickups: [], id: bid };
      seen.set(bid, group);
      cards.push(group);
    }
    seen.get(bid).pickups.push(p);
  }
  return cards;
}

function IncomingBatchCard({ batchId, pickups, onOpen, onScan, showScan = true }) {
  const first = pickups[0] || {};
  const driver = first.driver || {};
  const driverId = first.driverId || driver.id || driver.driverId || "";
  const vehicleId = formatVehicleId(first.vehicleId || driver.vehicleId, first.vehicleNumber || driver.vehicleNumber);
  const farmers = [...new Set(pickups.map((p) => p.farmerName).filter(Boolean))];
  const products = [...new Set(pickups.map((p) => p.productName).filter(Boolean))];
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusBadge status={first.status} />
          <span className="text-xs font-medium text-[#6B7280]">
            {pickups.length} order{pickups.length === 1 ? "" : "s"} in this batch
          </span>
        </div>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Lot / Batch ID</p>
        <CopyId
          value={batchId}
          className="mt-1"
          textClassName="break-all font-mono text-[15px] font-bold leading-snug text-[#217346]"
          breakAll
        />
        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Driver ID</p>
            <CopyId value={driverId} className="mt-0.5" textClassName="break-all font-mono text-[12px] font-semibold text-[#1F2937]" breakAll />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Vehicle ID</p>
            <CopyId value={vehicleId} className="mt-0.5" textClassName="break-all font-mono text-[12px] font-semibold text-[#1F2937]" breakAll />
          </div>
        </div>
        <p className="mt-2 text-[12px] font-semibold text-[#1F2937]">{farmers.join(", ") || "—"}</p>
        <p className="mt-0.5 text-[11px] text-[#6B7280]">{products.join(" · ") || "—"}</p>
      </div>
      <div className={`${showScan ? "grid grid-cols-2 gap-2" : ""} border-t border-slate-100 bg-[#F8FAF8] p-3`}>
        {showScan ? (
          <button type="button" className={`${EXCEL_BTN_PRIMARY} !min-h-10`} onClick={onScan}>
            Scan QR
          </button>
        ) : null}
        <button type="button" className={`${showScan ? EXCEL_BTN : EXCEL_BTN_PRIMARY} !min-h-10 w-full`} onClick={onOpen}>
          View details
        </button>
      </div>
    </article>
  );
}

export default function ManagerPickupsPage({ mode = "ready" }) {
  const meta = COPY[mode] || COPY.ready;
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [product, setProduct] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [scanError, setScanError] = useState("");

  usePolling(() => {
    getManagerPickups({ filter: meta.filter })
      .then((data) => setGroups(data?.farmers || []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [meta.filter], 5000);

  const isIncoming = meta.filter === "incoming" || meta.filter === "centre";
  const isAll = meta.filter === "all";
  const isBatchView = isIncoming || isAll;
  const pickups = useMemo(() => {
    const all = groups.flatMap((g) => g.pickups || []);
    if (meta.filter === "today") {
      return all.filter((p) => !DONE_TODAY_STATUSES.has(String(p.status || "").toUpperCase()));
    }
    if (meta.filter === "incoming" || meta.filter === "centre") {
      return all.filter((p) => String(p.receiving?.status || "").toUpperCase() !== "RECEIVED");
    }
    return all;
  }, [groups, meta.filter]);
  const batchFrom = meta.filter === "all" ? "all" : meta.filter === "centre" ? "centre" : "incoming";
  const openBatch = (batchId, batchPickups) => {
    navigate(`/manager/pickups/batches/${encodeURIComponent(batchId)}`, {
      state: { batchId, pickups: batchPickups, from: batchFrom },
    });
  };
  const farmerOptions = useMemo(() => {
    const map = new Map();
    pickups.forEach((p) => {
      const id = String(p.farmerId || "");
      if (!id || map.has(id)) return;
      map.set(id, p.farmerName || id);
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [pickups]);
  const productOptions = useMemo(() => {
    const set = new Set(pickups.map((p) => String(p.productName || "").trim()).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [pickups]);
  const filtered = useMemo(
    () => pickups.filter((p) => pickupMatches(p, { q, farmerId, product, pickupDate })),
    [pickups, q, farmerId, product, pickupDate]
  );
  const batchCards = useMemo(() => (isBatchView ? groupByBatch(filtered) : []), [isBatchView, filtered]);
  const hasFilter = Boolean(q || farmerId || product || pickupDate);

  const openScanned = (value) => {
    if (isBatchQrPayload(value)) {
      const batchId = parseBatchQrPayload(value);
      if (batchId) {
        const card = batchCards.find((c) => c.type === "batch" && c.batchId === batchId);
        setScanOpen(false);
        setScanError("");
        navigate(`/manager/pickups/batches/${encodeURIComponent(batchId)}`, {
          state: card ? { batchId, pickups: card.pickups, from: batchFrom } : { from: batchFrom },
        });
        return;
      }
    }
    const orderId = parseOrderQrPayload(value);
    const match = pickups.find((p) => {
      const oid = String(p.orderDisplayId || p.orderId || "");
      const qr = String(p.qrPayload || "");
      return (
        (orderId && oid && (oid === orderId || oid.includes(orderId) || orderId.includes(oid))) ||
        (qr && String(value).includes(qr)) ||
        (oid && String(value).includes(oid))
      );
    });
    if (match) {
      setScanOpen(false);
      setScanError("");
      navigate(pickupPath(match, isIncoming));
      return;
    }
    setScanError("QR does not match a batch or order.");
  };

  const FILTER = `${EXCEL_INPUT} !min-h-9 !py-1.5 !text-xs`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>{meta.title}</h1>
        <p className={EXCEL_PAGE_SUB}>{meta.sub}</p>
        </div>
        {isIncoming ? (
          <button type="button" className={EXCEL_BTN_PRIMARY} onClick={() => { setScanError(""); setScanOpen(true); }}>
            Scan QR
          </button>
        ) : null}
      </div>
      {isBatchView && scanError ? (
        <div className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{scanError}</div>
      ) : null}

      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[11rem] flex-1 sm:max-w-xs">
          <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">Search</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Farmer, location, order, product, batch…"
            className={FILTER}
          />
        </label>
        <label className="min-w-[9rem] flex-1 sm:max-w-[11rem]">
          <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">Farmer</span>
          <select value={farmerId} onChange={(e) => setFarmerId(e.target.value)} className={FILTER}>
            <option value="">All farmers</option>
            {farmerOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[9rem] flex-1 sm:max-w-[11rem]">
          <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">Product</span>
          <select value={product} onChange={(e) => setProduct(e.target.value)} className={FILTER}>
            <option value="">All products</option>
            {productOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[8.5rem]">
          <span className="mb-0.5 block text-[10px] font-semibold text-[#6B7280]">Pickup date</span>
          <input
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            className={FILTER}
          />
        </label>
        <button type="button" className={`${EXCEL_BTN} !min-h-9 !px-2.5 !text-[11px]`} onClick={() => setPickupDate(todayISODate())}>
          Today
        </button>
        <button type="button" className={`${EXCEL_BTN} !min-h-9 !px-2.5 !text-[11px]`} onClick={() => setPickupDate(yesterdayISODate())}>
          Yesterday
        </button>
        {hasFilter ? (
          <button
            type="button"
            className={`${EXCEL_BTN} !min-h-9 !px-2.5 !text-[11px]`}
            onClick={() => {
              setQ("");
              setFarmerId("");
              setProduct("");
              setPickupDate("");
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-xs text-[#6B7280]">Loading pickups…</p>
      ) : pickups.length === 0 ? (
        <EmptyState title="No pickups" description={meta.empty} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matching pickups" description="No orders match this filter. Clear filters to see all." />
      ) : isBatchView ? (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {batchCards.map((card) => {
              if (card.type === "batch") {
                const canScan = isIncoming || card.pickups.some(isCentreIncoming);
                return (
                  <IncomingBatchCard
                    key={card.id}
                    batchId={card.batchId}
                    pickups={card.pickups}
                    showScan={canScan}
                    onOpen={() => openBatch(card.batchId, card.pickups)}
                    onScan={() => { setScanError(""); setScanOpen(true); }}
                  />
                );
              }
              const p = card.pickup;
              return (
                <PickupCard
                  key={p.id}
                  pickup={p}
                  isIncoming={isIncoming}
                  onView={() => navigate(orderPath(p))}
                  onAssign={() => navigate(pickupPath(p, isIncoming))}
                />
              );
            })}
          </div>
        ) : (
        <>
          <div className="space-y-2.5 md:hidden">
            {filtered.map((p) => (
              <PickupCard
                key={p.id}
                pickup={p}
                isIncoming={isIncoming}
                onView={() => navigate(orderPath(p))}
                onAssign={() => navigate(pickupPath(p, isIncoming))}
              />
            ))}
            </div>

          <div className="hidden w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm md:block">
            <table className="w-full table-fixed border-collapse text-[10px] sm:text-[11px]">
              <colgroup>
                <col className="w-[4%]" />
                <col className="w-[13%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[13%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[7%]" />
                <col className="w-[15%]" />
              </colgroup>
                <thead>
                  <tr>
                  <th className={TH}>#</th>
                  <th className={TH}>Farmer</th>
                  <th className={TH}>Location</th>
                  <th className={TH}>Order ID</th>
                  <th className={TH}>Product</th>
                  <th className={TH}>Order Date</th>
                  <th className={TH}>Pickup Date</th>
                  <th className={TH}>Pickup Time</th>
                  <th className={TH}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                {filtered.map((p, idx) => {
                  const id = p.orderDisplayId || p.orderId || p.id;
                  const location = pickupLocation(p);
                  const secondLabel = p.status === "READY_FOR_PICKUP" ? "Assign Driver" : isIncoming || isCentreIncoming(p) ? "Receive" : "Open";
                  return (
                    <tr key={p.id} className="hover:bg-[#F9FBF9]">
                      <td className={`${TD} min-w-0 text-center align-middle text-[#9CA3AF]`}>{idx + 1}</td>
                      <td className={`${TD} min-w-0 align-middle font-semibold`} title={p.farmerName || ""}>
                        <span className="block truncate">{p.farmerName || "—"}</span>
                      </td>
                      <td className={`${TD} min-w-0 align-middle text-[#6B7280]`} title={location || ""}>
                        <span className="block truncate">{location || "—"}</span>
                      </td>
                      <td className={`${TD} min-w-0 align-middle sm:text-[11px]`}>
                        <span className="inline-flex w-full min-w-0 items-center gap-0.5">
                          <span className="min-w-0 truncate font-mono text-[10px] font-semibold text-[#217346] sm:text-[11px]" title={id}>
                            {id}
                          </span>
                          <CopyButton value={id} />
                        </span>
                      </td>
                      <td className={`${TD} min-w-0 align-middle`} title={[p.productName, p.variety].filter(Boolean).join(" · ")}>
                        <span className="block truncate font-semibold text-[#1F2937]">{p.productName || "Product"}</span>
                        {p.variety ? <span className="mt-0.5 block truncate text-[9px] leading-tight text-[#6B7280]">{p.variety}</span> : null}
                      </td>
                      <td className={`${TD} min-w-0 text-center align-middle`}>{shortDate(pickupOrderDate(p))}</td>
                      <td className={`${TD} min-w-0 text-center align-middle`}>{shortDate(p.pickupDate)}</td>
                      <td className={`${TD} min-w-0 text-center align-middle`}>{formatTime12h(p.pickupTime)}</td>
                      <td className={`${TD} min-w-0 bg-white px-1 py-1 align-middle`}>
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          <button type="button" className={ACTION_BTN} onClick={() => navigate(orderPath(p))}>
                            View
                            </button>
                            <button
                              type="button"
                            className={p.status === "READY_FOR_PICKUP" || isIncoming ? ACTION_BTN_PRIMARY : ACTION_BTN}
                            onClick={() => navigate(pickupPath(p, isIncoming))}
                            >
                            {secondLabel}
                            </button>
                        </div>
                          </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
          </div>
        </>
      )}
      {isBatchView ? (
        <QrScanModal
          open={scanOpen}
          title="Scan batch QR"
          hint="Align the batch QR inside the frame"
          onClose={() => setScanOpen(false)}
          onScan={openScanned}
          error={scanError}
        />
      ) : null}
    </div>
  );
}
