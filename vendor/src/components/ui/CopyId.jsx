import { useState } from "react";

function CopyIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);
}

export function formatVehicleId(vehicleId, vehicleNumber) {
  const plate = String(vehicleNumber || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const stored = String(vehicleId || "").trim();
  if (!plate) return stored;
  const prefix = `GGC-VH-${plate}`;
  if (stored.toUpperCase().startsWith(prefix)) return stored;
  return prefix;
}

export function isCopyableId(label, value) {
  const v = String(value || "").trim();
  if (!v || v === "—") return false;
  if (/\bid\s*$/i.test(String(label || "").trim())) return true;
  return /^GGC-[A-Z0-9-]+$/i.test(v);
}

export function CopyButton({ value, label = "Copy ID" }) {
  const [copied, setCopied] = useState(false);
  const text = String(value || "").trim();
  if (!text || text === "—") return null;

  const copy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await copyText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? "Copied" : label}
      aria-label={copied ? "Copied" : label}
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#6B7280] hover:bg-gray-100 hover:text-[#217346]"
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5 text-[#217346]" /> : <CopyIcon className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function CopyId({
  value,
  className = "",
  textClassName = "font-mono text-[11px] font-semibold text-[#217346]",
  breakAll = false,
}) {
  const text = String(value || "").trim();
  if (!text || text === "—") {
    return <span className={textClassName}>—</span>;
  }

  return (
    <span className={`inline-flex max-w-full min-w-0 items-start gap-0.5 ${className}`}>
      <span className={`min-w-0 ${breakAll ? "break-all" : "truncate"} ${textClassName}`} title={text}>
        {text}
      </span>
      <CopyButton value={text} />
    </span>
  );
}
