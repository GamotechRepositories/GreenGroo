import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import { buildProductSearchUrl } from "../../utils/productSearch";

function DesktopSearchBar({ className = "" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: allCategories = [] } = useCategoriesQuery();
  const categories = useMemo(
    () =>
      allCategories.filter(
        (cat) => cat.categoryName?.toLowerCase() !== "most purchase"
      ),
    [allCategories]
  );
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    setCategory(searchParams.get("categoryName") || "");
  }, [searchParams]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed && !category) {
      navigate("/product");
      return;
    }
    navigate(buildProductSearchUrl(trimmed, category));
  };

  return (
    <form
      className={`flex h-11 items-stretch overflow-hidden rounded-md border border-border-light bg-[#f3f3f3] ${className}`}
      onSubmit={handleSubmit}
    >
      <div className="relative flex shrink-0 items-center border-r border-border-light bg-[#ebebeb]">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-full cursor-pointer appearance-none bg-transparent py-0 pl-4 pr-8 text-sm font-medium text-text-primary focus:outline-none"
          aria-label="All Categories"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat.categoryName}>
              {cat.categoryName}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2 h-4 w-4 text-text-secondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for products, brands and more..."
        className="min-w-0 flex-1 bg-transparent px-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
      />

      <button
        type="submit"
        className="shrink-0 bg-primary px-6 text-sm font-bold text-white transition hover:brightness-110"
      >
        Search
      </button>
    </form>
  );
}

export default DesktopSearchBar;
