import React from "react";
import { Link } from "react-router-dom";
import SearchBar from "../../../components/common/SearchBar";
import { Gift } from "lucide-react";

export function GreenGroccHeader() {
  return (
    <header className="bg-gradient-to-b from-[#064E3B] via-[#047857] to-[#059669] px-4 py-3 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link to="/greengrocc" className="flex items-center gap-2 shrink-0">
          <img src="/greengrocc-logo.png" alt="GreenGrocc" className="h-9 w-auto object-contain" />
          <span className="text-lg font-black tracking-tight hidden xs:inline">GreenGrocc</span>
        </Link>
        <SearchBar placeholder='Search "Farm Fresh Vegetables", "Fruits"...' className="hidden sm:flex flex-1 max-w-md" />
        
        <div className="flex items-center gap-2">
          <Link
            to="/coupons"
            className="flex h-10 items-center justify-between gap-1.5 rounded-xl bg-amber-50 px-2.5 py-1 text-slate-900 shadow-xs border border-amber-300 hover:bg-amber-100 transition"
          >
            <div className="leading-tight text-left">
              <p className="text-[10px] font-black text-[#047857]">Super</p>
              <p className="text-[10px] font-black text-amber-700">Offers 🎁</p>
            </div>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-amber-300 p-0.5">
              <Gift className="h-4 w-4" />
            </div>
          </Link>
          
          <Link
            to="/greengrocc/shop"
            className="rounded-xl bg-amber-400 px-3 py-2 text-xs font-black text-slate-950 shadow-xs hover:bg-amber-300 shrink-0"
          >
            Shop Fresh
          </Link>
        </div>
      </div>
    </header>
  );
}

export default GreenGroccHeader;
