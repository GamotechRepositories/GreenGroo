import React, { useState } from "react";
import { Search } from "lucide-react";

export function SearchBar({ placeholder = 'Search for products...', onSearch, className = "" }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none transition-all shadow-xs"
      />
    </form>
  );
}

export default SearchBar;
