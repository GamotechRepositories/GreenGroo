import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { managerApi } from "../../api/managerApi";

const getTodayString = () => new Date().toISOString().slice(0, 10);

const SHIFT_TYPES = [
  { id: "early_morning", label: "Early Morning Shift", defaultStart: "06:00 AM", defaultEnd: "09:00 AM" },
  { id: "morning", label: "Morning Shift", defaultStart: "09:00 AM", defaultEnd: "01:00 PM" },
  { id: "afternoon", label: "Afternoon Shift", defaultStart: "01:00 PM", defaultEnd: "05:00 PM" },
  { id: "evening", label: "Evening Shift", defaultStart: "05:00 PM", defaultEnd: "09:00 PM" },
  { id: "night", label: "Night Shift", defaultStart: "09:00 PM", defaultEnd: "12:00 AM" },
  { id: "late_night", label: "Late Night Shift", defaultStart: "12:00 AM", defaultEnd: "04:00 AM" },
  { id: "custom", label: "Custom Shift", defaultStart: "09:00 AM", defaultEnd: "05:00 PM" },
];

const NO_INCENTIVE = { incentiveMode: "none", incentiveRate: "" };

const INCENTIVE_OPTIONS = [
  { id: "none", label: "No incentive" },
  { id: "per_km", label: "₹ per KM delivered" },
  { id: "per_hour", label: "₹ per hour online" },
];

const SALARY_PERIODS = [
  { id: "day", label: "/ day", placeholder: "500" },
  { id: "week", label: "/ week", placeholder: "3500" },
  { id: "month", label: "/ month", placeholder: "15000" },
];

const RECURRENCE = [
  { id: "single_day", label: "Single day" },
  { id: "full_week", label: "Full week" },
  { id: "full_month", label: "Full month" },
];

const WEEK_DAYS = [
  { num: 1, label: "Mon" },
  { num: 2, label: "Tue" },
  { num: 3, label: "Wed" },
  { num: 4, label: "Thu" },
  { num: 5, label: "Fri" },
  { num: 6, label: "Sat" },
  { num: 0, label: "Sun" },
];

const LABEL = "block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5";
const FIELD =
  "w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 disabled:bg-slate-50 disabled:text-slate-400";

