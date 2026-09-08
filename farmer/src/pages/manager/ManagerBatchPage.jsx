import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getManagerBatch } from "../../api/farmerApi";
import CopyId, { formatVehicleId } from "../../components/ui/CopyId";
import { pickupLiveLabel, pickupStatusLabel } from "../../components/pickup/PickupTimeline";
import { usePolling } from "../../hooks/usePolling";
import { EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB } from "../../utils/excelStyles";
import { formatOrderDate } from "../../utils/orderDisplay";

const DEFAULT_GRADES = ["Grade A", "Grade B", "Grade C"];
const TH =
  "border border-[#C5D4C8] bg-[#E8F0EA] px-1 py-1.5 text-center text-[9px] font-bold leading-tight text-[#374151] sm:px-1.5 sm:text-[10px]";
const TD = "border border-[#E5E7EB] px-1 py-1.5 text-[10px] leading-tight text-[#1F2937] sm:px-1.5 sm:text-[11px]";
const GRADE_COLORS = {
  "Grade A": { head: "border-[#A7F3D0] bg-[#D1FAE5] text-[#065F46]", cell: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]" },
  "Grade B": { head: "border-[#BFDBFE] bg-[#DBEAFE] text-[#1E40AF]", cell: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]" },
  "Grade C": { head: "border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]", cell: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]" },
};

function gradeTone(label = "") {
  return GRADE_COLORS[label] || { head: "border-[#E5E7EB] bg-[#F3F4F6] text-[#374151]", cell: "border-[#E5E7EB] bg-[#F9FAFB] text-[#1F2937]" };
}

function shortDate(value) {
  if (!value) return "—";
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const [y, m, d] = raw.slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    const full = formatOrderDate(value);
    return full && full !== "—" ? full : "—";
  }
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
    if (Array.isArray(p.grades) && p.grades.length) fromProducts.push(...p.grades);
    else if (p.grade || p.quantity) fromProducts.push({ label: p.grade || "Grade A", quantity: p.quantity });
  });
  return fromProducts;
}

function gradeDetailMap(order) {
  const map = {};
  const unit = order.unit || "Kg";
  gradeListFrom(order).forEach((g) => {
    const label = String(g.label || g.name || g.grade || "").trim();
    if (!label) return;
    if (!map[label]) map[label] = { qty: 0, unit };
    map[label].qty += Number(g.quantity || 0);
  });
  if (!Object.keys(map).length) {
    const label = String(order.grade || "Grade A").split(",")[0].trim() || "Grade A";
    map[label] = {
      qty: Number(order.packedQuantity || order.confirmedQuantity || order.expectedQuantity || order.orderedQuantity || 0),
      unit,
    };
  }
  return map;
}

function formatQty(qty, unit) {
  const n = Number(qty || 0);
  if (!(n > 0)) return <span className="font-semibold text-[#9CA3AF]">×</span>;
  return (
    <span>
      {n.toLocaleString("en-IN")}
      <span className="ml-0.5 text-[8px] text-[#6B7280]">{unit || "Kg"}</span>
    </span>
  );
}

function Fact({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">{label}</p>
      {/\bid\s*$/i.test(String(label || "").trim()) ? (
        <CopyId
          value={value}
          className="mt-0.5"
          textClassName="break-all font-mono text-xs font-semibold text-[#1F2937]"
          breakAll
        />
      ) : (
        <p className="mt-0.5 break-words text-xs font-semibold text-[#1F2937]">{value || "—"}</p>
      )}
    </div>
  );
}

function payloadFromPickups(batchId, pickups = []) {
  const first = pickups[0] || {};
  const driver = first.driver || {};
  return {
    batchId,
    lotId: batchId,
    liveStatus: pickupLiveLabel(first) || "On the way to centre",
    status: first.status || "",
    collectionCentreName: first.collectionCentreName || "",
    driverName: first.driverName || driver.name || "",
    driverId: first.driverId || driver.id || driver.driverId || "",
    vehicleNumber: first.vehicleNumber || driver.vehicleNumber || "",
    vehicleType: first.vehicleType || driver.vehicleType || "",
    vehicleId: formatVehicleId(first.vehicleId || driver.vehicleId, first.vehicleNumber || driver.vehicleNumber),
    farmers: [...new Set(pickups.map((p) => p.farmerName).filter(Boolean))],
    products: [...new Set(pickups.map((p) => p.productName).filter(Boolean))],
    pickups,
  };
}

