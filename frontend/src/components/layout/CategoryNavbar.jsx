import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";

function CategoryPill({ name, isActive, compact = false }) {
  return (
    <Link
      to={`/product?categoryName=${encodeURIComponent(name)}`}
      className={`shrink-0 whitespace-nowrap rounded-full border bg-white font-medium transition-colors hover:border-primary hover:text-primary ${
        compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1 text-xs"
      } ${
        isActive
          ? "border-primary text-primary"
          : "border-neutral-200 text-neutral-700"
      }`}
    >
      {name}
    </Link>
  );
}

function ScrollArrow({ direction, onClick, compact = false }) {
  const sizeClass = compact ? "h-7 w-7" : "h-8 w-8";
  const iconClass = compact ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Scroll categories left" : "Scroll categories right"}
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-primary shadow-sm transition hover:border-primary hover:bg-orange-50`}
    >
      <svg
        className={iconClass}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        {direction === "left" ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
        )}
      </svg>
    </button>
  );
}

function CategoryPillScroller({ categories, activeCategory, compact = false }) {
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
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [categories, updateScrollState]);

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({
      left: direction * (compact ? 180 : 260),
      behavior: "smooth",
    });
    window.setTimeout(updateScrollState, 320);
  };

  return (
    <div className="relative flex items-center gap-2">
      {canScrollLeft && (
        <ScrollArrow direction="left" onClick={() => scroll(-1)} compact={compact} />
      )}

      <div className="relative min-w-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className={`flex items-center overflow-x-auto hide-scrollbar scroll-smooth ${
            compact ? "gap-1.5 py-0.5" : "gap-2 py-0.5"
          } ${canScrollRight ? "pr-2" : ""}`}
        >
          {categories.map((category) => {
            const name = category.categoryName;
            const isActive =
              activeCategory.toLowerCase() === String(name || "").toLowerCase();

            return (
              <CategoryPill
                key={category._id || name}
                name={name}
                isActive={isActive}
                compact={compact}
              />
            );
          })}
        </div>

        {canScrollRight && (
          <>
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white via-white/90 to-transparent"
              aria-hidden="true"
            />
            <div className="absolute right-0 top-1/2 z-10 -translate-y-1/2">
              <ScrollArrow direction="right" onClick={() => scroll(1)} compact={compact} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CategoryNavbar() {
  const { data: allCategories = [] } = useCategoriesQuery();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("categoryName")?.trim() || "";

  const categories = useMemo(
    () =>
      allCategories.filter(
        (cat) => cat.categoryName?.toLowerCase() !== "most purchase"
      ),
    [allCategories]
  );

  if (!categories.length) return null;

  return (
    <nav
      aria-label="Product categories"
      className="fixed left-0 right-0 top-[72px] z-40 hidden bg-white lg:block"
    >
      <div className="mx-auto max-w-[1600px] px-5 pb-2 pt-0 xl:px-8">
        <CategoryPillScroller categories={categories} activeCategory={activeCategory} />
      </div>
    </nav>
  );
}

export default CategoryNavbar;
