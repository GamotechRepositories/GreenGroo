import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
  CalendarClock,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { vendorApi } from '../../api/vendorApi';

export default function VendorPreOrderSlotsPage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setStatusMsg({ type: '', text: '' });
      const data = await vendorApi.getPreOrderSlots();
      if (Array.isArray(data) && data.length > 0) {
        setSlots(data);
      } else {
        // Default standard delivery windows if none configured
        setSlots([
          { startTime: '06:00', endTime: '09:00', capacity: 60, isActive: true },
          { startTime: '09:00', endTime: '12:00', capacity: 80, isActive: true },
          { startTime: '16:00', endTime: '19:00', capacity: 70, isActive: true },
          { startTime: '19:00', endTime: '22:00', capacity: 50, isActive: true },
        ]);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: 'Failed to load pre-order slots from server. You can configure and save new slots below.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatusMsg({ type: '', text: '' });

      // Basic validation
      for (const slot of slots) {
        if (!slot.startTime || !slot.endTime) {
          setStatusMsg({ type: 'error', text: 'All slots must have valid Start Time and End Time.' });
          setSaving(false);
          return;
        }
      }

      await vendorApi.savePreOrderSlots(slots);
      setStatusMsg({ type: 'success', text: 'Pre-order delivery slots updated and published successfully!' });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save pre-order slots. Check your network connection.',
      });
    } finally {
      setSaving(false);
    }
  };

  const addSlot = () => {
    setSlots([...slots, { startTime: '08:00', endTime: '11:00', capacity: 50, isActive: true }]);
  };

  const updateSlot = (index, field, value) => {
    const newSlots = [...slots];
    newSlots[index][field] = value;
    setSlots(newSlots);
  };

  const removeSlot = (index) => {
    const newSlots = [...slots];
    newSlots.splice(index, 1);
    setSlots(newSlots);
  };

  const totalCapacity = slots.reduce((acc, s) => acc + (s.isActive ? Number(s.capacity || 0) : 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 p-6 text-white shadow-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-xs">
              <CalendarClock className="h-3.5 w-3.5 text-amber-300" />
              <span>Next-Day Fulfillment Windows</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Pre-Order Delivery Slots
            </h1>
            <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
              Configure customer delivery time slots, capacity limits, and availability windows for next-day farm fresh deliveries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/vendor/preorders"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-xs font-semibold text-white transition"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>View Pre-Orders</span>
            </Link>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Quick summary strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 border-t border-emerald-600/50 pt-5">
          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-xs">
            <p className="text-xs font-medium text-emerald-200">Active Slots</p>
            <p className="text-xl font-bold text-white mt-0.5">{slots.filter((s) => s.isActive).length} Slots</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-xs">
            <p className="text-xs font-medium text-emerald-200">Total Daily Capacity</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalCapacity} Orders / day</p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 backdrop-blur-xs">
            <p className="text-xs font-medium text-emerald-200">Fulfillment Rule</p>
            <p className="text-xs font-semibold text-emerald-100 mt-1">Orders cut off at 10:00 PM previous day</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {statusMsg.text && (
        <div
          className={`flex items-center gap-2 rounded-xl p-4 text-xs font-medium border ${
            statusMsg.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {statusMsg.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Slots List Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Time Windows & Capacity</h2>
            <p className="text-xs text-slate-500">
              Customers can pick one of these available time slots at checkout. When capacity is reached, slot marks as Sold Out.
            </p>
          </div>
          <button
            type="button"
            onClick={addSlot}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Slot</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {slots.map((slot, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 hover:border-slate-300 transition"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Order Capacity (Limit)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={slot.capacity}
                      onChange={(e) => updateSlot(index, 'capacity', parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
                      placeholder="e.g. 50 orders"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(slot.isActive)}
                      onChange={(e) => updateSlot(index, 'isActive', e.target.checked)}
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span>Active</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => removeSlot(index)}
                    className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 transition"
                    title="Delete Slot"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
