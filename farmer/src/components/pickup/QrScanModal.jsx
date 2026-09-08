import { useEffect, useRef, useState } from "react";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY, EXCEL_INPUT } from "../../utils/excelStyles";

export default function QrScanModal({ open, onClose, onScan, title = "Scan QR", error = "" }) {
  const [raw, setRaw] = useState("");
  const [camError, setCamError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    const start = async () => {
      if (!("BarcodeDetector" in window) || !navigator.mediaDevices?.getUserMedia) {
        setCamError("Camera unavailable. Paste the scanned QR below.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        let found = false;
        const tick = async () => {
          if (!active || !videoRef.current || found) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes[0]?.rawValue) {
              found = true;
              onScanRef.current(codes[0].rawValue);
              return;
            }
          } catch {
            /* keep scanning */
          }
          if (active && !found) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      } catch {
        setCamError("Camera unavailable. Paste the scanned QR below.");
      }
    };
    start();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white p-4 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-[#1F2937]">{title}</p>
          <button type="button" className="text-xs font-semibold text-[#6B7280]" onClick={onClose}>
            Close
          </button>
        </div>
        <video ref={videoRef} className="h-44 w-full bg-black object-cover" muted playsInline />
        <p className="mt-2 text-[11px] text-[#6B7280]">
          {camError || "Point the camera at the batch QR, or paste the scanned value."}
        </p>
        {error ? <p className="mt-2 text-[11px] text-red-600">{error}</p> : null}
        <div className="mt-3 flex gap-2">
          <input
            className={`${EXCEL_INPUT} !min-h-10 !py-2 !text-xs`}
            placeholder="greengroo:batch:… or greengroo:order:…"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          <button
            type="button"
            disabled={!raw.trim()}
            className={EXCEL_BTN_PRIMARY}
            onClick={() => onScan(raw.trim())}
          >
            Open
          </button>
        </div>
        <button type="button" className={`${EXCEL_BTN} mt-2 w-full`} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
