import { useState } from "react";

function GridIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}

const SIZE = {
  sm: "h-10 w-10",
  md: "h-11 w-11",
  lg: "h-14 w-14",
};

function SidebarCategoryImage({ image, name, showGrid = false, size = "md", active = false }) {
  const [failed, setFailed] = useState(false);
  const box = SIZE[size] || SIZE.md;
  const ring = active
    ? "ring-2 ring-[#0C831F]/35 ring-offset-1 ring-offset-white"
    : "ring-1 ring-gray-100";

  if (showGrid || (!image && name === "All Categories")) {
    return (
      <div
        className={`flex ${box} shrink-0 items-center justify-center rounded-xl bg-[#0C831F]/10 text-[#0C831F] transition-all duration-200 ${ring}`}
      >
        <GridIcon className="h-5 w-5" />
      </div>
    );
  }

  if (!image || failed) {
    return (
      <div
        className={`flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0C831F]/8 transition-all duration-200 ${ring}`}
      >
        <span className="text-[13px] font-bold uppercase tracking-wide text-[#0C831F]">
          {name?.charAt(0) || "?"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${box} shrink-0 overflow-hidden rounded-xl bg-white transition-all duration-200 ${ring}`}
    >
      <img
        src={image}
        alt={name || ""}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default SidebarCategoryImage;
