import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getStoreSettings } from "../../api/api";
import { Loader2, Clock } from "lucide-react";

function PreOrderSlotPickerSheet({ product, open, onClose, onSlotSelected }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const fetchSlots = async () => {
      try {
        setLoading(true);
        const res = await getStoreSettings();
        const settings = res.data?.data || res.data;
        if (settings?.preOrderSlots) {
          setSlots(settings.preOrderSlots.filter(s => s.isActive));
        }
      } catch (err) {
        setError("Failed to load slots");
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open || !product) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[220] bg-black/50 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[72vh] w-full max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-center pb-1.5">
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900/90 text-white shadow-lg"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-hidden rounded-t-xl bg-white shadow-2xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              Select Delivery Slot
            </h2>
            <p className="mt-1 text-[11px] text-gray-500">
              When would you like {product.name} to be delivered?
            </p>
          </div>

          <div className="max-h-[48vh] overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            ) : error ? (
              <div className="text-center text-sm text-red-500 py-4">{error}</div>
            ) : slots.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-4">No slots available</div>
            ) : (
              slots.map((slot, i) => {
                const slotStr = `${slot.startTime} - ${slot.endTime}`;
                return (
                  <button
                    key={i}
                    onClick={(e) => onSlotSelected(slotStr, e)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left"
                  >
                    <span className="text-sm font-medium text-gray-800">{slotStr}</span>
                    <span className="text-xs text-emerald-600 font-semibold uppercase">Select</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default PreOrderSlotPickerSheet;
