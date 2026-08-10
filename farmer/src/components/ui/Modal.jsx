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
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className={`relative w-full ${width} ${EXCEL_PANEL}`} role="dialog" aria-modal="true">
        <div className={`${EXCEL_PANEL_HEAD} flex items-center justify-between`}>
          <h3 className="text-xs font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className={EXCEL_BTN} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-3 py-3 text-xs">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-[#D4D4D4] px-3 py-2">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export default Modal;
