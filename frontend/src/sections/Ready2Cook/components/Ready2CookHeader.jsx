import React from "react";
import { Link } from "react-router-dom";
import SearchBar from "../../../components/common/SearchBar";
import { Gift } from "lucide-react";

export function Ready2CookHeader() {
  return (
    <header className="bg-gradient-to-b from-[#C2410C] via-[#EA580C] to-[#F97316] px-4 py-3 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link to="/ready2cook" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">🍳</span>
          <span className="text-lg font-black tracking-tight hidden xs:inline">Ready2Cook</span>
        </Link>
        <SearchBar placeholder='Search "Chopped Onions", "Cut Veggies"...' className="hidden sm:flex flex-1 max-w-md" />
        
        <div className="flex items-center gap-2">
          <Link
            to="/coupons"
            className="flex h-10 items-center justify-between gap-1.5 rounded-xl bg-amber-50 px-2.5 py-1 text-slate-900 shadow-xs border border-amber-300 hover:bg-amber-100 transition"
          >
            <div className="leading-tight text-left">
              <p className="text-[10px] font-black text-[#C2410C]">Super</p>
              <p className="text-[10px] font-black text-amber-700">Offers 🎁</p>
            </div>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-700 text-amber-300 p-0.5">
              <Gift className="h-4 w-4" />
            </div>
          </Link>

          <Link
            to="/ready2cook/shop"
            className="rounded-xl bg-amber-400 px-3 py-2 text-xs font-black text-slate-950 shadow-xs hover:bg-amber-300 shrink-0"
          >
            Explore Prep
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Ready2CookHeader;
