import { useEffect, useRef, useState } from "react";
import { LOGO_URL } from "../layout/Header";
import {
  dismissAppDownloadPrompt,
  downloadAndroidApp,
  hasDismissedAppDownloadPrompt,
  shouldOfferAppDownload,
} from "../../utils/appDownload";

const SWIPE_DISMISS_PX = 72;

function AppDownloadPrompt() {
  const [open, setOpen] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const dragAxisRef = useRef(null);

  useEffect(() => {
    if (!shouldOfferAppDownload() || hasDismissedAppDownloadPrompt()) return undefined;

    const timer = window.setTimeout(() => {
      setOpen(true);
      window.dispatchEvent(new CustomEvent("bmm-app-download-prompt", { detail: { open: true } }));
    }, 900);

    return () => window.clearTimeout(timer);
  }, []);

  const closePrompt = () => {
    dismissAppDownloadPrompt();
    setOpen(false);
    setDragX(0);
    setIsDragging(false);
    dragAxisRef.current = null;
    window.dispatchEvent(new CustomEvent("bmm-app-download-prompt", { detail: { open: false } }));
  };

  const handleDownload = () => {
    downloadAndroidApp();
    closePrompt();
  };

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    dragAxisRef.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (event) => {
    if (!isDragging) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;

    if (!dragAxisRef.current) {
      if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;
      dragAxisRef.current = Math.abs(deltaX) >= Math.abs(deltaY) ? "x" : "y";
    }

    if (dragAxisRef.current === "x") {
      setDragX(Math.max(0, deltaX));
      return;
    }

    setDragX(Math.max(0, deltaY));
  };

  const handleTouchEnd = () => {
    if (dragX >= SWIPE_DISMISS_PX) {
      closePrompt();
      return;
    }

    setDragX(0);
    setIsDragging(false);
    dragAxisRef.current = null;
  };

  if (!open) return null;

  const dragOpacity = Math.max(0.35, 1 - dragX / 160);
  const dragTransform =
    dragAxisRef.current === "y" ? `translateY(${dragX}px)` : `translateX(${dragX}px)`;

  return (
    <>
      {/* Desktop: compact notification with close icon */}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[130] hidden w-full max-w-md lg:block"
      >
        <div className="flex items-center gap-3 rounded-xl border border-border-light bg-white px-3 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 p-1.5">
            <img src={LOGO_URL} alt="" className="h-full w-full object-contain" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-text-primary">Get the BulkMobileMart app</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              Faster ordering and order tracking on Google Play.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white transition hover:brightness-110"
          >
            Play Store
          </button>

          <button
            type="button"
            onClick={closePrompt}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-secondary transition hover:bg-mobile-surface hover:text-text-primary"
            aria-label="Dismiss app download notification"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile: notification bar — swipe right or down to dismiss */}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-[4.75rem] left-3 right-3 z-[130] lg:hidden"
        style={{
          transform: dragTransform,
          opacity: dragOpacity,
          transition: isDragging ? "none" : "transform 0.2s ease, opacity 0.2s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-3 rounded-xl border border-border-light bg-white px-3 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.14)]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary/5 p-1.5">
            <img src={LOGO_URL} alt="" className="h-full w-full object-contain" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-text-primary">Get our Android app</p>
            <p className="text-[11px] text-text-muted">Swipe to dismiss</p>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white"
          >
            Play Store
          </button>
        </div>
      </div>
    </>
  );
}

export default AppDownloadPrompt;
