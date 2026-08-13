import { useState } from "react";

export default function StoreQrModal({ isOpen, onClose, storeName, area, qrCode }) {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(qrCode || "DARKSTORE_DEFAULT");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all border border-gray-100">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Dark Store QR Code</h3>
            <p className="text-xs text-gray-500">{storeName || "Dark Store Pickup Point"} · {area || "Location"}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="my-6 flex flex-col items-center justify-center text-center">
          <div className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6 border-2 border-emerald-500/20 shadow-inner">
            {/* SVG Visual Dark Store QR Code Graphic */}
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="rounded-lg shadow-sm bg-white p-2"
            >
              <rect width="200" height="200" fill="white" />
              {/* Outer Position Squares */}
              <rect x="15" y="15" width="50" height="50" fill="#059669" rx="6" />
              <rect x="25" y="25" width="30" height="30" fill="white" rx="4" />
              <rect x="33" y="33" width="14" height="14" fill="#059669" rx="2" />

              <rect x="135" y="15" width="50" height="50" fill="#059669" rx="6" />
              <rect x="145" y="25" width="30" height="30" fill="white" rx="4" />
              <rect x="153" y="33" width="14" height="14" fill="#059669" rx="2" />

              <rect x="15" y="135" width="50" height="50" fill="#059669" rx="6" />
              <rect x="25" y="145" width="30" height="30" fill="white" rx="4" />
              <rect x="33" y="153" width="14" height="14" fill="#059669" rx="2" />

              {/* Data Pattern Modules */}
              <rect x="75" y="20" width="15" height="15" fill="#10B981" rx="2" />
              <rect x="95" y="20" width="15" height="15" fill="#047857" rx="2" />
              <rect x="75" y="45" width="35" height="15" fill="#059669" rx="2" />

              <rect x="20" y="75" width="45" height="15" fill="#047857" rx="2" />
              <rect x="75" y="75" width="50" height="50" fill="#064E3B" rx="8" />
              <rect x="135" y="75" width="45" height="15" fill="#10B981" rx="2" />

              <rect x="85" y="85" width="30" height="30" fill="white" rx="6" />
              <path d="M100 92L108 108H92L100 92Z" fill="#059669" />

              <rect x="20" y="100" width="20" height="20" fill="#10B981" rx="2" />
              <rect x="45" y="100" width="20" height="25" fill="#047857" rx="2" />
              <rect x="135" y="100" width="20" height="25" fill="#059669" rx="2" />

              <rect x="75" y="135" width="15" height="45" fill="#10B981" rx="2" />
              <rect x="95" y="135" width="35" height="15" fill="#047857" rx="2" />
              <rect x="135" y="135" width="45" height="45" fill="#059669" rx="4" />
              <rect x="145" y="145" width="25" height="25" fill="white" rx="2" />
              <rect x="152" y="152" width="11" height="11" fill="#047857" rx="1" />
            </svg>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-2 text-xs font-mono text-gray-700 border border-gray-200 w-full">
            <span className="font-semibold text-emerald-700">QR CODE:</span>
            <span className="truncate">{qrCode || "DARKSTORE_DEFAULT"}</span>
            <button
              onClick={handleCopy}
              className="ml-auto rounded bg-emerald-600 px-2 py-1 text-[11px] font-sans font-semibold text-white hover:bg-emerald-700 active:scale-95 transition"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-500 max-w-xs">
            ⚡ Keep this QR Code visible at your dark store pickup desk. Drivers must scan it on arrival to unlock customer address & live map route.
          </p>
        </div>

        <div className="flex justify-end border-t border-gray-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
