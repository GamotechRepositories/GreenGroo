import React from "react";
import { Link } from "react-router-dom";
import SearchBar from "../../../components/common/SearchBar";

export function SuperMallHeader() {
  return (
    <header className="bg-gradient-to-b from-[#0F172A] via-[#1E1B4B] to-[#312E81] px-4 py-3 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link to="/super-mall" className="flex items-center gap-2">
          <span className="text-xl">🛍️</span>
          <div className="leading-tight">
            <span className="block text-sm font-black text-white">Super</span>
            <span className="block text-sm font-black text-[#60A5FA]">Mall.</span>
          </div>
        </Link>
        <SearchBar placeholder='Search for "Grocery", "Brands"...' className="hidden sm:flex flex-1 max-w-md" />
        <Link
          to="/super-mall/shop"
          className="rounded-xl bg-indigo-500 px-3.5 py-1.5 text-xs font-black text-white shadow-xs hover:bg-indigo-400"
        >
          Super Deals
        </Link>
      </div>
    </header>
  );
}

export default SuperMallHeader;
