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
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
        <GridIcon className="h-5 w-5 text-primary" />
      </div>
    );
  }

  if (!image || failed) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 border border-emerald-100">
        <span className="text-xs font-extrabold uppercase text-primary">
          {name?.charAt(0) || "?"}
        </span>
      </div>
    );
  }

  return (
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white border border-slate-100 shadow-sm p-0.5 flex items-center justify-center">
      <img
        src={image}
        alt={name}
        className="h-full w-full object-contain rounded-lg"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default SidebarCategoryImage;
