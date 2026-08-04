import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildProductSearchUrl } from "../../utils/productSearch";

function MobileSearchBar({ className = "", autoFocus = false, onSubmit }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(buildProductSearchUrl(trimmed));
    onSubmit?.();
  };

  return (
    <form
      className={`flex items-center gap-2 rounded-full border border-border-light bg-white px-3 py-2 shadow-sm sm:px-4 sm:py-2.5 ${className}`}
      onSubmit={handleSubmit}
    >
      <svg
        className="h-4 w-4 shrink-0 text-text-secondary sm:h-5 sm:w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Products..."
        autoFocus={autoFocus}
        className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none sm:text-base"
      />
      <button
        type="submit"
        className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white sm:px-4 sm:text-sm"
      >
        Go
      </button>
    </form>
  );
}

export default MobileSearchBar;
