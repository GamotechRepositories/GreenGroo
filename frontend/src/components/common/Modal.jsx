import React, { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div
        className={`relative w-full ${maxWidth} overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-slate-100`}
      >
        {title ? (
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 rounded-full bg-slate-100 p-1 text-slate-600 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
