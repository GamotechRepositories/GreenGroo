import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { managerApi } from "../../api/managerApi";
import { PageShell } from "../../components/layout/ManagerLayout";
import { AttendanceBadge, apiError, formatDateTime, todayIst } from "./fullTimeUi";

export default function FullTimeAttendancePage() {
  const [date, setDate] = useState(todayIst());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await managerApi.getFullTimeAttendance(date);
      setData(res.data);
    } catch (err) {
      setError(apiError(err, "Failed to load attendance"));
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data?.summary || {};
  const stats = [
    ["Full-Time Drivers", summary.total, "text-slate-900"],
    ["Present", summary.present, "text-emerald-600"],
    ["Absent", summary.absent, "text-rose-600"],
    ["Pending", summary.pending, "text-amber-600"],
    ["Off Day", (summary.offDay || 0) + (summary.notRequired || 0), "text-slate-500"],
  ];

  return (
    <PageShell
      title="Full-Time Attendance"
      subtitle="Daily attendance marked by Full-Time drivers from the app, validated against the dark store location."
    >
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</label>
          <input
            type="date"
            value={date}
            max={todayIst()}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(([label, value, cls]) => (
          <div key={label} className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className={`mt-0.5 text-lg font-black ${cls}`}>{loading ? "…" : value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
        {loading ? (
          <div className="py-16 text-center text-xs font-semibold text-slate-400">Loading…</div>
        ) : !data?.rows?.length ? (
          <div className="py-16 text-center text-sm font-bold text-slate-600">No Full-Time drivers yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black text-xs font-bold uppercase tracking-wider text-white">
                <tr>
                  <th className="px-4 py-2">Driver</th>
                  <th className="px-4 py-2">Required Time</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Marked At</th>
                  <th className="px-4 py-2">Distance</th>
                  <th className="px-4 py-2">This Month</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.rows.map((row) => (
                  <tr key={row.driver.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/drivers/${row.driver.id}`} className="font-bold text-slate-900 hover:text-emerald-700">
                        {row.driver.name}
                      </Link>
                      <div className="text-[11px] text-slate-400">{row.driver.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {row.requirement ? (
                        <>
                          <span className="font-bold">
                            {row.requirement.startTime} – {row.requirement.endTime}
                          </span>
                          <div className="text-[11px] text-slate-400">
                            {row.requirement.source === "shift" ? `Shift: ${row.requirement.shiftName}` : "Store rule"}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400">No rule / shift set</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AttendanceBadge status={row.attendance.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{formatDateTime(row.attendance.markedAt)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {row.attendance.distanceFromStoreMeters != null
                        ? `${Math.round(row.attendance.distanceFromStoreMeters)}m`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                      {row.monthPresentDays} days
                      {row.minimumAttendanceDays != null && (
                        <span className="text-slate-400"> / min {row.minimumAttendanceDays}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}
