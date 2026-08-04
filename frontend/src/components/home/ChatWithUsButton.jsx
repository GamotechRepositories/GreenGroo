import { useEffect, useRef, useState } from "react";
import {
  CONTACT_PHONE_TEL,
  CONTACT_WHATSAPP_URL,
} from "../../config/contact";
import { getAndroidAppDownloadUrl } from "../../utils/appDownload";

function WhatsAppIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function CallIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  );
}

function DownloadAppIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
      />
    </svg>
  );
}

function ChatWithUsButton() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const playStoreUrl = getAndroidAppDownloadUrl();

  useEffect(() => {
    if (!open) return undefined;

    let handlePointerDown;
    let handleKeyDown;

    const timer = window.setTimeout(() => {
      handlePointerDown = (event) => {
        if (!rootRef.current?.contains(event.target)) {
          setOpen(false);
        }
      };

      handleKeyDown = (event) => {
        if (event.key === "Escape") setOpen(false);
      };

      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("touchstart", handlePointerDown);
      document.addEventListener("keydown", handleKeyDown);
    }, 50);

    return () => {
      window.clearTimeout(timer);
      if (handlePointerDown) {
        document.removeEventListener("mousedown", handlePointerDown);
        document.removeEventListener("touchstart", handlePointerDown);
      }
      if (handleKeyDown) {
        document.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative flex flex-col items-end">
      {open ? (
        <div className="absolute bottom-[calc(100%+0.5rem)] right-0 z-10 flex w-fit items-center gap-1.5 rounded-full border border-border-light bg-white p-1 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
          <a
            href={CONTACT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            aria-label="WhatsApp"
            title="WhatsApp"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white transition hover:brightness-110"
          >
            <WhatsAppIcon />
          </a>
          <a
            href={CONTACT_PHONE_TEL}
            onClick={() => setOpen(false)}
            aria-label="Call"
            title="Call"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white transition hover:brightness-110"
          >
            <CallIcon />
          </a>
          <a
            href={playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            aria-label="Download app"
            title="Download app"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#01875f] text-white transition hover:brightness-110"
          >
            <DownloadAppIcon />
          </a>
        </div>
      ) : null}

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        aria-expanded={open}
        aria-label={open ? "Close options" : "More options"}
        title={open ? "Close" : "More options"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-[0_8px_20px_rgba(249,115,22,0.4)] transition hover:brightness-105 active:scale-[0.98]"
      >
        {open ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="5" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="12" cy="19" r="1.8" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default ChatWithUsButton;
