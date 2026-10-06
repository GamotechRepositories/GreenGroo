import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { managerApi } from "../../api/managerApi";
import {
  AttendanceBadge,
  EmploymentBadge,
  PayrollBreakdown,
  apiError,
  currentMonthIst,
  formatDateTime,
  formatDays,
  formatMoney,
  salarySourceLabel,
} from "./fullTimeUi";

/** Employment type control for every driver, plus the Full-Time profile section for Full-Time drivers. */
export default function FullTimeDriverPanel({ driverId, employmentType, onChanged }) {
  const isFullTime = employmentType === "FULL_TIME";
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [salaryDraft, setSalaryDraft] = useState("");
  const [notice, setNotice] = useState({ type: "", text: "" });

  const load = useCallback(async () => {
    if (!isFullTime) {
      setSummary(null);
      return;
    }
    setLoading(true);
    try {
      const res = await managerApi.getFullTimeDriver(driverId);
      setSummary(res.data?.driver || null);
      setSalaryDraft(res.data?.driver?.salaryOverride ?? "");
    } catch (err) {
      setNotice({ type: "error", text: apiError(err, "Failed to load Full-Time details") });
    } finally {
      setLoading(false);
    }
  }, [driverId, isFullTime]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, okText) => {
    setBusy(true);
    setNotice({ type: "", text: "" });
    try {
      const res = await fn();
      setNotice({ type: "ok", text: res?.data?.message || okText });
      return true;
    } catch (err) {
      setNotice({ type: "error", text: apiError(err, "Action failed") });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const changeType = async () => {
    const next = isFullTime ? "PART_TIME" : "FULL_TIME";
    const label = next === "FULL_TIME" ? "Full-Time" : "Part-Time";
    const warning =
      next === "FULL_TIME"
        ? "Full-Time drivers stop receiving automatic order offers and per-KM earnings; you assign their orders manually and they earn a monthly salary."
        : "The driver will be removed from Full-Time shifts and go back to slot booking, automatic offers and per-KM earnings.";
    if (!window.confirm(`Change this driver to ${label}?\n\n${warning}`)) return;
    const ok = await run(() => managerApi.setDriverEmploymentType(driverId, next), `Driver is now ${label}`);
    if (ok) onChanged?.();
  };

  const saveSalary = async () => {
    const ok = await run(
      () => managerApi.setFullTimeDriverSalary(driverId, salaryDraft === "" ? null : Number(salaryDraft)),
      "Salary updated"
    );
    if (ok) load();
  };

  const creditSalary = async () => {
    const month = currentMonthIst();
    const net = summary?.payroll?.netSalary ?? summary?.monthlySalary;
    const deductions = summary?.payroll?.totalDeductions || 0;
    const detail = deductions > 0 ? ` (after ${formatMoney(deductions)} leave / late deductions)` : "";
    if (!window.confirm(`Credit ${formatMoney(net)}${detail} salary for ${month} to the driver's wallet?`)) return;
    const ok = await run(() => managerApi.creditFullTimeSalary(driverId, { month }), "Salary credited");
    if (ok) {
      load();
      onChanged?.();
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-900">Employment Type</h2>
          <EmploymentBadge type={employmentType} />
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={changeType}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Change to {isFullTime ? "Part-Time" : "Full-Time"}
        </button>
      </div>

      {notice.text && (
        <div
          className={`rounded-xl border p-2.5 text-xs font-semibold ${
            notice.type === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {notice.text}
        </div>
      )}

      {isFullTime &&
        (loading && !summary ? (
          <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
        ) : summary ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Stat label="Monthly Salary" value={formatMoney(summary.monthlySalary)} accent="text-emerald-600">
                {salarySourceLabel(summary.salarySource)}
              </Stat>
              <Stat label="Dark Store" value={summary.darkStore?.name || "—"} />
              <Stat label="Shift" value={summary.shift?.name || "Not assigned"}>
                {summary.shift
                  ? `${summary.shift.startTime} – ${summary.shift.endTime} · ${formatDays(summary.shift.workingDays)}`
                  : summary.requirement
                    ? `Rule: ${summary.requirement.startTime} – ${summary.requirement.endTime}`
                    : ""}
              </Stat>
              <Stat label="Today's Attendance" value={<AttendanceBadge status={summary.attendance.status} />}>
                {summary.attendance.markedAt ? `Marked ${formatDateTime(summary.attendance.markedAt)}` : ""}
              </Stat>
              <Stat label="Assigned Orders" value={summary.activeAssignedOrders}>
                {summary.monthPresentDays} days present this month
              </Stat>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-slate-200 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">Salary</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder={
                      summary.shiftSalary != null
                        ? `Shift salary (${formatMoney(summary.shiftSalary)})`
                        : `Store default (${formatMoney(summary.storeDefaultSalary)})`
                    }
                    value={salaryDraft}
                    onChange={(e) => setSalaryDraft(e.target.value)}
                    className="w-56 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={saveSalary}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Save
                  </button>
                </div>
                {summary.payroll && (
                  <div className="rounded-lg bg-slate-50 p-2.5">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {summary.payroll.month} so far
                    </p>
                    <PayrollBreakdown payroll={summary.payroll} />
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
                  <span className="text-[11px] text-slate-500">Wallet balance: {formatMoney(summary.walletBalance)}</span>
                  {summary.salaryCreditedThisMonth ? (
                    <span className="text-[11px] font-bold text-emerald-700">
                      ✓ {currentMonthIst()} salary credited ({formatMoney(summary.salaryCreditedThisMonth.amount)})
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy || !(summary.monthlySalary > 0)}
                      onClick={creditSalary}
                      className="rounded-lg border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                    >
                      Credit {currentMonthIst()} salary to wallet
                    </button>
                  )}
                </div>
                {summary.salaryCredits?.length > 0 && (
                  <ul className="space-y-0.5 text-[11px] text-slate-500">
                    {summary.salaryCredits.slice(0, 6).map((c) => (
                      <li key={c.month}>
                        {c.month}: {formatMoney(c.amount)} · {formatDateTime(c.creditedAt)}
                        {c.breakdown &&
                          c.breakdown.leaveDeduction + c.breakdown.lateDeduction > 0 &&
                          ` · −${formatMoney(c.breakdown.leaveDeduction + c.breakdown.lateDeduction)} deducted`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">Assigned Orders</h3>
                  <Link to="/fulltime/assign-orders" className="text-[11px] font-bold text-emerald-700 hover:underline">
                    Assign orders →
                  </Link>
                </div>
                {summary.assignedOrders?.length ? (
                  <ul className="divide-y divide-slate-100 text-xs">
                    {summary.assignedOrders.map((o) => (
                      <li key={o.id} className="flex items-center justify-between py-1.5">
                        <Link to={`/orders/${o.id}`} className="font-bold text-slate-900 hover:text-emerald-700">
                          {o.orderNumber}
                          {o.isPreOrder && <span className="ml-1.5 text-[10px] text-amber-700">Pre-Order</span>}
                        </Link>
                        <span className="capitalize text-slate-500">{o.status.replace(/_/g, " ")}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400">No active assigned orders.</p>
                )}
              </div>
            </div>
          </>
        ) : null)}
    </div>
  );
}

function Stat({ label, value, accent = "text-slate-900", children }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className={`mt-0.5 text-sm font-black ${accent}`}>{value}</div>
      {children && <p className="mt-0.5 text-[10px] text-slate-500">{children}</p>}
    </div>
  );
}
