import React from "react";
import { Link } from "react-router-dom";
import SearchBar from "../../../components/common/SearchBar";

export function Ready2CookHeader() {
  return (
    <header className="bg-gradient-to-b from-[#C2410C] via-[#EA580C] to-[#F97316] px-4 py-3 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link to="/ready2cook" className="flex items-center gap-2">
          <span className="text-xl">🍳</span>
          <span className="text-lg font-black tracking-tight">Ready2Cook</span>
        </Link>
        <SearchBar placeholder='Search "Chopped Onions", "Cut Veggies"...' className="hidden sm:flex flex-1 max-w-md" />
        <Link
          to="/ready2cook/shop"
          className="rounded-xl bg-amber-400 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-xs hover:bg-amber-300"
        >
          Explore Prep Foods
        </Link>
      </div>
    </header>
  );
}

export default Ready2CookHeader;
