import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../../components/layout/ManagerLayout";
import { managerApi } from "../../api/managerApi";

const getTodayString = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const formatDateWithDay = (dateStr) => {
  if (!dateStr) return { formatted: "", dayName: "" };
  try {
    const d = new Date(dateStr + "T00:00:00");
    const formatted = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const dayName = d.toLocaleDateString("en-GB", { weekday: "long" });
    return { formatted, dayName };
  } catch (e) {
    return { formatted: dateStr, dayName: "" };
  }
};

export default function FullTimeShiftManagementPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [allShifts, setAllShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadShifts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await managerApi.getManagerSlots(selectedDate, { filter: "all" });
      // Filter client-side: only FULL_TIME shifts
      const all = res.data.shifts || [];
      setAllShifts(all.filter((s) => s.shiftCategory === "FULL_TIME"));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load shifts");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const currentDateObj = formatDateWithDay(getTodayString());
  const selectedDateObj = formatDateWithDay(selectedDate);

  return (
    <PageShell>
      {/* Info banner */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-start gap-2">
        <span>ℹ️</span>
        <span>
          Full-Time shifts are assigned to Full-Time drivers only. These shifts do <strong>not</strong> use per-KM earnings — drivers earn a fixed monthly salary instead.
        </span>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today</p>
          <div className="mt-0.5 flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-sm font-black text-slate-900">{currentDateObj.formatted}</span>
            <span className="text-[11px] font-medium text-slate-400">({currentDateObj.dayName})</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Selected Date</p>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200/90 bg-slate-50/70 px-2 py-1 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none cursor-pointer"
          />
        </div>

        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full-Time Shifts</p>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-base font-black text-slate-900">{allShifts.length}</span>
            <span className="text-[11px] font-medium text-slate-400">shifts</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Actions</p>
          <Link
            to="/shifts/fulltime/create"
            className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 transition whitespace-nowrap"
          >
            + Create Full-Time Shift
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xs text-[12px] text-slate-500">
        Showing Full-Time shifts for <span className="font-bold text-slate-800">{selectedDateObj.formatted}</span>
        {" "}({selectedDateObj.dayName}). Only shifts with <code className="bg-slate-100 px-1 rounded text-[11px]">shiftCategory=FULL_TIME</code> are listed here.
      </div>

      {/* Shifts Table */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-semibold text-slate-400">Loading…</div>
        ) : allShifts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <p className="text-2xl">📅</p>
            <p className="text-sm font-bold text-slate-700">No Full-Time shifts for this date.</p>
            <p className="text-xs text-slate-400">
              Pick another date or click &quot;+ Create Full-Time Shift&quot;.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black text-white text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-2">SHIFT</th>
                  <th className="px-5 py-2">DATE</th>
                  <th className="px-5 py-2">TIME</th>
                  <th className="px-5 py-2">STATUS</th>
                  <th className="px-5 py-2">AVAILABLE</th>
                  <th className="px-5 py-2">RIDERS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allShifts.map((shift) => {
                  const dateObj = formatDateWithDay(shift.dateString);
                  return (shift.slots || []).map((slot, index) => {
                    const available = Math.max(0, slot.capacity - slot.bookedCount);
                    return (
                      <tr key={`${shift.id}-${slot.id || index}`} className="hover:bg-emerald-50/40 transition">
                        <td className="px-5 py-4 font-bold text-slate-900">{shift.name || shift.shiftName}</td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{dateObj.formatted}</div>
                          <div className="text-[11px] text-slate-400">{dateObj.dayName}</div>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-900">
                          {slot.startTime} – {slot.endTime}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 border-emerald-200">
                            Full-Time
                          </span>
                        </td>
                        <td className="px-5 py-4 font-black text-emerald-600">
                          {available} / {slot.capacity}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-700">
                          {slot.bookedCount || 0} joined
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}
