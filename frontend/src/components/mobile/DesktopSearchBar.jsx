import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildProductSearchUrl } from "../../utils/productSearch";

const SUGGESTIONS = ["atta", "paneer", "milk", "banana", "tomato", "bread", "rice", "eggs"];
const LINE_PX = 18;

function ScrollingPlaceholder({ active }) {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      setAnimate(true);
      return undefined;
    }

    const id = window.setInterval(() => {
      setAnimate(true);
      setIndex((prev) => prev + 1);
    }, 2000);

    return () => window.clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active) return undefined;
    if (index < SUGGESTIONS.length) return undefined;

    const id = window.setTimeout(() => {
      setAnimate(false);
      setIndex(0);
    }, 350);

    return () => window.clearTimeout(id);
  }, [active, index]);

  if (!active) return null;

  const items = [...SUGGESTIONS, SUGGESTIONS[0]];
  const offset = index % (SUGGESTIONS.length + 1);

  return (
    <span
      className="pointer-events-none absolute inset-0 flex items-center text-[12.5px] font-normal text-gray-400"
      aria-hidden="true"
    >
      <span className="leading-none">Search&nbsp;</span>
      <span className="relative inline-block overflow-hidden align-middle" style={{ height: LINE_PX }}>
        <span
          className="inline-flex flex-col will-change-transform"
          style={{
            transform: `translateY(-${offset * LINE_PX}px)`,
            transition: animate ? "transform 0.35s ease-out" : "none",
          }}
        >
          {items.map((word, i) => (
            <span
              key={`${word}-${i}`}
              className="flex items-center leading-none"
              style={{ height: LINE_PX }}
            >
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
      className={`group flex h-8 w-full max-w-[220px] items-center gap-2 rounded-lg border border-gray-200/90 bg-[#F4F6F5] px-2.5 transition-all duration-200 hover:border-gray-300 hover:bg-[#EEF1F0] focus-within:border-[#0C831F]/40 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(12,131,31,0.08)] xl:max-w-[260px] ${className}`}
      onSubmit={handleSubmit}
    >
      <svg
        className="h-3.5 w-3.5 shrink-0 text-gray-400 transition-colors group-focus-within:text-[#0C831F]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.1}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      <div className="relative flex h-5 min-w-0 flex-1 items-center overflow-hidden">
        <ScrollingPlaceholder active={showPlaceholder} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="h-full w-full bg-transparent text-[12.5px] font-medium leading-none text-gray-900 placeholder:text-gray-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          aria-label="Search products"
        />
      </div>
    </form>
  );
}

export default DesktopSearchBar;
