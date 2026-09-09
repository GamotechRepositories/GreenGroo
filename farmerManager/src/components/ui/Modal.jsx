import { useEffect } from "react";
import { EXCEL_BTN, EXCEL_PANEL, EXCEL_PANEL_HEAD } from "../../utils/excelStyles";

function Modal({ open, title, onClose, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const width = size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-md" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className={`relative w-full ${width} ${EXCEL_PANEL} rounded-t-2xl sm:rounded-2xl`} role="dialog" aria-modal="true">
        <div className={`${EXCEL_PANEL_HEAD} flex items-center justify-between rounded-t-2xl`}>
          <h3 className="text-sm font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className={`${EXCEL_BTN} min-h-8 px-2.5 py-1`} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-4 py-4 text-sm">{children}</div>
        {footer ? (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-4 py-3 sm:flex-row sm:justify-end">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export default Modal;
