import React from "react";

export function Loader({ size = "md", text = "Loading..." }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-2">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} animate-spin rounded-full border-emerald-600 border-t-transparent`}
      />
      {text ? <p className="text-xs font-semibold text-slate-500">{text}</p> : null}
    </div>
  );
}

export default Loader;
