import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import {
  sectionToStoreKey,
  storeToSection,
  buildStoreProductUrl,
} from "../../utils/storeSection";

/** Compact category strip for the sticky main navbar center. */
function CategoryNavbar({ className = "", compact = false }) {
  const [searchParams] = useSearchParams();
  const currentStore = sectionToStoreKey(searchParams.get("store"));
  const section = storeToSection(currentStore);
  const activeCategory = searchParams.get("categoryName")?.trim() || "";
  const { data: allCategories = [] } = useCategoriesQuery({ section });

  const categories = useMemo(
    () =>
      (allCategories || []).filter(
        (cat) => cat.categoryName?.toLowerCase() !== "most purchase"
      ),
    [allCategories]
  );

  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = 0;
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [categories, section, updateScrollState]);

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({ left: direction * 180, behavior: "smooth" });
    window.setTimeout(updateScrollState, 320);
  };

  if (!categories.length) {
    return <div className={`min-w-0 flex-1 ${className}`} aria-hidden="true" />;
  }

  const pillBase =
    "shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[11.5px] font-semibold tracking-tight transition-all duration-200";

  return (
    <nav
      aria-label="Product categories"
      className={`relative flex min-w-0 flex-1 items-center justify-center ${className}`}
    >
      {canScrollLeft ? (
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Scroll categories left"
          className="absolute left-0 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200/80 bg-white/95 text-[#0C831F] shadow-sm backdrop-blur-sm transition hover:border-[#0C831F]/35 hover:bg-emerald-50"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      ) : null}

      <div
        key={section}
        ref={scrollRef}
        onScroll={updateScrollState}
        className={`hide-scrollbar flex max-w-full items-center justify-start gap-1.5 overflow-x-auto scroll-smooth px-1 py-0.5 animate-[fadeSlide_280ms_ease-out] ${
          canScrollLeft ? "pl-8" : ""
        } ${canScrollRight ? "pr-8" : ""} ${compact ? "" : ""}`}
      >
        <Link
          to={buildStoreProductUrl({ store: currentStore })}
          className={`${pillBase} ${
            !activeCategory
              ? "bg-[#0C831F] text-white shadow-[0_1px_4px_rgba(12,131,31,0.28)]"
              : "bg-gray-100/90 text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
          }`}
        >
          All
        </Link>
        {categories.map((category) => {
          const name = category.categoryName;
          const isActive =
            activeCategory.toLowerCase() === String(name || "").toLowerCase();

          return (
            <Link
              key={category._id || name}
              to={buildStoreProductUrl({ categoryName: name, store: currentStore })}
              className={`${pillBase} ${
                isActive
                  ? "bg-[#0C831F] text-white shadow-[0_1px_4px_rgba(12,131,31,0.28)]"
                  : "bg-gray-100/90 text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
              }`}
            >
              {name}
            </Link>
          );
        })}
      </div>

      {canScrollRight ? (
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Scroll categories right"
          className="absolute right-0 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200/80 bg-white/95 text-[#0C831F] shadow-sm backdrop-blur-sm transition hover:border-[#0C831F]/35 hover:bg-emerald-50"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
          </svg>
        </button>
      ) : null}
    </nav>
  );
}

export default CategoryNavbar;