export default function ManagerBatchPage() {
  const { batchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const id = decodeURIComponent(String(batchId || "").trim());
  const seedPickups = Array.isArray(location.state?.pickups) ? location.state.pickups : [];
  const [data, setData] = useState(() =>
    seedPickups.length ? payloadFromPickups(location.state?.batchId || id, seedPickups) : null
  );
  const [error, setError] = useState("");

  usePolling(() => {
    getManagerBatch(id)
      .then((payload) => {
        const apiOrders = Array.isArray(payload?.pickups) ? payload.pickups : [];
        setData((prev) => {
          if (apiOrders.length >= (prev?.pickups?.length || 0)) return payload;
          if (prev?.pickups?.length) return { ...payload, pickups: prev.pickups, orderCount: prev.pickups.length };
          return payload;
        });
        setError("");
      })
      .catch((err) => {
        if (!seedPickups.length) setError(err?.message || "Batch not found");
      });
  }, [id], 5000);

  const orders = data?.pickups || [];
  const first = orders[0] || {};
  const vehicleId = formatVehicleId(
    data?.vehicleId || first.vehicleId || first.driver?.vehicleId,
    data?.vehicleNumber || first.vehicleNumber || first.driver?.vehicleNumber
  );
  const gradeColumns = useMemo(() => {
    const set = new Set(DEFAULT_GRADES);
    orders.forEach((o) => Object.keys(gradeDetailMap(o)).forEach((label) => set.add(label)));
    const extras = Array.from(set).filter((g) => !DEFAULT_GRADES.includes(g)).sort();
    return [...DEFAULT_GRADES, ...extras];
  }, [orders]);

  if (!data && !error) return <p className="text-xs text-[#6B7280]">Loading batch…</p>;
  if (!data) return <p className="text-xs text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <Link to="/farmer/manager/pickups/incoming" className="text-xs font-semibold text-[#217346]">
        ← Incoming at Centre
      </Link>
      <div>
        <span className="inline-flex max-w-full rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[11px] font-semibold leading-tight text-[#217346]">
          {pickupStatusLabel(data.status || data.liveStatus) || pickupLiveLabel(first) || "On the way to centre"}
        </span>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Lot / Batch ID</p>
        <CopyId
          value={data.batchId}
          className="mt-0.5"
          textClassName={`${EXCEL_PAGE_TITLE} break-all font-mono text-[#217346]`}
          breakAll
        />
        <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Driver ID</p>
            <CopyId
              value={data.driverId || data.pickups?.[0]?.driverId}
              textClassName="break-all font-mono text-[11px] font-semibold text-[#1F2937]"
              breakAll
            />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7280]">Vehicle ID</p>
            <CopyId
              value={vehicleId}
              textClassName="break-all font-mono text-[11px] font-semibold text-[#1F2937]"
              breakAll
            />
          </div>
        </div>
        <p className={EXCEL_PAGE_SUB}>{orders.length} order{orders.length === 1 ? "" : "s"} in this batch</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:gap-3 sm:p-4 sm:grid-cols-3">
        <Fact label="Orders" value={String(orders.length)} />
        <Fact label="Collection Centre" value={data.collectionCentreName} />
        <Fact label="Driver" value={data.driverName} />
        <Fact label="Driver ID" value={data.driverId || data.pickups?.[0]?.driverId} />
        <Fact label="Vehicle ID" value={vehicleId} />
        <Fact label="Vehicle" value={[data.vehicleNumber, data.vehicleType].filter(Boolean).join(" · ")} />
        <Fact label="Farmers" value={(data.farmers || []).join(", ")} />
        <Fact label="Products" value={(data.products || []).join(", ")} />
      </div>

      <p className="text-sm font-bold text-slate-900">
        Orders in this batch
        <span className="ml-1 font-semibold text-[#6B7280]">({orders.length})</span>
      </p>

      {!orders.length ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-[#9CA3AF]">
          No orders in this batch.
        </p>
      ) : (
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <table className="w-full min-w-[760px] border-collapse text-[11px]">
          <thead>
            <tr>
              <th className={TH}>#</th>
              <th className={TH}>Order ID</th>
              <th className={TH}>Farmer</th>
              <th className={TH}>Product</th>
              <th className={TH}>Order Date</th>
              <th className={TH}>Pickup Date</th>
              <th className={TH}>Pickup Time</th>
              {gradeColumns.map((g) => (
                <th key={g} className={`border px-1 py-1.5 text-center text-[9px] font-bold ${gradeTone(g).head}`}>{g}</th>
              ))}
              <th className={TH}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => {
              const id = order.orderDisplayId || order.orderId;
              const map = gradeDetailMap(order);
              const unit = order.unit || "Kg";
              return (
                <tr key={order.id} className="hover:bg-[#F9FBF9]">
                  <td className={`${TD} text-center text-[#9CA3AF]`}>{idx + 1}</td>
                  <td className={TD}>
                    <CopyId value={id} textClassName="font-mono text-[10px] font-semibold text-[#217346]" />
                  </td>
                  <td className={`${TD} font-semibold`}>{order.farmerName || "—"}</td>
                  <td className={TD}>
                    <span className="font-semibold">{order.productName || "Product"}</span>
                    {order.variety ? <span className="block text-[9px] text-[#6B7280]">{order.variety}</span> : null}
                  </td>
                  <td className={`${TD} text-center`}>{shortDate(order.orderDate || order.createdAt)}</td>
                  <td className={`${TD} text-center`}>{shortDate(order.pickupDate || order.scheduledDate)}</td>
                  <td className={`${TD} text-center`}>{formatTime12h(order.pickupTime || order.scheduledTime)}</td>
                  {gradeColumns.map((g) => {
                    const row = map[g] || { qty: 0, unit };
                    return (
                      <td key={`${order.id}-${g}`} className={`border px-1 py-1.5 text-center tabular-nums ${gradeTone(g).cell}`}>
                        {formatQty(row.qty, row.unit || unit)}
                      </td>
                    );
                  })}
                  <td className={`${TD} text-center`}>
                    <button
                      type="button"
                      className="inline-flex h-7 items-center rounded-md border border-[#217346] bg-[#217346] px-2 text-[10px] font-semibold text-white"
                      onClick={() => navigate(`/farmer/manager/pickups/${order.id}/receive`)}
                    >
                      Receive
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
