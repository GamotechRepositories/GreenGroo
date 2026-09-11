import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PageShell } from "../../components/layout/ManagerLayout";
import { managerApi } from "../../api/managerApi";

const getTodayString = () => new Date().toISOString().slice(0, 10);

/** Default rider rate: ₹15 per KM (0–1 → ₹15, 1–2 → ₹30, …). */
const RATE_PER_KM = 15;

const defaultKmSlabs = () => [
  { minKm: 0, maxKm: 1, riderAmount: RATE_PER_KM * 1 },
  { minKm: 1, maxKm: 2, riderAmount: RATE_PER_KM * 2 },
  { minKm: 2, maxKm: 3, riderAmount: RATE_PER_KM * 3 },
  { minKm: 3, maxKm: 4, riderAmount: RATE_PER_KM * 4 },
];

const SHIFT_TYPES = [
  { id: "early_morning", label: "Early Morning Shift", defaultStart: "06:00 AM", defaultEnd: "09:00 AM" },
  { id: "morning", label: "Morning Shift", defaultStart: "09:00 AM", defaultEnd: "01:00 PM" },
  { id: "afternoon", label: "Afternoon Shift", defaultStart: "01:00 PM", defaultEnd: "05:00 PM" },
  { id: "evening", label: "Evening Shift", defaultStart: "05:00 PM", defaultEnd: "09:00 PM" },
  { id: "night", label: "Night Shift", defaultStart: "09:00 PM", defaultEnd: "12:00 AM" },
  { id: "late_night", label: "Late Night Shift", defaultStart: "12:00 AM", defaultEnd: "04:00 AM" },
  { id: "custom", label: "Custom Shift (Manager Defined)", defaultStart: "09:00 AM", defaultEnd: "05:00 PM" },
];