function initials(name) {
  return (
    String(name || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("") || "?"
  );
}

function Card({ title, subtitle, action, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function DriverDropdown({ riders, loading, selectedIds, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef(null);
  const closeTimer = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      clearTimeout(closeTimer.current);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return riders;
    return riders.filter((r) => (r.name || "").toLowerCase().includes(q) || String(r.phone || "").includes(q));
  }, [riders, search]);

  const selected = riders.filter((r) => selectedIds.includes(r.id));
  const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selectedIds.includes(r.id));

  const toggle = (id) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);

  const toggleAll = () => {
    const ids = filtered.map((r) => r.id);
    onChange(allFilteredSelected ? selectedIds.filter((id) => !ids.includes(id)) : [...new Set([...selectedIds, ...ids])]);
  };

  const openNow = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 250);
  };

  const summary =
    selected.length === 0
      ? loading
        ? "Loading drivers…"
        : "Select drivers"
      : selected.length === 1
        ? selected[0].name || selected[0].phone
        : `${selected.length} drivers selected`;

  return (
    <div ref={wrapRef} className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${FIELD} flex items-center justify-between gap-2 text-left ${open ? "border-emerald-500 ring-2 ring-emerald-500/15" : ""}`}
      >
        <span className={`flex min-w-0 items-center gap-2 ${selected.length ? "text-slate-900" : "text-slate-400"}`}>
          {selected.length > 0 ? (
            <span className="flex -space-x-1.5">
              {selected.slice(0, 3).map((r) => (
                <span
                  key={r.id}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white ring-2 ring-white"
                >
                  {initials(r.name)}
                </span>
              ))}
            </span>
          ) : null}
          <span className="truncate">{summary}</span>
        </span>
        <svg className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-1.5 w-full min-w-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-100 p-2.5">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or phone"
              className="h-9 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={toggleAll}
              disabled={filtered.length === 0}
              className="h-9 shrink-0 rounded-lg px-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
            >
              {allFilteredSelected ? "Clear all" : "Select all"}
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {loading ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">Loading drivers…</p>
            ) : filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-slate-400">
                {riders.length === 0 ? "No active drivers under you yet" : "No driver matches your search"}
              </p>
            ) : (
              filtered.map((r) => {
                const checked = selectedIds.includes(r.id);
                return (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${checked ? "bg-emerald-50/70" : "hover:bg-slate-50"}`}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggle(r.id)} className="h-4 w-4 accent-emerald-600" />
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                      {initials(r.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">{r.name || "Unnamed driver"}</span>
                      <span className="block text-xs tabular-nums text-slate-500">{r.phone || "—"}</span>
                    </span>
                    {r.vehicleType ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                        {r.vehicleType}
                      </span>
                    ) : null}
                  </label>
                );
              })
            )}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <span>
              {selectedIds.length} of {riders.length} selected
            </span>
            <button type="button" onClick={() => setOpen(false)} className="font-semibold text-slate-700 hover:text-slate-900">
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CreateShiftPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ msg: "", ok: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newShiftType, setNewShiftType] = useState("morning");
  const [newShiftName, setNewShiftName] = useState("Morning Shift");
  const [newCapacity, setNewCapacity] = useState(10);
  const [recurrenceMode, setRecurrenceMode] = useState("single_day");
  const [targetDate, setTargetDate] = useState(getTodayString());
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState([1, 2, 3, 4, 5]);
  const [slotsList, setSlotsList] = useState([
    { startTime: "09:00 AM", endTime: "01:00 PM", capacity: 10, ...NO_INCENTIVE },
  ]);
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryPeriod, setSalaryPeriod] = useState("month");
  const [riders, setRiders] = useState([]);
  const [ridersLoading, setRidersLoading] = useState(true);
  const [selectedRiderIds, setSelectedRiderIds] = useState([]);

  useEffect(() => {
    managerApi
      .getAssignableRiders()
      .then((res) => setRiders(res.data?.riders || []))
      .catch(() => setRiders([]))
      .finally(() => setRidersLoading(false));
  }, []);

  const showToast = (msg, ok = false) => {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg: "", ok: true }), 4000);
  };

  const handleShiftTypeChange = (typeId) => {
    setNewShiftType(typeId);
    const found = SHIFT_TYPES.find((t) => t.id === typeId);
    if (found) {
      setNewShiftName(found.label);
      setSlotsList([
        {
          startTime: found.defaultStart,
          endTime: found.defaultEnd,
          capacity: parseInt(newCapacity, 10) || 10,
          ...NO_INCENTIVE,
        },
      ]);
    }
  };

  const addSlotRow = () => {
    if (slotsList.length >= 4) {
      showToast("Maximum 4 slots allowed per shift");
      return;
    }
    setSlotsList([
      ...slotsList,
      { startTime: "01:00 PM", endTime: "05:00 PM", capacity: parseInt(newCapacity, 10) || 10, ...NO_INCENTIVE },
    ]);
  };

  const removeSlotRow = (index) => {
    if (slotsList.length <= 1) return;
    setSlotsList(slotsList.filter((_, i) => i !== index));
  };

  const updateSlotRow = (index, field, value) => {
    const updated = [...slotsList];
    updated[index] = { ...updated[index], [field]: value };
    setSlotsList(updated);
  };

  const toggleDayOfWeek = (dayNum) => {
    setSelectedDaysOfWeek((prev) => (prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]));
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();

    if (!(Number(salaryAmount) > 0)) {
      showToast("Enter the salary (₹) for this slot");
      return;
    }
    if (selectedRiderIds.length === 0) {
      showToast("Select at least one driver for this slot");
      return;
    }
    for (let i = 0; i < slotsList.length; i++) {
      const s = slotsList[i];
      if (s.incentiveMode !== "none" && !(Number(s.incentiveRate) > 0)) {
        showToast(`Slot ${i + 1}: enter the incentive amount (₹) or choose "No incentive"`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await managerApi.createShift({
        name: newShiftName,
        type: newShiftType,
        capacity: parseInt(newCapacity, 10) || 10,
        maxCapacityPerSlot: parseInt(newCapacity, 10) || 10,
        customSlots: slotsList.map((s) => ({
          startTime: s.startTime,
          endTime: s.endTime,
          capacity: parseInt(s.capacity || newCapacity, 10) || 10,
          incentiveMode: s.incentiveMode || "none",
          incentiveRate: s.incentiveMode === "none" ? 0 : Number(s.incentiveRate) || 0,
        })),
        recurrenceMode,
        targetDate,
        daysOfWeek: selectedDaysOfWeek,
        deliveryEarningSlabs: [],
        salaryAmount: Math.round(Number(salaryAmount)),
        salaryPeriod,
        riderIds: selectedRiderIds,
      });

      showToast(res.data.message || "Shift created successfully!", true);
      setTimeout(() => navigate("/shifts"), 1000);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create shift");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleCreateShift} className="w-full space-y-5 pb-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            <Link to="/shifts" className="hover:text-emerald-700">
              Shifts & Slots
            </Link>{" "}
            / Create
          </p>
          <h1 className="mt-0.5 text-xl font-bold text-slate-900">Create Shift & Time Slots</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/shifts"
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="h-10 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSubmitting ? "Creating…" : "Save & Assign"}
          </button>
        </div>
      </div>

      {toast.msg ? (
        <div
          className={`rounded-lg border px-4 py-2.5 text-sm font-medium ${
            toast.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {toast.msg}
        </div>
      ) : null}

      <Card title="Shift details" subtitle="Preset, name, capacity, pay and the drivers who will work it">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className={LABEL}>Shift preset</label>
            <select value={newShiftType} onChange={(e) => handleShiftTypeChange(e.target.value)} className={FIELD}>
              {SHIFT_TYPES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL}>Display name</label>
            <input type="text" required value={newShiftName} onChange={(e) => setNewShiftName(e.target.value)} className={FIELD} />
          </div>
          <div>
            <label className={LABEL}>Capacity per slot</label>
            <input
              type="number"
              min="1"
              required
              value={newCapacity}
              onChange={(e) => setNewCapacity(e.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label className={LABEL}>Salary</label>
            <div className="flex h-10 overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/15">
              <span className="flex items-center pl-3 text-sm font-semibold text-slate-400">₹</span>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={salaryAmount}
                onChange={(e) => setSalaryAmount(e.target.value)}
                placeholder={SALARY_PERIODS.find((p) => p.id === salaryPeriod)?.placeholder}
                className="min-w-0 flex-1 bg-transparent px-2 text-sm font-medium text-slate-900 focus:outline-none"
              />
              <select
                value={salaryPeriod}
                onChange={(e) => setSalaryPeriod(e.target.value)}
                className="border-l border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                {SALARY_PERIODS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL}>Assign drivers</label>
            <DriverDropdown
              riders={riders}
              loading={ridersLoading}
              selectedIds={selectedRiderIds}
              onChange={setSelectedRiderIds}
            />
          </div>
        </div>
      </Card>

      <Card
        title="Time slots"
        subtitle="Working hours per slot, with an optional hour or KM incentive credited instantly on top of salary"
        action={
          <button
            type="button"
            onClick={addSlotRow}
            className="h-9 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            + Add slot
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="w-10 pb-2">#</th>
                <th className="pb-2 pr-3">Start time</th>
                <th className="pb-2 pr-3">End time</th>
                <th className="pb-2 pr-3">Capacity</th>
                <th className="pb-2 pr-3">Incentive</th>
                <th className="pb-2 pr-3">Rate</th>
                <th className="w-10 pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slotsList.map((cs, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 text-xs font-semibold text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 pr-3">
                    <input
                      type="text"
                      value={cs.startTime}
                      onChange={(e) => updateSlotRow(idx, "startTime", e.target.value)}
                      placeholder="06:00 AM"
                      className={FIELD}
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <input
                      type="text"
                      value={cs.endTime}
                      onChange={(e) => updateSlotRow(idx, "endTime", e.target.value)}
                      placeholder="02:00 PM"
                      className={FIELD}
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <input
                      type="number"
                      min="1"
                      value={cs.capacity}
                      onChange={(e) => updateSlotRow(idx, "capacity", e.target.value)}
                      className={FIELD}
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <select
                      value={cs.incentiveMode || "none"}
                      onChange={(e) => updateSlotRow(idx, "incentiveMode", e.target.value)}
                      className={FIELD}
                    >
                      {INCENTIVE_OPTIONS.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        disabled={!cs.incentiveMode || cs.incentiveMode === "none"}
                        value={cs.incentiveRate}
                        onChange={(e) => updateSlotRow(idx, "incentiveRate", e.target.value)}
                        placeholder="0"
                        className={`${FIELD} pl-7 pr-14`}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        {cs.incentiveMode === "per_hour" ? "/ hr" : cs.incentiveMode === "per_km" ? "/ km" : ""}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => removeSlotRow(idx)}
                      disabled={slotsList.length <= 1}
                      className="h-9 w-9 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Remove slot"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Schedule" subtitle="Which dates these slots are generated for">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div>
            <label className={LABEL}>Repeat</label>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              {RECURRENCE.map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setRecurrenceMode(rec.id)}
                  className={`h-8 rounded-md px-4 text-xs font-semibold transition ${
                    recurrenceMode === rec.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {rec.label}
                </button>
              ))}
            </div>
          </div>

          {recurrenceMode === "single_day" ? (
            <div className="w-full max-w-xs">
              <label className={LABEL}>Date</label>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={FIELD} />
            </div>
          ) : (
            <div>
              <label className={LABEL}>Active days</label>
              <div className="flex flex-wrap gap-1.5">
                {WEEK_DAYS.map((day) => {
                  const active = selectedDaysOfWeek.includes(day.num);
                  return (
                    <button
                      key={day.num}
                      type="button"
                      onClick={() => toggleDayOfWeek(day.num)}
                      className={`h-10 w-12 rounded-lg border text-xs font-semibold transition ${
                        active
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>
    </form>
  );
}
