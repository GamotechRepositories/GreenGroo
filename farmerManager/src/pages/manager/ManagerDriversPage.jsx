import { useEffect, useMemo, useState } from "react";
import { getManagerDrivers } from "../../api/farmerApi";
import CopyId, { formatVehicleId } from "../../components/ui/CopyId";
import EmptyState from "../../components/ui/EmptyState";
import {
  EXCEL_PANEL,
  EXCEL_INPUT,
  EXCEL_PAGE_TITLE,
  EXCEL_PAGE_SUB,
} from "../../utils/excelStyles";

const STATUS_COLORS = {
  Active: "bg-green-100 text-green-700",
  Available: "bg-green-100 text-green-700",
  "On Duty": "bg-blue-100 text-blue-700",
  "On Pickup": "bg-blue-100 text-blue-700",
  Inactive: "bg-gray-100 text-gray-600",
  "Off Duty": "bg-amber-100 text-amber-700",
  Offline: "bg-amber-100 text-amber-700",
};

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "D";
  return ((parts[0][0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

function statusClass(status) {
  return STATUS_COLORS[status] || "bg-slate-100 text-slate-600";
}

function DriverCard({ driver }) {
  const id = driver.driverId || driver.id;
  const vehicleId = formatVehicleId(driver.vehicleId, driver.vehicleNumber);
  const active = Number(driver.activePickups || 0);

  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] text-[11px] font-bold text-[#217346]">
          {initials(driver.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[13px] font-bold text-[#1F2937]">{driver.name || "—"}</p>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(driver.status)}`}>
              {driver.status || "—"}
            </span>
          </div>
          <CopyId value={id} className="mt-0.5" textClassName="break-all font-mono text-[11px] font-semibold text-[#217346]" breakAll />
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-[#6B7280]">
        <p>Mobile <span className="font-semibold text-[#1F2937]">{driver.mobile || "—"}</span></p>
        <p>Area <span className="font-semibold text-[#1F2937]">{driver.assignedArea || "—"}</span></p>
        <p className="col-span-2">
          Vehicle <span className="font-semibold text-[#1F2937]">{[driver.vehicleNumber, driver.vehicleType].filter(Boolean).join(" · ") || "—"}</span>
        </p>
        <p className="col-span-2 min-w-0">
          Vehicle ID{" "}
          {vehicleId ? (
            <CopyId value={vehicleId} className="inline" textClassName="break-all font-mono text-[11px] font-semibold text-[#1F2937]" breakAll />
          ) : (
            <span className="font-semibold text-[#1F2937]">—</span>
          )}
        </p>
        <p>Active pickups <span className="font-semibold text-[#1F2937]">{active}</span></p>
      </div>
      {driver.mobile ? (
        <a href={`tel:${driver.mobile}`} className="mt-2 inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-[#217346]">
          Call driver
        </a>
      ) : null}
    </article>
  );
}

export default function ManagerDriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getManagerDrivers({ q, status: statusFilter })
      .then((data) => {
        if (!alive) return;
        const rows = Array.isArray(data) ? data : data?.drivers || [];
        setDrivers(rows);
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
  }, [q, statusFilter]);

  const stats = useMemo(() => {
    const available = drivers.filter((d) => d.status === "Active" || d.status === "Available").length;
    const onDuty = drivers.filter((d) => d.status === "On Duty" || d.status === "On Pickup").length;
    const inactive = drivers.filter((d) => d.status === "Inactive" || d.status === "Off Duty" || d.status === "Offline").length;
    return { total: drivers.length, available, onDuty, inactive };
  }, [drivers]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>All Drivers</h1>
        <p className={EXCEL_PAGE_SUB}>Drivers you can assign to pickups</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {[
          { label: "Total Drivers", value: stats.total, color: "text-[#217346]" },
          { label: "Available", value: stats.available, color: "text-emerald-700" },
          { label: "On Duty", value: stats.onDuty, color: "text-blue-700" },
          { label: "Inactive", value: stats.inactive, color: "text-slate-600" },
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${EXCEL_INPUT} sm:max-w-[10rem]`}
        >
          <option value="">All Status</option>
          {["Active", "On Duty", "Off Duty", "Inactive"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-xs text-[#6B7280]">Loading drivers…</p>
      ) : drivers.length === 0 ? (
        <EmptyState title="No drivers" description="Drivers added by the vendor will appear here for pickup assignment." />
      ) : (
        <>
          <div className="space-y-2.5 md:hidden">
            {drivers.map((d) => (
              <DriverCard key={d.driverId || d.id} driver={d} />
            ))}
          </div>
          <div className={`hidden overflow-x-auto md:block ${EXCEL_PANEL}`}>
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-left">
                  {["Driver", "Mobile", "Vehicle", "Area", "Active", "Status"].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold text-[#6B7280]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => {
                  const id = d.driverId || d.id;
                  const vehicleId = formatVehicleId(d.vehicleId, d.vehicleNumber);
                  const active = Number(d.activePickups || 0);
                  return (
                    <tr key={id} className="border-t border-slate-100 hover:bg-[#F9FBF9]">
                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-[#1F2937]">{d.name || "—"}</p>
                        <CopyId value={id} textClassName="font-mono text-[10px] font-semibold text-[#217346]" />
                      </td>
                      <td className="px-3 py-2.5">
                        {d.mobile ? (
                          <a href={`tel:${d.mobile}`} className="font-semibold text-[#217346]">{d.mobile}</a>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-semibold">{d.vehicleNumber || "—"}</p>
                        <p className="font-mono text-[10px] text-[#6B7280]">{vehicleId || d.vehicleType || "—"}</p>
                      </td>
                      <td className="px-3 py-2.5">{d.assignedArea || "—"}</td>
                      <td className="px-3 py-2.5 font-semibold">{active}</td>
                      <td className="px-3 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(d.status)}`}>
                          {d.status || "—"}
                        </span>
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
