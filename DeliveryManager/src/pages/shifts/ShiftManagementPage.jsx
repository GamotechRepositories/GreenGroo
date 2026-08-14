import { useCallback, useEffect, useState } from "react";
import { PageShell } from "../../components/layout/ManagerLayout";
import { managerApi } from "../../api/managerApi";

const getTodayString = () => new Date().toISOString().slice(0, 10);

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

const SHIFT_TYPES = [
  { id: "early_morning", label: "Early Morning Shift", defaultStart: "06:00 AM", defaultEnd: "09:00 AM" },
  { id: "morning", label: "Morning Shift", defaultStart: "09:00 AM", defaultEnd: "01:00 PM" },
  { id: "afternoon", label: "Afternoon Shift", defaultStart: "01:00 PM", defaultEnd: "05:00 PM" },
  { id: "evening", label: "Evening Shift", defaultStart: "05:00 PM", defaultEnd: "09:00 PM" },
  { id: "night", label: "Night Shift", defaultStart: "09:00 PM", defaultEnd: "12:00 AM" },
  { id: "late_night", label: "Late Night Shift", defaultStart: "12:00 AM", defaultEnd: "04:00 AM" },
  { id: "custom", label: "Custom Shift (Manager Defined)", defaultStart: "09:00 AM", defaultEnd: "05:00 PM" },
];

