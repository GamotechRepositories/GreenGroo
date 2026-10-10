import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getManagerDrivers } from "../../api/farmerApi";
import CopyId, { formatVehicleId } from "../../components/ui/CopyId";
import EmptyState from "../../components/ui/EmptyState";
import { pickupStatusLabel } from "../../components/pickup/PickupTimeline";
import { EXCEL_PANEL, EXCEL_INPUT, EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB } from "../../utils/excelStyles";

const STATUS_COLORS = {
  Available: "bg-green-100 text-green-700",
  "On Duty": "bg-blue-100 text-blue-700",
  Inactive: "bg-gray-100 text-gray-600",
  "Off Duty": "bg-amber-100 text-amber-700",
};

const ACTIVE_STAGES = [
  "DRIVER_ASSIGNED",
  "PICKUP_SCHEDULED",
  "DISPATCHED",
  "DRIVER_ARRIVED",
  "ORDER_VERIFIED",
  "QR_VERIFIED",
  "PICKED_UP",
  "PICKUP_CONFIRMED",
  "IN_TRANSIT",
  "ARRIVED_AT_CENTRE",
];
const STARTED_FROM = ACTIVE_STAGES.indexOf("DISPATCHED");
const DONE = new Set(["COMPLETED", "COLLECTION_CENTRE_RECEIVED", "RECEIVED_AT_COLLECTION_CENTRE"]);
const OFF = new Set(["Inactive", "Off Duty", "Offline"]);

