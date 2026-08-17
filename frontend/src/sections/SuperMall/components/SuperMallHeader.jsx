import React from "react";
import { Link } from "react-router-dom";
import SearchBar from "../../../components/common/SearchBar";
import { Gift } from "lucide-react";

export function SuperMallHeader() {
  return (
    <header className="bg-gradient-to-b from-[#1E1B4B] via-[#312E81] to-[#3730A3] px-4 py-3 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link to="/super-mall" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🛍️</span>
          <span className="text-lg font-black tracking-tight hidden xs:inline">Super Mall</span>
        </Link>
        <SearchBar placeholder='Search "Atta", "Oil", "Biscuits", "Snacks"...' className="hidden sm:flex flex-1 max-w-md" />
        
        <div className="flex items-center gap-2">
          <Link
            to="/coupons"
            className="flex h-10 items-center justify-between gap-1.5 rounded-xl bg-indigo-50 px-2.5 py-1 text-slate-900 shadow-xs border border-indigo-200 hover:bg-indigo-100 transition"
          >
            <div className="leading-tight text-left">
              <p className="text-[10px] font-black text-[#312E81]">Super</p>
              <p className="text-[10px] font-black text-indigo-700">Offers 🎁</p>
            </div>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-900 text-amber-300 p-0.5">
              <Gift className="h-4 w-4" />
            </div>
          </Link>

          <Link
            to="/super-mall/shop"
            className="rounded-xl bg-amber-400 px-3 py-2 text-xs font-black text-slate-950 shadow-xs hover:bg-amber-300 shrink-0"
          >
            Mall Deals
          </Link>
        </div>
      </div>
    </header>
  );
}

export default SuperMallHeader;
