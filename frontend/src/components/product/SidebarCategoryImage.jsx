import { useState } from "react";

function GridIcon({ className = "h-6 w-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  );
}

function SidebarCategoryImage({ image, name, showGrid = false }) {
  const [failed, setFailed] = useState(false);

  if (showGrid || (!image && name === "All Categories")) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 shadow-xs">
        <GridIcon className="h-7 w-7 text-emerald-600" />
      </div>
    );
  }

  if (!image || failed) {
    return (
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 border border-emerald-100">
        <span className="text-sm font-extrabold uppercase text-emerald-700">
          {name?.charAt(0) || "?"}
        </span>
      </div>
    );
  }

  return (
    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-xs">
      <img
        src={image}
        alt={name}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default SidebarCategoryImage;
