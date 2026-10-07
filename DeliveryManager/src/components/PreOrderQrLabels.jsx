import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

const PRINT_CSS = `
  * { box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
  body { margin: 12px; color: #0f172a; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .label { border: 1px dashed #94a3b8; border-radius: 8px; padding: 10px; text-align: center; page-break-inside: avoid; }
  .num { font-size: 16px; font-weight: 700; margin-top: 6px; }
  .meta { font-size: 11px; color: #475569; margin-top: 2px; }
  .err { font-size: 11px; color: #b91c1c; padding: 40px 0; }
  .head { font-size: 13px; margin-bottom: 10px; }
`;

/** Printable pickup QR labels — one per pre-order — for the bags handed to a rider. */
export default function PreOrderQrLabels({ open, onClose, loading, riderName, storeName, labels = [] }) {
  const sheetRef = useRef(null);
  if (!open) return null;

  const printable = labels.filter((l) => l.payload);

  const onPrint = () => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win || !sheetRef.current) return;
    win.document.write(
      `<html><head><title>Pre-order QR labels</title><style>${PRINT_CSS}</style></head><body>${sheetRef.current.innerHTML}</body></html>`
    );
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Pickup QR labels</h3>
            <p className="mt-1 text-xs text-slate-500">
              {riderName ? `For ${riderName} · ` : ""}
              {labels.length} pre-order{labels.length === 1 ? "" : "s"}. Stick one on each bag — the rider scans it to
              see that customer's address.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">Preparing QR codes…</p>
          ) : (
            <div ref={sheetRef}>
              <div className="head mb-3 text-xs text-slate-500">
                {storeName ? `${storeName} · ` : ""}Rider: {riderName || "—"}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {labels.map((l) => (
                  <div key={l.orderId} className="label rounded-lg border border-dashed border-slate-300 p-3 text-center">
                    {l.payload ? (
                      <QRCodeSVG value={l.payload} size={130} level="M" includeMargin />
                    ) : (
                      <p className="err py-10 text-[11px] text-rose-700">{l.error || "QR not available"}</p>
                    )}
                    <p className="num mt-1 font-mono text-sm font-bold text-slate-900">#{l.orderNumber}</p>
                    <p className="meta text-[11px] text-slate-500">
                      {[l.slot, l.itemCount ? `${l.itemCount} items` : ""].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            disabled={loading || !printable.length}
            onClick={onPrint}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Print {printable.length} label{printable.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}
