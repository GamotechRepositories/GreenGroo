import { useEffect } from "react";

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

  const width =
    size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-md" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${width} rounded-2xl border border-[#E5E7EB] bg-white shadow-xl`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
          <h3 className="text-base font-semibold text-[#1F2937]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#6B7280] hover:bg-[#F3F4F6]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-[#E5E7EB] px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export default Modal;
