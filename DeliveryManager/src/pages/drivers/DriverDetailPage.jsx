import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { managerApi } from "../../api/managerApi";
import { PageShell } from "../../components/layout/ManagerLayout";

export default function DriverDetailPage() {
  const { driverId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const todayStr = (() => {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
    } catch (_) {
      return new Date().toISOString().slice(0, 10);
    }
  })();

  const [perfOpen, setPerfOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [shiftsOpen, setShiftsOpen] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadDriverDetails = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const res = await managerApi.getDriverDetails(driverId);
      if (res.data?.success) {
        setData(res.data.data);
        setError("");
      } else if (!silent) {
        setError(res.data?.message || "Failed to load driver details");
      }
    } catch (err) {
      if (!silent) {
        setError(err.response?.data?.message || "Error loading driver details");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [driverId]);

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      // Month range gives enough days to pick from date-wise
      const res = await managerApi.getDriverActivityHistory(driverId, "month");
      if (res.data?.success) {
        setHistory(res.data.data);
      }
    } catch (_) {
      /* non-fatal */
    } finally {
      setHistoryLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    loadDriverDetails();
  }, [loadDriverDetails]);

  useEffect(() => {
    if (perfOpen) loadHistory();
  }, [perfOpen, loadHistory]);

  // Live refresh online minutes / status while viewing
  useEffect(() => {
    const t = setInterval(() => {
      loadDriverDetails({ silent: true });
      if (perfOpen && selectedDate === todayStr) loadHistory();
    }, 15000);
    return () => clearInterval(t);
  }, [loadDriverDetails, loadHistory, perfOpen, selectedDate, todayStr]);

  const handleToggleActive = async () => {
    try {
      setActionLoading(true);
      setActionMessage("");
      const res = await managerApi.toggleRiderActive(driverId);
      if (res.data?.success) {
        setActionMessage(res.data.message || "Driver status updated");
        await loadDriverDetails();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update driver status");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return "—";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (_) {
      return "—";
    }
  };

  const formatDayTitle = (dateStr, dayLabel) => {
    if (!dateStr) return dayLabel || "—";
    try {
      const d = new Date(`${dateStr}T12:00:00+05:30`);
      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });
    } catch (_) {
      return `${dayLabel || ""} ${dateStr}`.trim();
    }
  };

  const maskAccountNumber = (accNo) => {
    if (!accNo || typeof accNo !== "string" || accNo.trim().length === 0) {
      return "Not provided";
    }
    const clean = accNo.trim();
    if (clean.length <= 4) return clean;
    const lastFour = clean.slice(-4);
    return `XXXX XXXX ${lastFour}`;
  };

  if (loading) {
    return (
      <PageShell>
        <div className="space-y-4">
          <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
          <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
        </div>
      </PageShell>
    );
  }

  if (error || !data) {
    return (
      <PageShell>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <h3 className="text-base font-bold text-rose-800">
            {error || "Driver Not Found"}
          </h3>
          <p className="mt-1 text-xs text-rose-600">
            Could not retrieve details for driver ID: {driverId}
          </p>
          <button
            onClick={() => navigate("/drivers")}
            className="mt-4 inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            ← Back to Approved Drivers
          </button>
        </div>
      </PageShell>
    );
  }

  const {
    driver = {},
    todayPerformance = {},
    wallet = {},
    documents = {},
    selfie = {},
    bankDetails = {},
    todayShifts = [],
    recentShifts = [],
  } = data;

  const isOnline = driver.status === "online";
  const isOnDelivery = driver.status === "on_delivery";
  const isApproved = (driver.verificationStatus || "approved") === "approved";
  const isPending = driver.verificationStatus === "pending";
  const isRejected = driver.verificationStatus === "rejected";

  const docList = [
    { key: "aadhaar", label: "Aadhaar Card", meta: documents.aadhaar },
    { key: "pan", label: "PAN Card", meta: documents.pan },
    { key: "passport", label: "Passport", meta: documents.passport },
    { key: "license", label: "Driving License", meta: documents.license },
    { key: "rc", label: "Vehicle RC", meta: documents.rc },
    { key: "insurance", label: "Vehicle Insurance", meta: documents.insurance },
    { key: "selfie", label: "Selfie Capture", meta: selfie },
  ];

  const hasLocation =
    driver.currentLocation?.lat != null && driver.currentLocation?.lng != null;

  const dayFromHistory = (history?.days || []).find((d) => d.date === selectedDate);
  const isSelectedToday = selectedDate === todayStr;

  // Prefer live todayPerformance when selected date is today; else history day row
  const dayPerf = isSelectedToday
    ? {
        date: todayStr,
        dayLabel: "Today",
        isToday: true,
        earnings: todayPerformance.earnings || 0,
        walletEarned: todayPerformance.earnings || 0,
        onlineTime: todayPerformance.onlineTime || "0m",
        onlineMinutes: todayPerformance.onlineMinutes || 0,
        trips: todayPerformance.completedOrders || 0,
        shiftsBooked: todayPerformance.shiftsBooked || 0,
        shiftsCompleted: todayPerformance.completedShifts || 0,
        shifts: dayFromHistory?.shifts?.length
          ? dayFromHistory.shifts
          : (todayShifts || []).map((s) => ({
              shiftName: s.shiftName || s.shiftType,
              shiftType: s.shiftType,
              startTime: s.startTime,
              endTime: s.endTime,
              bookingStatus: s.bookingStatus,
            })),
      }
    : dayFromHistory || {
        date: selectedDate,
        earnings: 0,
        walletEarned: 0,
        onlineTime: "0m",
        trips: 0,
        shiftsBooked: 0,
        shiftsCompleted: 0,
        shifts: [],
      };

  const availableDates = (history?.days || [])
    .map((d) => d.date)
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));

  return (
    <PageShell>
      {actionMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage("")}
            className="text-emerald-600 hover:text-emerald-800"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            onClick={() => navigate("/drivers")}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 mb-1"
          >
            ← Back to Drivers
          </button>
          <h1 className="text-xl font-black text-slate-900">
            {driver.name || "Delivery Partner"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{driver.phone || "—"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold border ${
              isOnDelivery
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : isOnline
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {isOnDelivery ? "On Delivery" : isOnline ? "Online" : "Offline"}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold border ${
              isApproved
                ? "bg-sky-50 text-sky-700 border-sky-200"
                : isPending
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : isRejected
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {driver.verificationStatus || "approved"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDriverDetails()}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
            <button
              onClick={handleToggleActive}
              disabled={actionLoading}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold text-white shadow-2xs transition active:scale-95 ${
                driver.isActive !== false
                  ? "bg-slate-800 hover:bg-slate-900"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {actionLoading
                ? "Updating…"
                : driver.isActive !== false
                ? "Deactivate Driver"
                : "Activate Driver"}
            </button>
          </div>
        </div>
      </div>

      {/* Performance — closed by default; pick a date to view that day only */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setPerfOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50/80 transition"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900">
                Day-wise Performance
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {perfOpen
                  ? `Showing ${formatDayTitle(selectedDate, "")}`
                  : "Closed — tap to open & pick a date"}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400 shrink-0">
            {perfOpen ? "Close ▲" : "Open ▼"}
          </span>
        </button>

        {perfOpen && (
          <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select date
                </span>
                <input
                  type="date"
                  max={todayStr}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value || todayStr);
                    setShiftsOpen(false);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-400"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(todayStr);
                  setShiftsOpen(false);
                }}
                className={`rounded-xl px-3 py-2 text-[11px] font-bold border transition ${
                  isSelectedToday
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Today
              </button>
              {availableDates.slice(0, 7).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setSelectedDate(d);
                    setShiftsOpen(false);
                  }}
                  className={`rounded-xl px-2.5 py-2 text-[10px] font-bold border transition ${
                    selectedDate === d
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {d === todayStr ? "Today" : d.slice(5)}
                </button>
              ))}
            </div>

            <p className="text-xs font-bold text-slate-800">
              {formatDayTitle(selectedDate, dayPerf.dayLabel)}
              {isSelectedToday ? (
                <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  Live
                </span>
              ) : null}
            </p>

            {historyLoading && !isSelectedToday ? (
              <div className="h-20 rounded-xl bg-slate-100 animate-pulse" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Earnings
                  </p>
                  <p className="text-base font-black text-emerald-600 mt-1">
                    ₹{dayPerf.walletEarned ?? dayPerf.earnings ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Trips
                  </p>
                  <p className="text-base font-black text-slate-900 mt-1">
                    {dayPerf.trips || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/80">
                    Online Time
                  </p>
                  <p className="text-base font-black text-emerald-700 mt-1">
                    {dayPerf.onlineTime || "0m"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Shifts Booked
                  </p>
                  <p className="text-base font-black text-slate-900 mt-1">
                    {dayPerf.shiftsBooked || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Completed Shifts
                  </p>
                  <p className="text-base font-black text-slate-900 mt-1">
                    {dayPerf.shiftsCompleted || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Status
                  </p>
                  <p className="text-sm font-bold text-slate-800 capitalize mt-1">
                    {isSelectedToday ? driver.status || "offline" : "—"}
                  </p>
                </div>
              </div>
            )}

            {/* Shift slots for selected day — also closed by default */}
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <button
                type="button"
                onClick={() => setShiftsOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 text-left hover:bg-slate-100/80"
              >
                <span className="text-[11px] font-bold text-slate-700">
                  Shift slots this day ({(dayPerf.shifts || []).length})
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  {shiftsOpen ? "Close ▲" : "Open ▼"}
                </span>
              </button>
              {shiftsOpen && (
                <div className="bg-white">
                  {(dayPerf.shifts || []).length === 0 ? (
                    <p className="px-3 py-3 text-[11px] text-slate-400 font-medium">
                      No shift booked on this date.
                    </p>
                  ) : (
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                        <tr>
                          <th className="py-2 px-3">Shift</th>
                          <th className="py-2 px-3">Slot</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dayPerf.shifts.map((s, i) => (
                          <tr key={i}>
                            <td className="py-2 px-3 font-bold text-slate-800">
                              {s.shiftName || s.shiftType || "Shift"}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-700">
                              {s.startTime} – {s.endTime}
                            </td>
                            <td className="py-2 px-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                  s.bookingStatus === "COMPLETED"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : s.bookingStatus === "ACTIVE"
                                    ? "bg-sky-50 text-sky-700 border-sky-200"
                                    : s.bookingStatus === "CANCELLED"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                {s.bookingStatus || "UPCOMING"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Driver Overview</h2>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between gap-3">
              <span className="font-medium text-slate-500">Full Name</span>
              <span className="font-bold text-slate-900 text-right">
                {driver.name || "—"}
              </span>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <span className="font-medium text-slate-500">Phone</span>
              <span className="font-bold text-slate-900">{driver.phone || "—"}</span>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <span className="font-medium text-slate-500">Vehicle</span>
              <span className="font-bold text-slate-900 capitalize">
                {driver.vehicleType || "—"}
              </span>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <span className="font-medium text-slate-500">Area / Hub</span>
              <span className="font-bold text-slate-900">
                {driver.area || driver.city || "—"}
              </span>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <span className="font-medium text-slate-500">Wallet Balance</span>
              <span className="font-black text-emerald-600">
                ₹{wallet.balance || 0}
              </span>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <span className="font-medium text-slate-500">Lifetime Earnings</span>
              <span className="font-bold text-slate-900">
                ₹{wallet.lifetimeEarnings || 0}
              </span>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <span className="font-medium text-slate-500">Account Active</span>
              <span className="font-bold text-slate-900">
                {driver.isActive !== false ? "Yes" : "No"}
              </span>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <span className="font-medium text-slate-500">Joined</span>
              <span className="font-medium text-slate-700">
                {formatDate(driver.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3">
              Location & Bank
            </h2>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between gap-3">
                <span className="font-medium text-slate-500">Current Location</span>
                <span className="font-medium text-slate-700 text-right">
                  {hasLocation
                    ? `${Number(driver.currentLocation.lat).toFixed(5)}, ${Number(
                        driver.currentLocation.lng
                      ).toFixed(5)}`
                    : "Not available"}
                </span>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <span className="font-medium text-slate-500">Bank Name</span>
                <span className="font-bold text-slate-900">
                  {bankDetails.bankName || "Not provided"}
                </span>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <span className="font-medium text-slate-500">Account Holder</span>
                <span className="font-bold text-slate-900">
                  {bankDetails.accountHolderName || "Not provided"}
                </span>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <span className="font-medium text-slate-500">Account Number</span>
                <span className="font-mono font-bold text-slate-800">
                  {maskAccountNumber(bankDetails.accountNumber)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <span className="font-medium text-slate-500">IFSC</span>
                <span className="font-mono font-bold text-slate-800">
                  {bankDetails.ifsc || "—"}
                </span>
              </div>
            </div>
          </div>

          {todayShifts.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-800 mb-2">
                Today's Shift Slots
              </h3>
              <div className="space-y-1.5">
                {todayShifts.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] flex justify-between"
                  >
                    <span className="font-bold text-slate-800">
                      {s.shiftName || s.shiftType}
                    </span>
                    <span className="font-mono text-slate-600">
                      {s.startTime} – {s.endTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Documents</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase">
              <tr>
                <th className="py-2.5 px-4">Document</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docList.map((doc) => {
                const status = doc.meta?.verificationStatus || doc.meta?.status || "missing";
                const url = doc.meta?.url || doc.meta?.imageUrl || doc.meta?.imageBase64;
                return (
                  <tr key={doc.key} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{doc.label}</td>
                    <td className="py-3 px-4 capitalize font-medium text-slate-700">
                      {status}
                    </td>
                    <td className="py-3 px-4">
                      {url ? (
                        <a
                          href={
                            String(url).startsWith("data:") || String(url).startsWith("http")
                              ? url
                              : `data:image/jpeg;base64,${url}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          View Document ↗
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900">Shift Information & Bookings</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase">
              <tr>
                <th className="py-2.5 px-4">Shift Name</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Time Slot</th>
                <th className="py-2.5 px-4">Booking Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentShifts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">
                    No shift bookings recorded for this delivery partner.
                  </td>
                </tr>
              ) : (
                recentShifts.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{s.shiftName || s.shiftType}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{s.dateString}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {s.startTime} - {s.endTime}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          s.bookingStatus === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : s.bookingStatus === "ACTIVE"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : s.bookingStatus === "CANCELLED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {s.bookingStatus || "UPCOMING"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Live Activity Timeline</h2>
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex justify-between">
            <span className="font-medium text-slate-500">Current Status</span>
            <span className="font-bold text-slate-900 capitalize">{driver.status || "offline"}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="font-medium text-slate-500">Last Status Change</span>
            <span className="font-medium text-slate-700">{formatDate(driver.lastStatusAt)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="font-medium text-slate-500">Last Online At</span>
            <span className="font-medium text-slate-700">{formatDate(driver.lastOnlineAt)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="font-medium text-slate-500">Last Offline At</span>
            <span className="font-medium text-slate-700">{formatDate(driver.lastOfflineAt)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="font-medium text-slate-500">Last Seen At</span>
            <span className="font-medium text-slate-700">{formatDate(driver.lastSeenAt)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="font-medium text-slate-500">Last Order Assigned At</span>
            <span className="font-medium text-slate-700">{formatDate(driver.lastOrderAssignedAt)}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="font-medium text-slate-500">Active Order ID</span>
            <span className="font-mono font-bold text-slate-800">
              {driver.activeOrderId ? `ORD_${driver.activeOrderId}` : "No active order"}
            </span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
