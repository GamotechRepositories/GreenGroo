import { useCallback, useEffect, useState } from "react";
import { getPreOrderSlotAvailability, reschedulePreOrder } from "../../api/api";
import {
  canReschedulePreOrder,
  formatPreOrderDay,
  formatSlotLabel,
  preOrderChangeDeadline,
  preOrderPackingStarted,
  slotAvailabilityText,
} from "../../utils/preOrderSlots";

const CLOSED_STATUSES = new Set(["attempted", "cancelled", "delivered", "return"]);

const formatTime = (date) =>
  date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

/** Booked pre-order slot plus every slot for that day with seats left; lets the customer move slots while allowed. */
export default function PreOrderSlotCard({ order, onChanged, className = "" }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [movingTo, setMovingTo] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const visible = Boolean(order?.preOrderSlot) && !CLOSED_STATUSES.has(order?.status);
  const date = order?.preOrderDate || "";

  const loadSlots = useCallback(async () => {
    try {
      const { data } = await getPreOrderSlotAvailability(date);
      setSlots(data?.data?.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    if (visible) loadSlots();
  }, [visible, loadSlots, order?.preOrderSlot]);

  if (!visible) return null;

  const canMove = canReschedulePreOrder(order);
  const deadline = preOrderChangeDeadline(order);
  const dayLabel = formatPreOrderDay(date) || "Tomorrow";

  let note;
  if (canMove) {
    note = `You can change your slot until ${formatTime(deadline)}.`;
  } else if (preOrderPackingStarted(order)) {
    note = "Your pre-order is being packed, so the slot can no longer be changed.";
  } else {
    note = "Slot changes were allowed for 4 hours after placing the order.";
  }

  const handleMove = async (label) => {
    if (movingTo) return;
    setMovingTo(label);
    setMessage({ type: "", text: "" });
    try {
      await reschedulePreOrder(order._id, label);
      setMessage({ type: "success", text: `Moved to ${formatSlotLabel(label)}` });
      await Promise.all([loadSlots(), onChanged?.()]);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Could not change the slot. Please try again.",
      });
      loadSlots();
    } finally {
      setMovingTo("");
    }
  };

  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Pre-order delivery slot</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {dayLabel} · {formatSlotLabel(order.preOrderSlot)}
      </p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>

      <p className="mt-4 text-xs font-medium text-slate-700">Available slots on {dayLabel}</p>
      {loading ? (
        <p className="mt-2 text-xs text-slate-400">Loading slots…</p>
      ) : slots.length === 0 ? (
        <p className="mt-2 text-xs text-slate-400">No slots are open for this day.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100 rounded-md border border-slate-200">
          {slots.map((slot) => {
            const isCurrent = slot.label === order.preOrderSlot;
            const availability = slotAvailabilityText(slot);
            return (
              <li key={slot.label} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className={`text-sm ${isCurrent ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                    {formatSlotLabel(slot.label)}
                  </p>
                  <p className={`text-[11px] ${slot.isFull ? "text-red-600" : "text-slate-500"}`}>{availability}</p>
                </div>
                {isCurrent ? (
                  <span className="shrink-0 rounded border border-[#0C831F] px-2 py-0.5 text-[11px] font-semibold text-[#0C831F]">
                    Your slot
                  </span>
                ) : canMove && !slot.isFull ? (
                  <button
                    type="button"
                    onClick={() => handleMove(slot.label)}
                    disabled={Boolean(movingTo)}
                    className="shrink-0 rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-[#0C831F] hover:text-[#0C831F] disabled:opacity-50"
                  >
                    {movingTo === slot.label ? "Moving…" : "Move here"}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {message.text ? (
        <p className={`mt-2 text-xs ${message.type === "error" ? "text-red-600" : "text-[#0C831F]"}`}>
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
