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
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-mobile-surface">
        <GridIcon className="h-6 w-6 text-text-secondary" />
      </div>
    );
  }

  if (!image || failed) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mobile-surface">
        <span className="text-sm font-bold uppercase text-text-muted">
          {name?.charAt(0) || "?"}
        </span>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={name}
      className="h-12 w-12 shrink-0 rounded-lg bg-white object-contain p-1"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default SidebarCategoryImage;