export default function CreateShiftPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [newShiftType, setNewShiftType] = useState("morning");
  const [newShiftName, setNewShiftName] = useState("Morning Shift");
  const [newCapacity, setNewCapacity] = useState(10);
  const [recurrenceMode, setRecurrenceMode] = useState("single_day");
  const [targetDate, setTargetDate] = useState(getTodayString());
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState([1, 2, 3, 4, 5]);

  // Slots array under shift
  const [slotsList, setSlotsList] = useState([
    { startTime: "09:00 AM", endTime: "01:00 PM", capacity: 10 },
  ]);

  // KM-based delivery earning slabs — default ₹15 / KM
  const [earningSlabs, setEarningSlabs] = useState(defaultKmSlabs);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const addEarningSlabRow = () => {
    if (earningSlabs.length >= 8) {
      showToast("Maximum 8 KM earning slabs allowed");
      return;
    }
    const last = earningSlabs[earningSlabs.length - 1];
    const nextMin = last ? Number(last.maxKm) || 0 : 0;
    const nextMax = nextMin + 1;
    setEarningSlabs([
      ...earningSlabs,
      {
        minKm: nextMin,
        maxKm: nextMax,
        riderAmount: RATE_PER_KM * nextMax,
      },
    ]);
  };

  const removeEarningSlabRow = (index) => {
    if (earningSlabs.length <= 1) return;
    setEarningSlabs(earningSlabs.filter((_, i) => i !== index));
  };

  const updateEarningSlabRow = (index, field, value) => {
    const updated = [...earningSlabs];
    updated[index] = { ...updated[index], [field]: value === "" ? "" : Number(value) };
    setEarningSlabs(updated);
  };

  const handleShiftTypeChange = (typeId) => {
    setNewShiftType(typeId);
    const found = SHIFT_TYPES.find((t) => t.id === typeId);
    if (found) {
      setNewShiftName(found.label);
      setSlotsList([
        { startTime: found.defaultStart, endTime: found.defaultEnd, capacity: parseInt(newCapacity, 10) || 10 },
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
      { startTime: "01:00 PM", endTime: "05:00 PM", capacity: parseInt(newCapacity, 10) || 10 },
    ]);
  };

  const removeSlotRow = (index) => {
    if (slotsList.length <= 1) return;
    setSlotsList(slotsList.filter((_, i) => i !== index));
  };

  const updateSlotRow = (index, field, value) => {
    const updated = [...slotsList];
    updated[index][field] = value;
    setSlotsList(updated);
  };

  const toggleDayOfWeek = (dayNum) => {
    setSelectedDaysOfWeek((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    const deliveryEarningSlabs = earningSlabs.map((s) => ({
      minKm: Number(s.minKm),
      maxKm: Number(s.maxKm),
      riderAmount: Number(s.riderAmount),
    }));

    for (let i = 0; i < deliveryEarningSlabs.length; i++) {
      const s = deliveryEarningSlabs[i];
      if (isNaN(s.minKm) || s.minKm < 0) {
        showToast(`Slab ${i + 1}: Min KM must be 0 or more`);
        return;
      }
      if (isNaN(s.maxKm) || s.maxKm <= s.minKm) {
        showToast(`Slab ${i + 1}: Max KM must be greater than Min KM`);
        return;
      }
      if (isNaN(s.riderAmount) || s.riderAmount < 0) {
        showToast(`Slab ${i + 1}: Rider earning (₹) must be 0 or more`);
        return;
      }
      for (let j = 0; j < i; j++) {
        const a = deliveryEarningSlabs[j];
        if (s.minKm < a.maxKm && s.maxKm > a.minKm) {
          showToast(
            `Slabs overlap: #${j + 1} (${a.minKm}–${a.maxKm}) and #${i + 1} (${s.minKm}–${s.maxKm}). Use 0–1, then 1–2, then 2–3.`
          );
          return;
        }
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
        })),
        recurrenceMode,
        targetDate,
        daysOfWeek: selectedDaysOfWeek,
        deliveryEarningSlabs,
      });

      showToast(res.data.message || "Shift created successfully!");
      setTimeout(() => {
        navigate("/shifts");
      }, 1000);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create shift");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center -mt-2 md:-mt-4 pb-6">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-xl space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Create Shift & Time Slots</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure shift preset, time slots, KM earning slabs for riders, and schedule
          </p>
        </div>

        {toast && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 shadow-xs flex items-center gap-2">
            <span>⚡</span>
            <span>{toast}</span>
          </div>
        )}

        <form onSubmit={handleCreateShift} className="space-y-6">
          {/* SHIFT TYPE SELECTOR */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Select Shift Type Preset
            </label>
            <select
              value={newShiftType}
              onChange={(e) => handleShiftTypeChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            >
              {SHIFT_TYPES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Shift Display Name
              </label>
              <input
                type="text"
                required
                value={newShiftName}
                onChange={(e) => setNewShiftName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Rider Capacity Per Slot
              </label>
              <input
                type="number"
                min="1"
                required
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* MANAGER CUSTOM TIME SLOTS CONFIGURATION */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Time Slots Configuration
                </h4>
                <p className="text-[11px] text-slate-500">Define working hours for each slot in this shift</p>
              </div>
              <button
                type="button"
                onClick={addSlotRow}
                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-2xs"
              >
                + Add Time Slot
              </button>
            </div>

            {slotsList.map((cs, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-xl bg-white p-3 border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-400 w-6">#{idx + 1}</span>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Start Time</span>
                    <input
                      type="text"
                      value={cs.startTime}
                      onChange={(e) => updateSlotRow(idx, "startTime", e.target.value)}
                      placeholder="e.g. 06:00 AM"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">End Time</span>
                    <input
                      type="text"
                      value={cs.endTime}
                      onChange={(e) => updateSlotRow(idx, "endTime", e.target.value)}
                      placeholder="e.g. 02:00 PM"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>
                {slotsList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlotRow(idx)}
                    className="text-xs text-rose-600 font-bold p-1.5 hover:bg-rose-50 rounded-lg transition"
                    title="Remove Slot"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* KM-BASED DELIVERY EARNING SLABS */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                  Delivery Charges / KM Earning Slabs
                </h4>
                <p className="text-[11px] text-emerald-800/80 mt-0.5">
                  ₹{RATE_PER_KM} per KM — e.g. till 1 KM → ₹{RATE_PER_KM}, 0–2 KM → ₹{RATE_PER_KM * 2}, 0–3 KM → ₹{RATE_PER_KM * 3}.
                  Use non-overlapping bands (0–1, then 1–2, then 2–3). Do not set every Min KM to 0.
                </p>
              </div>
              <button
                type="button"
                onClick={addEarningSlabRow}
                className="shrink-0 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-2xs"
              >
                + Add KM Slab
              </button>
            </div>

            <div className="space-y-3">
              {earningSlabs.map((slab, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-xl bg-white p-3 border border-emerald-200 shadow-2xs"
                >
                  <span className="text-xs font-bold text-emerald-800 w-14 shrink-0">#{idx + 1}</span>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Min KM</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        required
                        value={slab.minKm}
                        onChange={(e) => updateEarningSlabRow(idx, "minKm", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Max KM</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        required
                        value={slab.maxKm}
                        onChange={(e) => updateEarningSlabRow(idx, "maxKm", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">Rider Earn ₹</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={slab.riderAmount}
                        onChange={(e) => updateEarningSlabRow(idx, "riderAmount", e.target.value)}
                        className="w-full rounded-lg border border-emerald-200 bg-emerald-50/40 px-2.5 py-2 text-xs font-bold text-emerald-800"
                      />
                    </div>
                  </div>
                  {earningSlabs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEarningSlabRow(idx)}
                      className="text-xs text-rose-600 font-bold p-1.5 hover:bg-rose-50 rounded-lg transition"
                      title="Remove slab"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RECURRENCE SCHEDULE */}
          <div className="rounded-2xl bg-slate-50/70 p-5 border border-slate-200 space-y-4">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide">Recurrence Schedule</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "single_day", label: "Single Day" },
                { id: "full_week", label: "Full Week (7 Days)" },
                { id: "full_month", label: "Full Month (30 Days)" },
              ].map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => setRecurrenceMode(rec.id)}
                  className={`rounded-xl py-2.5 px-3 text-xs font-bold border transition-all ${
                    recurrenceMode === rec.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {rec.label}
                </button>
              ))}
            </div>

            {recurrenceMode === "single_day" && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold"
                />
              </div>
            )}

            {(recurrenceMode === "full_week" || recurrenceMode === "full_month") && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Active Days of Week</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { num: 1, label: "Mon" },
                    { num: 2, label: "Tue" },
                    { num: 3, label: "Wed" },
                    { num: 4, label: "Thu" },
                    { num: 5, label: "Fri" },
                    { num: 6, label: "Sat" },
                    { num: 0, label: "Sun" },
                  ].map((day) => {
                    const active = selectedDaysOfWeek.includes(day.num);
                    return (
                      <button
                        key={day.num}
                        type="button"
                        onClick={() => toggleDayOfWeek(day.num)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
                          active
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              to="/shifts"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {isSubmitting ? "Creating Shift..." : "Save & Generate Shift Slots"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
