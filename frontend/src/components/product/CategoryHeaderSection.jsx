import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

function buildCategoryUrl(categoryName, params = {}) {
  const search = new URLSearchParams();
  search.set("categoryName", categoryName);
  if (params.subcategory) search.set("subcategory", params.subcategory);
  if (params.brand) search.set("brand", params.brand);
  if (params.sort) search.set("sort", params.sort);
  return `/product?${search.toString()}`;
}

function CategoryHeaderImage({ image, name }) {
  const [failed, setFailed] = useState(false);

  if (!image || failed) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-mobile-surface sm:h-11 sm:w-11">
        <span className="text-sm font-bold uppercase text-text-muted">
          {name?.charAt(0) || "?"}
        </span>
      </div>
    );
  }

  return (
    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-mobile-surface sm:h-11 sm:w-11">
      <img
        src={image}
        alt={name}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function ScrollArrow({ direction, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Scroll subcategories left" : "Scroll subcategories right"}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border-light bg-white text-primary shadow-sm transition hover:border-primary hover:bg-orange-50"
    >
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        {direction === "left" ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
        )}
      </svg>
    </button>
  );
}

function SubcategoryPillScroller({ categoryName, subcategories, activeSubcategory, preservedFilters }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const pills = ["All", ...subcategories];

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
  }, [subcategories, updateScrollState]);

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({ left: direction * 220, behavior: "smooth" });
    window.setTimeout(updateScrollState, 320);
  };

  return (
    <div className="relative flex items-center gap-1.5">
      {canScrollLeft ? <ScrollArrow direction="left" onClick={() => scroll(-1)} /> : null}

      <div className="relative min-w-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className={`hide-scrollbar flex items-center gap-1.5 overflow-x-auto scroll-smooth py-0.5 ${
            canScrollRight ? "pr-2" : ""
          }`}
        >
          {pills.map((pill) => {
            const isAll = pill === "All";
            const isActive = isAll ? !activeSubcategory : activeSubcategory === pill;
            const to = isAll
              ? buildCategoryUrl(categoryName, preservedFilters)
              : buildCategoryUrl(categoryName, { ...preservedFilters, subcategory: pill });

            return (
              <Link
                key={pill}
                to={to}
                className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium transition sm:px-2.5 sm:py-1 sm:text-xs ${
                  isActive
                    ? "border-primary bg-primary text-white"
                    : "border-border-light bg-white text-text-primary hover:border-primary/40"
                }`}
              >
                {pill}
              </Link>
            );
          })}
        </div>

        {canScrollRight ? (
          <>
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white via-white/90 to-transparent"
              aria-hidden="true"
            />
            <div className="absolute right-0 top-1/2 z-10 -translate-y-1/2">
              <ScrollArrow direction="right" onClick={() => scroll(1)} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function CategoryHeaderSection({ category, categoryName, subcategories = [], activeSubcategory }) {
  const [searchParams] = useSearchParams();
  const preservedFilters = {
    brand: searchParams.get("brand")?.trim() || "",
    sort: searchParams.get("sort")?.trim() || "",
  };

  const subtitle =
    subcategories.length > 0
      ? subcategories.join(", ")
      : `Browse our wholesale ${categoryName} collection.`;

  return (
    <section className="rounded-lg border border-border-light bg-white px-2.5 py-2 shadow-sm sm:px-3 sm:py-2.5">
      <div className="flex items-center gap-2 sm:gap-2.5">
        <CategoryHeaderImage image={category?.categoryImage} name={categoryName} />
        <div className="min-w-0">
          <h1 className="text-sm font-bold leading-tight text-text-primary sm:text-base">
            {categoryName}
          </h1>
          <p className="mt-0.5 truncate text-[10px] leading-tight text-text-secondary sm:text-xs">
            {subtitle}
          </p>
        </div>
      </div>

      {subcategories.length > 0 ? (
        <div className="mt-1.5 sticky top-[7.25rem] z-20 -mx-2.5 bg-white px-2.5 pt-1.5 sm:-mx-3 sm:px-3 lg:static lg:mx-0 lg:bg-transparent lg:px-0">
          <div className="mb-1 flex items-center gap-2">
            <p className="shrink-0 text-[10px] font-semibold text-text-primary sm:text-xs">
              Subcategory:
            </p>
            <div className="min-w-0 flex-1">
              <SubcategoryPillScroller
                categoryName={categoryName}
                subcategories={subcategories}
                activeSubcategory={activeSubcategory}
                preservedFilters={preservedFilters}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default CategoryHeaderSection;
