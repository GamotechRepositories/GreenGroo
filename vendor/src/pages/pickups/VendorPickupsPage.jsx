import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";
import { pickupLiveLabel } from "../../components/pickup/PickupTimeline";
import CopyId, { CopyButton, formatVehicleId } from "../../components/ui/CopyId";
import { usePolling } from "../../hooks/usePolling";

const COPY = {
  ready: {
    title: "Ready for Pickup",
    sub: "Orders waiting for a driver.",
    filter: "ready",
    empty: "No orders are waiting for driver assignment.",
  },
  assigned: {
    title: "Assigned Pickups",
    sub: "Pickups with a driver assigned.",
    filter: "assigned",
    empty: "No assigned pickups.",
  },
  assignments: {
    title: "Ready for Pickup",
    sub: "Orders waiting for a driver.",
    filter: "ready",
    empty: "No orders are waiting for driver assignment.",
  },
  today: {
    title: "Today's Pickups",
    sub: "Scheduled for today and not yet picked up.",
    filter: "today",
    empty: "No pickups scheduled today.",
  },
  incoming: {
    title: "Incoming Pickups",
    sub: "Batches not yet received at the collection centre, with live status.",
    filter: "incoming",
    empty: "No incoming pickups yet.",
  },
  centre: {
    title: "Pickups at Centre",
    sub: "Batches that have reached the collection centre and are not yet received.",
    filter: "centre",
    empty: "No pickups at the collection centre.",
  },
  all: {
    title: "All Pickups",
    sub: "Every pickup, grouped by lot / batch.",
    filter: "all",
    empty: "No pickups yet.",
  },
  active: {
    title: "All Pickups",
    sub: "Every pickup, grouped by lot / batch.",
    filter: "all",
    empty: "No pickups yet.",
  },
  history: {
    title: "All Pickups",
    sub: "Every pickup, grouped by lot / batch.",
    filter: "all",
    empty: "No pickups yet.",
  },
};

