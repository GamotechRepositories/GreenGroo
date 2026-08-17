import React from "react";

export function SuperMallCategoryCard({ cat, onClick, isSelected }) {
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[22px] p-3 sm:p-4 min-h-[96px] sm:min-h-[118px] cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md border ${
        isSelected ? "border-indigo-600 ring-2 ring-indigo-500/30" : "border-slate-200/60"
      } ${cat.bgClass || "bg-[#F3F4F6]"}`}
    >
      <div className="relative z-10 max-w-[60%] sm:max-w-[62%] pr-0.5">
        <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight line-clamp-2">
          {cat.name}
        </h3>
        <p className="mt-1 text-[9.5px] sm:text-xs font-bold text-slate-500 truncate">
          {cat.itemCount}
        </p>
      </div>

      <div className="absolute right-1 bottom-1 sm:right-2 sm:bottom-2 h-12 w-12 sm:h-18 sm:w-18 overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
        <img src={cat.image} alt={cat.name} className="h-full w-full object-cover rounded-xl shadow-2xs" />
      </div>
    </div>
  );
}

export default SuperMallCategoryCard;
