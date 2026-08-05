import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildProductSearchUrl } from "../../utils/productSearch";

const SUGGESTIONS = ["atta", "paneer", "milk", "banana", "tomato", "bread", "rice", "eggs"];

function ScrollingPlaceholder({ active }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return undefined;
    }

    const id = window.setInterval(() => {
      setIndex((prev) => prev + 1);
    }, 2000);

    return () => window.clearInterval(id);
  }, [active]);

  // Loop without visible jump: duplicate first item at end, then snap back
  useEffect(() => {
    if (!active) return undefined;
    if (index < SUGGESTIONS.length) return undefined;

    const id = window.setTimeout(() => {
      setIndex(0);
    }, 350);

    return () => window.clearTimeout(id);
  }, [active, index]);

  if (!active) return null;

  const items = [...SUGGESTIONS, SUGGESTIONS[0]];
  const offset = index % (SUGGESTIONS.length + 1);

  return (
    <span
      className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[15px] font-normal text-text-muted"
      aria-hidden="true"
    >
      <span>Search&nbsp;</span>
      <span className="relative inline-block h-[1.2em] overflow-hidden align-middle">
        <span
          className="inline-flex flex-col"
          style={{
            transform: `translateY(-${offset * 1.2}em)`,
            transition: index === 0 ? "none" : "transform 0.35s ease-out",
          }}
        >
          {items.map((word, i) => (
            <span key={`${word}-${i}`} className="h-[1.2em] leading-[1.2em]">
              &quot;{word}&quot;
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

function DesktopSearchBar({ className = "" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const showPlaceholder = !query && !focused;

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
    <form
      className={`flex h-12 items-center gap-3 rounded-full bg-[#F8F8F8] px-4 transition focus-within:bg-[#F0F0F0] ${className}`}
      onSubmit={handleSubmit}
    >
      <svg
        className="h-[18px] w-[18px] shrink-0 text-text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <div className="relative min-w-0 flex-1">
        <ScrollingPlaceholder active={showPlaceholder} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent text-[15px] font-medium text-text-primary focus:outline-none"
          aria-label="Search products"
        />
      </div>
    </form>
  );
}

export default DesktopSearchBar;
