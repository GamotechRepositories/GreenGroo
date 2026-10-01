import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PageShell } from "../../components/layout/ManagerLayout";
import { managerApi } from "../../api/managerApi";

const getTodayString = () => new Date().toISOString().slice(0, 10);

const SHIFT_TYPES = [
  { id: "early_morning", label: "Early Morning Shift", defaultStart: "06:00 AM", defaultEnd: "09:00 AM" },
  { id: "morning", label: "Morning Shift", defaultStart: "09:00 AM", defaultEnd: "01:00 PM" },
  { id: "afternoon", label: "Afternoon Shift", defaultStart: "01:00 PM", defaultEnd: "05:00 PM" },
  { id: "evening", label: "Evening Shift", defaultStart: "05:00 PM", defaultEnd: "09:00 PM" },
  { id: "night", label: "Night Shift", defaultStart: "09:00 PM", defaultEnd: "12:00 AM" },
  { id: "late_night", label: "Late Night Shift", defaultStart: "12:00 AM", defaultEnd: "04:00 AM" },
  { id: "custom", label: "Custom Shift (Manager Defined)", defaultStart: "09:00 AM", defaultEnd: "05:00 PM" },
];

export default function CreateFullTimeShiftPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [shiftType, setShiftType] = useState("morning");
  const [shiftName, setShiftName] = useState("Morning Shift");
  const [capacity, setCapacity] = useState(10);
  const [recurrenceMode, setRecurrenceMode] = useState("single_day");
  const [targetDate, setTargetDate] = useState(getTodayString());
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState([1, 2, 3, 4, 5]);
  const [slotsList, setSlotsList] = useState([
    { startTime: "09:00 AM", endTime: "06:00 PM", capacity: 10 },
  ]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const handleShiftTypeChange = (typeId) => {
    setShiftType(typeId);
    const found = SHIFT_TYPES.find((t) => t.id === typeId);
    if (found) {
      setShiftName(found.label);
      setSlotsList([{ startTime: found.defaultStart, endTime: found.defaultEnd, capacity: parseInt(capacity, 10) || 10 }]);
    }
  };

  const toggleDayOfWeek = (dayNum) => {
    setSelectedDaysOfWeek((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  const updateSlotRow = (index, field, value) => {
    const updated = [...slotsList];
    updated[index][field] = value;
    setSlotsList(updated);
  };

  const addSlotRow = () => {
    if (slotsList.length >= 4) {
      showToast("Maximum 4 slots allowed per shift");
      return;
    }
    setSlotsList([...slotsList, { startTime: "01:00 PM", endTime: "06:00 PM", capacity: parseInt(capacity, 10) || 10 }]);
  };

  const removeSlotRow = (index) => {
    if (slotsList.length <= 1) return;
    setSlotsList(slotsList.filter((_, i) => i !== index));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await managerApi.createShift({
        name: shiftName,
        type: shiftType,
        shiftCategory: "FULL_TIME",
        capacity: parseInt(capacity, 10) || 10,
        maxCapacityPerSlot: parseInt(capacity, 10) || 10,
        customSlots: slotsList.map((s) => ({
          startTime: s.startTime,
          endTime: s.endTime,
          capacity: parseInt(s.capacity || capacity, 10) || 10,
        })),
        recurrenceMode,
        targetDate,
        daysOfWeek: selectedDaysOfWeek,
        deliveryEarningSlabs: [], // Full-Time drivers don't use per-KM slabs
      });
      showToast("Full-Time shift created!");
      setTimeout(() => navigate("/shifts/fulltime"), 1200);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create shift");
    } finally {
      setIsSubmitting(false);
    }
  };

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <PageShell>
      {toast && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 shadow-xs flex items-center gap-2">
          <span>⚡</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Info banner */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs font-semibold text-blue-800 flex items-start gap-2">
        <span>ℹ️</span>
        <span>
          Full-Time shifts do <strong>not</strong> include per-KM earning slabs. Drivers earn a fixed monthly salary configured separately.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/shifts/fulltime"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          ← Back
        </Link>
        <h2 className="text-sm font-bold text-slate-900">Create Full-Time Shift</h2>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <form onSubmit={handleCreate} className="space-y-4">
          {/* Shift Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Shift Type</label>
            <select
              value={shiftType}
              onChange={(e) => handleShiftTypeChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
            >
              {SHIFT_TYPES.map((st) => (
                <option key={st.id} value={st.id}>{st.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Shift Display Name</label>
              <input
                required
                value={shiftName}
                onChange={(e) => setShiftName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Capacity Per Slot</label>
              <input
                type="number"
                min="1"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Recurrence</label>
            <select
              value={recurrenceMode}
              onChange={(e) => setRecurrenceMode(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
            >
              <option value="single_day">Single Day</option>
              <option value="weekly">Weekly (recurring)</option>
            </select>
          </div>

          {recurrenceMode === "single_day" ? (
            <div className="max-w-xs">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Date</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Days of Week</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map((day, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDayOfWeek(i)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition ${selectedDaysOfWeek.includes(i) ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"}`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Slots */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">Time Slots</label>
              <button
                type="button"
                onClick={addSlotRow}
                className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-200 transition"
              >
                + Add Slot
              </button>
            </div>
            {slotsList.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded-xl bg-white p-2.5 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-400 w-5">#{idx + 1}</span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Start Time</span>
                    <input
                      value={slot.startTime}
                      onChange={(e) => updateSlotRow(idx, "startTime", e.target.value)}
                      placeholder="09:00 AM"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">End Time</span>
                    <input
                      value={slot.endTime}
                      onChange={(e) => updateSlotRow(idx, "endTime", e.target.value)}
                      placeholder="06:00 PM"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                {slotsList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlotRow(idx)}
                    className="text-rose-500 hover:text-rose-700 font-bold text-sm"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <Link
              to="/shifts/fulltime"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60 transition"
            >
              {isSubmitting ? "Creating…" : "Create Full-Time Shift"}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
}
