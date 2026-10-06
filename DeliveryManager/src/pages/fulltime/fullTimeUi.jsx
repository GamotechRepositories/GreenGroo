export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const todayIst = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

export const currentMonthIst = () => todayIst().slice(0, 7);

export const formatMoney = (n) => `₹${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

/** 135 → "2h 15m" */
export const formatMinutes = (mins) => {
  const n = Math.round(Number(mins) || 0);
  const h = Math.floor(n / 60);
  const m = n % 60;
  return [h ? `${h}h` : "", m ? `${m}m` : ""].filter(Boolean).join(" ") || "0m";
};

const SALARY_SOURCE_LABEL = { driver: "Driver override", shift: "Shift salary", store: "Store default" };
export const salarySourceLabel = (source) => SALARY_SOURCE_LABEL[source] || "Store default";

/** Compact "base − deductions = net" breakdown for a driver's month payroll. */
export function PayrollBreakdown({ payroll }) {
  if (!payroll) return null;
  const { leave, late } = payroll;
  return (
    <div className="space-y-1 text-[11px] text-slate-600">
      <Row label="Base salary" value={formatMoney(payroll.baseSalary)} />
      <Row label="Present / working days" value={`${payroll.presentDays} / ${payroll.scheduledWorkingDays}`} />
      {leave.enabled ? (
        <>
          <Row
            label="Leaves (paid / unpaid)"
            value={`${leave.taken} (${leave.paid} / ${leave.unpaid}) · ${leave.paidRemaining} paid left`}
          />
          {leave.deduction > 0 && (
            <Row
              label={`Unpaid leave × ${formatMoney(leave.deductionPerDay)}`}
              value={`−${formatMoney(leave.deduction)}`}
              danger
            />
          )}
        </>
      ) : (
        payroll.absentDays > 0 && <Row label="Absent days" value={`${payroll.absentDays} (no leave policy)`} />
      )}
      {late.enabled && (
        <Row
          label={`Late ${formatMinutes(late.afterMinutes)}+ × ${late.count}`}
          value={late.deduction > 0 ? `−${formatMoney(late.deduction)}` : formatMoney(0)}
          danger={late.deduction > 0}
        />
      )}
      <div className="flex justify-between border-t border-slate-100 pt-1 text-xs font-black text-slate-900">
        <span>Net salary</span>
        <span className="text-emerald-700">{formatMoney(payroll.netSalary)}</span>
      </div>
    </div>
  );
}

function Row({ label, value, danger }) {
  return (
    <div className="flex justify-between gap-3">
      <span>{label}</span>
      <span className={`font-bold ${danger ? "text-rose-600" : "text-slate-800"}`}>{value}</span>
    </div>
  );
}

/** "09:00 AM" → "09:00" for <input type="time"> */
export function to24h(value) {
  const s = String(value || "").trim().toUpperCase();
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!m) return "";
  let h = parseInt(m[1], 10);
  if (m[3] === "PM" && h < 12) h += 12;
  if (m[3] === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

export const formatDays = (days = []) =>
  days.length === 7 ? "Every day" : days.map((d) => DAYS[d]).filter(Boolean).join(", ") || "—";

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const ATTENDANCE_STYLES = {
  present: ["Present", "bg-emerald-100 text-emerald-800 border-emerald-200"],
  absent: ["Absent", "bg-rose-100 text-rose-700 border-rose-200"],
  pending: ["Pending", "bg-amber-100 text-amber-800 border-amber-200"],
  off_day: ["Off Day", "bg-slate-100 text-slate-600 border-slate-200"],
  not_required: ["Not Required", "bg-slate-100 text-slate-600 border-slate-200"],
};

export function AttendanceBadge({ status }) {
  const [label, cls] = ATTENDANCE_STYLES[status] || ATTENDANCE_STYLES.pending;
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cls}`}>
      {label}
    </span>
  );
}

export function EmploymentBadge({ type }) {
  const full = type === "FULL_TIME";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
        full ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
      }`}
    >
      {full ? "🟢 Full-Time" : "🔵 Part-Time"}
    </span>
  );
}

export function DayPicker({ value = [], onChange }) {
  const toggle = (d) =>
    onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d].sort((a, b) => a - b));
  return (
    <div className="flex flex-wrap gap-2">
      {DAYS.map((day, i) => (
        <button
          key={day}
          type="button"
          onClick={() => toggle(i)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
            value.includes(i)
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {day}
        </button>
      ))}
    </div>
  );
}

export const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none";
export const labelCls = "block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1";
export const apiError = (err, fallback) => err?.response?.data?.message || fallback;
