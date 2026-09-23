import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import CategoryCard from "./CategoryCard";
import { sectionToStoreKey, storeToSection } from "../../utils/storeSection";

function CategoryPills() {
  const [searchParams] = useSearchParams();
  const currentStore = sectionToStoreKey(searchParams.get("store"));
  const targetSection = storeToSection(currentStore);

  const { data: dbCategories = [], isLoading } = useCategoriesQuery({
    section: targetSection,
  });

  const displayList = useMemo(() => {
    if (!Array.isArray(dbCategories) || dbCategories.length === 0) return [];
    return dbCategories.map((c) => ({
      _id: c._id,
      slug: c.categoryName,
      categoryName: c.categoryName,
      name: c.categoryName,
      categoryImage: c.categoryImage,
      image: c.categoryImage,
      itemCount:
        c.itemCount || (c.productCount ? `${c.productCount}+ items` : "Shop now"),
      items: c.itemCount || (c.productCount ? `${c.productCount}+ items` : "Shop now"),
      emoji: c.emoji,
      bg: c.bg,
      bgClass: c.bgClass,
    }));
  }, [dbCategories]);

  return (
    <section className="px-4 py-4 sm:px-6 lg:px-0 lg:py-0">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
              Shop by Category
            </h2>
            <p className="mt-1 text-xs sm:text-sm font-medium text-gray-500">
              Fresh picks for every kitchen need
            </p>
          </div>
          <Link
            to={
              currentStore && currentStore !== "main"
                ? `/categories?store=${currentStore}`
                : "/categories"
            }
            className="flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            View All
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {isLoading && displayList.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading categories…</p>
        ) : displayList.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No categories yet. Add them in Product Management.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 lg:gap-4">
            {displayList.map((cat) => (
              <CategoryCard
                key={cat._id || cat.slug || cat.categoryName || cat.name}
                cat={cat}
                store={currentStore}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default CategoryPills;