export default function ShiftManagementPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSlotForRiders, setSelectedSlotForRiders] = useState(null);
  const [riderDetailsModalData, setRiderDetailsModalData] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);

  // New Shift form state
  const [newShiftType, setNewShiftType] = useState("morning");
  const [newShiftName, setNewShiftName] = useState("Morning Shift");
  const [newCapacity, setNewCapacity] = useState(10);
  const [recurrenceMode, setRecurrenceMode] = useState("single_day");
  const [targetDate, setTargetDate] = useState(getTodayString());
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState([1, 2, 3, 4, 5]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Slots array under shift
  const [slotsList, setSlotsList] = useState([
    { startTime: "09:00 AM", endTime: "01:00 PM", capacity: 10 },
  ]);

  // Edit slot form state
  const [editCapacity, setEditCapacity] = useState(10);
  const [editStatus, setEditStatus] = useState("AVAILABLE");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  // Pagination state
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  };

  const loadShifts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await managerApi.getManagerSlots(selectedDate);
      setShifts(res.data.shifts || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load shifts");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const handleShiftTypeChange = (typeId) => {
    setNewShiftType(typeId);
    const found = SHIFT_TYPES.find((t) => t.id === typeId);
    if (found) {
      setNewShiftName(found.label);
      setSlotsList([
        { startTime: found.defaultStart, endTime: found.defaultEnd, capacity: parseInt(newCapacity, 10) || 10 }
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

  const handleCreateShift = async (e) => {
    e.preventDefault();
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
      });

      showToast(res.data.message || "Shift created successfully!");
      setIsCreateModalOpen(false);
      await loadShifts();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create shift");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSlotDetails = async (slotId) => {
    try {
      const res = await managerApi.getSlotDetailsWithRiders(slotId);
      setRiderDetailsModalData(res.data);
      setSelectedSlotForRiders(res.data.slot || res.data.shift);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to fetch registered riders");
    }
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    if (!editingSlot) return;
    try {
      const res = await managerApi.updateSlotDateWise(editingSlot.id || editingSlot.slotId || editingSlot._id, {
        capacity: parseInt(editCapacity, 10),
        status: editStatus,
        startTime: editStartTime,
        endTime: editEndTime,
      });
      showToast(res.data.message || "Shift slot updated!");
      setEditingSlot(null);
      await loadShifts();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update slot");
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm("Are you sure you want to delete this shift?")) return;
    try {
      const res = await managerApi.deleteSlotDateWise(slotId);
      showToast(res.data.message || "Shift removed");
      await loadShifts();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete shift");
    }
  };

  const toggleDayOfWeek = (dayNum) => {
    setSelectedDaysOfWeek((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum]
    );
  };

  const currentDateObj = formatDateWithDay(getTodayString());
  const selectedDateObj = formatDateWithDay(selectedDate);

  const totalBookedToday = shifts.reduce((acc, s) => acc + (s.totalBooked || 0), 0);
  const totalCapacityToday = shifts.reduce((acc, s) => acc + (s.totalCapacity || 0), 0);
  const totalAvailableToday = shifts.reduce((acc, s) => acc + Math.max(0, (s.totalCapacity || 0) - (s.totalBooked || 0)), 0);
  const availablePercentage = totalCapacityToday > 0 ? Math.round((totalAvailableToday / totalCapacityToday) * 100) : 0;

  return (
    <PageShell>
      {toast && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 shadow-xs flex items-center gap-2">
          <span>⚡</span>
          <span>{toast}</span>
        </div>
      )}

      {/* 5 COMPACT TOP STAT CARDS WITH ONE-LINE CONTENT */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* CARD 1: CURRENT DATE */}
        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Date</p>
          <div className="mt-0.5 flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-sm font-black text-slate-900">{currentDateObj.formatted}</span>
            <span className="text-[11px] font-medium text-slate-400">({currentDateObj.dayName})</span>
          </div>
        </div>

        {/* CARD 2: SELECTED DATE */}
        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Selected Date</p>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200/90 bg-slate-50/70 px-2 py-1 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none cursor-pointer"
          />
        </div>

        {/* CARD 3: ACTIVE SHIFTS */}
        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Shifts</p>
          <div className="mt-0.5 flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-base font-black text-slate-900">{shifts.length}</span>
            <span className="text-[11px] font-medium text-slate-400">Today</span>
          </div>
        </div>

        {/* CARD 4: SLOTS AVAILABLE */}
        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Slots Available</p>
          <div className="mt-0.5 flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="text-base font-black text-emerald-600">{totalAvailableToday}</span>
            <span className="text-xs font-normal text-slate-400">/ {totalCapacityToday}</span>
            <span className="text-[11px] font-medium text-slate-400">({availablePercentage}%)</span>
          </div>
        </div>

        {/* CARD 5: ACTIONS */}
        <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-2xs flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Actions</p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition active:scale-98 whitespace-nowrap"
          >
            <span className="text-sm font-bold">+</span>
            <span>Create Shift Slots</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-600">
          {error}
        </div>
      )}

      {/* SHIFTS TABLE CONTAINER (EXACT MATCH TO REFERENCE SCREENSHOT) */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
        {/* Table Header Row */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Shifts</h2>
          <button
            type="button"
            onClick={loadShifts}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs font-semibold text-slate-400">Loading shifts data...</div>
        ) : shifts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <p className="text-3xl">🗓️</p>
            <p className="text-sm font-bold text-slate-800">No shifts scheduled for {selectedDateObj.formatted || selectedDate}</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click "+ Create Shift Slots" to add Morning, Evening, Night, or Custom shifts.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
            >
              + Create Shift Slots
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">SHIFT TYPES</th>
                  <th className="py-3.5 px-6">DATE</th>
                  <th className="py-3.5 px-6">TIME SLOTS</th>
                  <th className="py-3.5 px-6">AVAILABLE SLOTS</th>
                  <th className="py-3.5 px-6">BOOKED SLOTS</th>
                  <th className="py-3.5 px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.map((shift) => {
                  const dateInfo = formatDateWithDay(shift.dateString || selectedDate);
                  const availableCount = Math.max(0, (shift.totalCapacity || 0) - (shift.totalBooked || 0));
                  const firstSlot = (shift.slots && shift.slots[0]) || {};
                  const timeSlotText = firstSlot.startTime && firstSlot.endTime
                    ? `${firstSlot.startTime} - ${firstSlot.endTime}`
                    : "09:00 AM - 05:00 PM";

                  return (
                    <tr key={shift.id || shift._id} className="hover:bg-slate-50/40 transition">
                      {/* SHIFT TYPES */}
                      <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                        {shift.name}
                      </td>

                      {/* DATE */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-xs">{dateInfo.formatted}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{dateInfo.dayName}</div>
                      </td>

                      {/* TIME SLOTS */}
                      <td className="py-4 px-6 font-bold text-slate-900 text-xs">
                        {shift.slots && shift.slots.length > 1
                          ? shift.slots.map(s => `${s.startTime} - ${s.endTime}`).join(", ")
                          : timeSlotText}
                      </td>

                      {/* AVAILABLE SLOTS */}
                      <td className="py-4 px-6 font-extrabold text-sm text-emerald-600">
                        {availableCount} / {shift.totalCapacity}
                      </td>

                      {/* BOOKED SLOTS */}
                      <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                        <button
                          type="button"
                          onClick={() => handleOpenSlotDetails(firstSlot.id || firstSlot._id || shift.id || shift._id)}
                          className="hover:underline hover:text-emerald-700"
                        >
                          {shift.totalBooked || 0}
                        </button>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (firstSlot) {
                                setEditingSlot(firstSlot);
                                setEditCapacity(firstSlot.capacity || 10);
                                setEditStatus(firstSlot.status || "AVAILABLE");
                                setEditStartTime(firstSlot.startTime || "");
                                setEditEndTime(firstSlot.endTime || "");
                              }
                            }}
                            className="rounded-lg border border-emerald-500 bg-white px-4 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(shift.id || shift._id)}
                            className="rounded-lg border border-rose-300 bg-white px-4 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-50 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Row (Matching Reference Screenshot) */}
        <div className="flex flex-wrap items-center justify-end gap-6 p-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div>
            1 - {shifts.length} of {shifts.length}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-300 disabled:opacity-50"
            >
              ‹
            </button>
            <button
              type="button"
              disabled
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-300 disabled:opacity-50"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* CREATE SHIFT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Shift & Custom Time Slots</h3>
                <p className="text-xs text-slate-500">Select shift preset and customize exact start & end hours</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Select Shift Type
                </label>
                <select
                  value={newShiftType}
                  onChange={(e) => handleShiftTypeChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                >
                  {SHIFT_TYPES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Shift Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newShiftName}
                    onChange={(e) => setNewShiftName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Capacity Per Slot
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* MANAGER CUSTOM TIME SLOTS CONFIGURATION */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Manager Time Slots (Start & End Time)
                    </label>
                    <p className="text-[11px] text-slate-500">Edit start and end time for this shift</p>
                  </div>
                  <button
                    type="button"
                    onClick={addSlotRow}
                    className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-200 transition"
                  >
                    + Add Time Slot
                  </button>
                </div>

                {slotsList.map((cs, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-xl bg-white p-2.5 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-400 w-5">#{idx + 1}</span>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">Start Time</span>
                        <input
                          type="text"
                          value={cs.startTime}
                          onChange={(e) => updateSlotRow(idx, "startTime", e.target.value)}
                          placeholder="e.g. 06:00 AM"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase">End Time</span>
                        <input
                          type="text"
                          value={cs.endTime}
                          onChange={(e) => updateSlotRow(idx, "endTime", e.target.value)}
                          placeholder="e.g. 02:00 PM"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900"
                        />
                      </div>
                    </div>
                    {slotsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSlotRow(idx)}
                        className="text-xs text-rose-600 font-bold p-1 hover:bg-rose-50 rounded"
                        title="Remove Slot"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* RECURRENCE SCHEDULE */}
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">Recurrence Schedule</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "single_day", label: "Single Day" },
                    { id: "full_week", label: "Full Week" },
                    { id: "full_month", label: "Full Month" },
                  ].map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => setRecurrenceMode(rec.id)}
                      className={`rounded-lg py-2 text-xs font-bold border transition-all ${
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
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
                    />
                  </div>
                )}

                {(recurrenceMode === "full_week" || recurrenceMode === "full_month") && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Active Days of Week</label>
                    <div className="flex flex-wrap gap-1.5">
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
                            className={`h-8 w-10 rounded-lg text-xs font-bold transition-all ${
                              active ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"
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

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition"
                >
                  {isSubmitting ? "Creating Shift..." : "Create Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SLOT MODAL */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Edit Time Slot</h3>

            <form onSubmit={handleUpdateSlot} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Start Time</label>
                  <input
                    type="text"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    placeholder="e.g. 06:00 AM"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">End Time</label>
                  <input
                    type="text"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    placeholder="e.g. 02:00 PM"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Slot Capacity</label>
                <input
                  type="number"
                  min={editingSlot.bookedCount || 0}
                  required
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">Currently booked: {editingSlot.bookedCount || 0}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status Override</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="FEW_SPOTS_LEFT">FEW_SPOTS_LEFT</option>
                  <option value="FULL">FULL (Block new bookings)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow"
                >
                  Save Slot Edits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SLOT RIDERS LIST MODAL */}
      {selectedSlotForRiders && riderDetailsModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Registered Delivery Partners ({riderDetailsModalData.bookedCount} / {riderDetailsModalData.capacity})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedSlotForRiders(null);
                  setRiderDetailsModalData(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {riderDetailsModalData.deliveryPartners.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400 font-semibold">No delivery partners have booked this slot yet.</p>
              ) : (
                riderDetailsModalData.deliveryPartners.map((rider, idx) => (
                  <div
                    key={rider.bookingId}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 text-xs">
                        {rider.deliveryPartnerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{idx + 1}. {rider.deliveryPartnerName}</p>
                        <p className="text-[11px] text-slate-500">📞 {rider.deliveryPartnerPhone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800">
                        {rider.status}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Booked: {new Date(rider.bookedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
