import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { buildProductSearchUrl } from "../../utils/productSearch";

function HomeSearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      navigate("/product");
      return;
    }
    navigate(buildProductSearchUrl(trimmed));
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 pb-3 sm:px-6">
      <div className="flex items-center gap-2 rounded-xl border border-border-light bg-mobile-surface px-3 py-2.5 shadow-sm">
        <svg className="h-5 w-5 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for fruits, vegetables..."
          className="min-w-0 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>
    </form>
  );
}

export default HomeSearchBar;