function isAtCentre(pickup) {
  const status = String(pickup?.status || "").toUpperCase();
  if (["IN_TRANSIT", "ARRIVED_AT_CENTRE", "PICKED_UP", "PICKUP_CONFIRMED"].includes(status)) return true;
  return status === "COLLECTION_CENTRE_RECEIVED" && String(pickup?.receiving?.status || "").toUpperCase() !== "RECEIVED";
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

function BatchCard({ batchId, pickups, onOpen }) {
  const first = pickups[0] || {};
  const driver = first.driver || {};
  const driverId = first.driverId || driver.id || driver.driverId || "";
  const vehicleId = formatVehicleId(first.vehicleId || driver.vehicleId, first.vehicleNumber || driver.vehicleNumber);
  const farmers = [...new Set(pickups.map((p) => p.farmerName).filter(Boolean))];
  const products = [...new Set(pickups.map((p) => p.productName).filter(Boolean))];
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex max-w-full rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[11px] font-semibold leading-tight text-[#217346]">
            {pickupLiveLabel(first) || "—"}
          </span>
          <span className="text-xs font-medium text-gray-500">
            {pickups.length} order{pickups.length === 1 ? "" : "s"} in this batch
          </span>
        </div>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400">Lot / Batch ID</p>
        <CopyId
          value={batchId}
          className="mt-1"
          textClassName="break-all font-mono text-[15px] font-bold leading-snug text-[#217346]"
          breakAll
        />
        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Driver ID</p>
            <CopyId value={driverId} className="mt-0.5" textClassName="break-all font-mono text-[12px] font-semibold text-gray-800" breakAll />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Vehicle ID</p>
            <CopyId value={vehicleId} className="mt-0.5" textClassName="break-all font-mono text-[12px] font-semibold text-gray-800" breakAll />
          </div>
        </div>
        <p className="mt-2 text-[12px] font-semibold text-gray-900">{farmers.join(", ") || "—"}</p>
        <p className="mt-0.5 text-[11px] text-gray-500">{products.join(" · ") || "—"}</p>
      </div>
      <div className="border-t border-gray-100 bg-[#F8FAF8] p-3">
        <button
          type="button"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#217346] px-3 text-xs font-semibold text-white hover:bg-[#1a5c38]"
          onClick={onOpen}
        >
          View details
        </button>
      </div>
    </article>
  );
}

export default function VendorPickupsPage({ mode = "ready" }) {
  const meta = COPY[mode] || COPY.ready;
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const isBatchView = ["incoming", "centre", "all"].includes(mode);

  usePolling(() => {
    vendorApi
      .getPickups({ filter: meta.filter })
      .then((r) => setRows(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [meta.filter], 5000);

  const pickups = useMemo(() => {
    if (mode === "incoming" || mode === "centre") {
      return rows.filter((p) => String(p.receiving?.status || "").toUpperCase() !== "RECEIVED");
    }
    return rows;
  }, [rows, mode]);
  const cards = useMemo(() => (isBatchView ? groupByBatch(pickups) : []), [isBatchView, pickups]);

  const openPickup = (p) => {
    const receive = mode === "centre" || mode === "incoming" || isAtCentre(p);
    navigate(receive ? `/vendor/collection-centre/${p.id}` : `/vendor/pickups/${p.id}`);
  };

  const openBatch = (batchId, batchPickups) => {
    navigate(`/vendor/batches/${encodeURIComponent(batchId)}`, {
      state: { batchId, pickups: batchPickups, from: mode },
    });
  };

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{meta.title}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{meta.sub}</p>
      </div>
      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : pickups.length === 0 ? (
        <div className="border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-400">{meta.empty}</div>
      ) : isBatchView ? (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {cards.map((card) => {
            if (card.type === "batch") {
              return (
                <BatchCard
                  key={card.id}
                  batchId={card.batchId}
                  pickups={card.pickups}
                  onOpen={() => openBatch(card.batchId, card.pickups)}
                />
              );
            }
            const p = card.pickup;
            return (
              <article key={p.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <span className="inline-flex rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[11px] font-semibold text-[#217346]">
                  {pickupLiveLabel(p) || "—"}
                </span>
                <p className="mt-3 text-sm font-bold text-gray-900">{p.farmerName || "Farmer"}</p>
                <CopyId value={p.orderDisplayId} className="mt-1" textClassName="font-mono text-[12px] font-semibold text-[#217346]" breakAll />
                <p className="mt-1 text-xs text-gray-500">
                  {p.productName} · {p.packedQuantity || p.expectedQuantity} {p.unit}
                </p>
                <button
                  type="button"
                  className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#217346] px-3 text-xs font-semibold text-white"
                  onClick={() => openPickup(p)}
                >
                  {p.status === "READY_FOR_PICKUP" ? "Assign Driver" : isAtCentre(p) ? "Receive" : "Open"}
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 bg-white">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                {["Order ID", "Lot / Batch ID", "Farmer", "Location", "Product", "Qty", "Packages", "Pickup", "Centre", "Driver", "Status", ""].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pickups.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <CopyId value={p.orderDisplayId} textClassName="font-semibold text-gray-900" />
                  </td>
                  <td className="px-3 py-2">
                    {p.collectionBatchId ? (
                      <span className="inline-flex max-w-full min-w-0 items-center gap-0.5">
                        <button
                          type="button"
                          className="min-w-0 truncate font-mono text-[10px] font-semibold text-[#217346] hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            openBatch(p.collectionBatchId, [p]);
                          }}
                        >
                          {p.collectionBatchId}
                        </button>
                        <CopyButton value={p.collectionBatchId} />
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2">{p.farmerName}</td>
                  <td className="px-3 py-2 max-w-[140px] truncate">{p.farmerLocation || "—"}</td>
                  <td className="px-3 py-2">{p.productName}</td>
                  <td className="px-3 py-2">{p.packedQuantity || p.expectedQuantity} {p.unit}</td>
                  <td className="px-3 py-2">{p.packageCount || 0}</td>
                  <td className="px-3 py-2">{p.scheduledDate || "—"} {p.scheduledTime || ""}</td>
                  <td className="px-3 py-2">{p.collectionCentreName || "—"}</td>
                  <td className="px-3 py-2">{p.driverName || "Unassigned"}</td>
                  <td className="px-3 py-2">{pickupLiveLabel(p)}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="font-semibold text-[#217346]"
                      onClick={() => openPickup(p)}
                    >
                      {mode === "ready" && p.status === "READY_FOR_PICKUP" ? "Assign Driver" : "Open"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