const stop = (e) => e.stopPropagation();

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "D";
  return ((parts[0][0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

function toTime(value) {
  const t = new Date(value || 0).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function driverWork(driver) {
  const tasks = Array.isArray(driver?.tasks) ? driver.tasks : [];
  const active = tasks.filter((t) => ACTIVE_STAGES.includes(t.status));
  const started = active
    .filter((t) => ACTIVE_STAGES.indexOf(t.status) >= STARTED_FROM)
    .sort((a, b) => toTime(b.updatedAt) - toTime(a.updatedAt));
  const current = started[0] || null;
  const waiting = active.length - started.length;
  const batches = [...new Set(active.map((t) => t.collectionBatchId).filter(Boolean))];
  const unbatched = active.filter((t) => !t.collectionBatchId).length;
  const completed = tasks.filter((t) => DONE.has(t.status)).length;
  const off = OFF.has(driver?.status);
  const status = off ? (driver.status === "Offline" ? "Off Duty" : driver.status) : active.length ? "On Duty" : "Available";

  let label;
  let detail;
  if (current) {
    label = pickupStatusLabel(current.status);
    detail = [current.farmerName, current.productName, current.orderDisplayId || current.orderId].filter(Boolean).join(" · ");
  } else if (active.length) {
    label = "Assigned · not started";
    detail = `${waiting} order${waiting === 1 ? "" : "s"} waiting to start`;
  } else {
    label = off ? "Not working" : "Free";
    detail = "No active orders";
  }

  return { active, current, batches, unbatched, completed, total: tasks.length, status, label, detail };
}

function StatusChip({ status }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[status] || "bg-slate-100 text-slate-600"}`}>
      {status || "—"}
    </span>
  );
}

function CurrentStatus({ work }) {
  const tone = work.current ? "text-blue-700" : work.active.length ? "text-amber-700" : "text-[#6B7280]";
  return (
    <div className="min-w-0">
      <p className={`truncate text-xs font-semibold ${tone}`}>{work.label}</p>
      <p className="truncate text-[10px] text-[#6B7280]" title={work.detail}>{work.detail}</p>
      {work.current?.collectionBatchId ? (
        <p className="truncate font-mono text-[10px] text-[#217346]" title={work.current.collectionBatchId}>
          {work.current.collectionBatchId}
        </p>
      ) : null}
    </div>
  );
}

function ActiveOrders({ work }) {
  return (
    <div>
      <p className="text-sm font-bold text-[#1F2937]">{work.active.length}</p>
      <p className="whitespace-nowrap text-[10px] text-[#6B7280]">
        {work.completed} completed · {work.total} total
      </p>
    </div>
  );
}

function Batches({ work }) {
  if (!work.batches.length && !work.unbatched) return <p className="text-xs text-[#9CA3AF]">—</p>;
  return (
    <div className="min-w-0">
      <p className="text-sm font-bold text-[#1F2937]">{work.batches.length}</p>
      {work.batches.slice(0, 2).map((b) => (
        <p key={b} className="truncate font-mono text-[10px] text-[#217346]" title={b}>
          {b}
        </p>
      ))}
      {work.batches.length > 2 ? <p className="text-[10px] text-[#6B7280]">+{work.batches.length - 2} more</p> : null}
      {work.unbatched ? <p className="text-[10px] text-amber-700">{work.unbatched} not in batch</p> : null}
    </div>
  );
}

function DriverCard({ driver, onOpen }) {
  const id = driver.driverId || driver.id;
  const work = driverWork(driver);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="cursor-pointer rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm hover:border-[#217346]"
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] text-[11px] font-bold text-[#217346]">
          {initials(driver.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[13px] font-bold text-[#1F2937]">{driver.name || "—"}</p>
            <StatusChip status={work.status} />
          </div>
          <span onClick={stop}>
            <CopyId value={id} className="mt-0.5" textClassName="break-all font-mono text-[11px] font-semibold text-[#217346]" breakAll />
          </span>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-[#6B7280]">
        <p>
          Mobile{" "}
          {driver.mobile ? (
            <a href={`tel:${driver.mobile}`} onClick={stop} className="font-semibold text-[#217346]">
              {driver.mobile}
            </a>
          ) : (
            "—"
          )}
        </p>
        <p className="truncate">
          Vehicle <span className="font-semibold text-[#1F2937]">{driver.vehicleNumber || "—"}</span>
        </p>
      </div>
      <div className="mt-2 rounded-lg bg-[#F8FAF8] px-2.5 py-2">
        <CurrentStatus work={work} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-slate-100 px-2.5 py-1.5">
          <p className="text-[10px] font-semibold text-[#6B7280]">Active orders</p>
          <ActiveOrders work={work} />
        </div>
        <div className="rounded-lg border border-slate-100 px-2.5 py-1.5">
          <p className="text-[10px] font-semibold text-[#6B7280]">Batches</p>
          <Batches work={work} />
        </div>
      </div>
      <p className="mt-2 text-right text-[11px] font-semibold text-[#217346]">View details ›</p>
    </article>
  );
}

export default function ManagerDriversPage() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearchQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getManagerDrivers({ q: searchQ })
      .then((data) => {
        if (!alive) return;
        setDrivers(Array.isArray(data) ? data : data?.drivers || []);
      })
      .catch(() => {
        if (alive) setDrivers([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [searchQ]);

  const rows = useMemo(() => drivers.map((d) => ({ driver: d, work: driverWork(d) })), [drivers]);
  const shown = statusFilter ? rows.filter((r) => r.work.status === statusFilter) : rows;

  const stats = useMemo(
    () => ({
      total: rows.length,
      available: rows.filter((r) => r.work.status === "Available").length,
      onDuty: rows.filter((r) => r.work.status === "On Duty").length,
      inactive: rows.filter((r) => OFF.has(r.work.status)).length,
    }),
    [rows]
  );

  const TH = "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#6B7280]";
  const TD = "px-3 py-3 align-top";

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>All Drivers</h1>
          <p className={EXCEL_PAGE_SUB}>Drivers you can assign to pickups · click a driver to see orders and batches</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/vendor/drivers"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-3.5 text-xs font-bold text-white shadow-xs"
          >
            All Drivers ({stats.total})
          </Link>
          <Link
            to="/vendor/drivers/pickup-orders"
            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            All Pickup Orders →
          </Link>
          <Link
            to="/vendor/drivers/add"
            className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-700 px-3.5 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs transition"
          >
            + Add Driver
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {[
          { label: "Total Drivers", value: stats.total, color: "text-[#217346]" },
          { label: "Available", value: stats.available, color: "text-emerald-700" },
          { label: "On Duty", value: stats.onDuty, color: "text-blue-700" },
          { label: "Inactive / Off Duty", value: stats.inactive, color: "text-slate-600" },
        ].map((s) => (
          <div key={s.label} className={`${EXCEL_PANEL} min-w-0 p-2.5 sm:p-3`}>
            <p className="text-[11px] leading-tight text-[#6B7280]">{s.label}</p>
            <p className={`mt-0.5 text-lg font-bold sm:text-xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, mobile, vehicle…"
          className={`${EXCEL_INPUT} sm:max-w-xs`}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${EXCEL_INPUT} sm:max-w-[10rem]`}>
          <option value="">All Status</option>
          {["Available", "On Duty", "Off Duty", "Inactive"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-xs text-[#6B7280]">Loading drivers…</p>
      ) : shown.length === 0 ? (
        <EmptyState title="No drivers" description={drivers.length ? "No drivers match this filter." : "Drivers added by the vendor will appear here for pickup assignment."} />
      ) : (
        <>
          <div className="space-y-2.5 md:hidden">
            {shown.map(({ driver }) => (
              <DriverCard key={driver.driverId || driver.id} driver={driver} onOpen={() => navigate(`/vendor/drivers/${driver.driverId || driver.id}`)} />
            ))}
          </div>
          <div className={`hidden overflow-x-auto md:block ${EXCEL_PANEL}`}>
            <table className="w-full min-w-[860px] table-fixed text-xs">
              <colgroup>
                <col className="w-[17%]" />
                <col className="w-[11%]" />
                <col className="w-[13%]" />
                <col className="w-[27%]" />
                <col className="w-[11%]" />
                <col className="w-[12%]" />
                <col className="w-[9%]" />
              </colgroup>
              <thead className="bg-slate-50">
                <tr>
                  {["Driver", "Mobile", "Vehicle", "Current Status", "Active Orders", "Batches", "Status"].map((h) => (
                    <th key={h} className={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map(({ driver: d, work }) => {
                  const id = d.driverId || d.id;
                  const vehicleId = formatVehicleId(d.vehicleId, d.vehicleNumber);
                  return (
                    <tr key={id} onClick={() => navigate(`/vendor/drivers/${id}`)} className="cursor-pointer border-t border-slate-100 hover:bg-[#F3F8F4]">
                      <td className={TD}>
                        <p className="truncate text-[13px] font-semibold text-[#1F2937]" title={d.name}>
                          {d.name || "—"}
                        </p>
                        <span onClick={stop}>
                          <CopyId value={id} textClassName="font-mono text-[10px] font-semibold text-[#217346]" />
                        </span>
                      </td>
                      <td className={TD}>
                        {d.mobile ? (
                          <a href={`tel:${d.mobile}`} onClick={stop} className="font-semibold text-[#217346]">
                            {d.mobile}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className={TD}>
                        <p className="truncate font-semibold text-[#1F2937]">{d.vehicleNumber || "—"}</p>
                        <p className="truncate text-[10px] text-[#6B7280]" title={vehicleId}>
                          {[d.vehicleType, vehicleId].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </td>
                      <td className={TD}>
                        <CurrentStatus work={work} />
                      </td>
                      <td className={TD}>
                        <ActiveOrders work={work} />
                      </td>
                      <td className={TD}>
                        <Batches work={work} />
                      </td>
                      <td className={TD}>
                        <StatusChip status={work.status} />
                        <p className="mt-1 text-[10px] font-semibold text-[#217346]">View ›</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
