import React from "react";
import { Link } from "react-router-dom";
import SearchBar from "../../../components/common/SearchBar";

export function GreenGroccHeader() {
  return (
    <header className="bg-gradient-to-b from-[#064E3B] via-[#047857] to-[#059669] px-4 py-3 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link to="/greengrocc" className="flex items-center gap-2">
          <img src="/greengrocc-logo.png" alt="GreenGrocc" className="h-9 w-auto object-contain" />
          <span className="text-lg font-black tracking-tight">GreenGrocc</span>
        </Link>
        <SearchBar placeholder='Search "Farm Fresh Vegetables", "Fruits"...' className="hidden sm:flex flex-1 max-w-md" />
        <Link
          to="/greengrocc/shop"
          className="rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-xs hover:bg-amber-300"
        >
          Shop Fresh
        </Link>
      </div>
    </header>
  );
}

export default GreenGroccHeader;
