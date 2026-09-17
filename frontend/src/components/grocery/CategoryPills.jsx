import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import { GROCERY_CATEGORIES } from "../../data/groceryCategories";
import { SUPER_MALL_CATEGORIES } from "../../data/superMallCategories";
import { READY2COOK_CATEGORIES } from "../../sections/Ready2Cook/data/categories";
import CategoryCard from "./CategoryCard";

function CategoryPills() {
  const [searchParams] = useSearchParams();
  const currentStore = searchParams.get("store")?.trim()?.toLowerCase() || "main";

  const targetSection =
    currentStore === "mall" ? "supermall" : currentStore === "festive" ? "ready2cook" : "greengrocc";

  // Fetch dynamic categories from MongoDB backend for the selected section
  const { data: dbCategories = [] } = useCategoriesQuery({ section: targetSection });

  const displayList = useMemo(() => {
    if (Array.isArray(dbCategories) && dbCategories.length > 0) {
      return dbCategories.map((c) => ({
        _id: c._id,
        slug: c.slug || c.categoryName,
        categoryName: c.categoryName,
        name: c.categoryName,
        categoryImage: c.categoryImage,
        image: c.categoryImage,
        itemCount: c.itemCount || (c.productCount ? `${c.productCount}+ items` : "50+ items"),
        items: c.itemCount || (c.productCount ? `${c.productCount}+ items` : "50+ items"),
        emoji: c.emoji,
        bg: c.bg,
        bgClass: c.bgClass,
        subcategories: c.subcategories,
      }));
    }

    if (currentStore === "mall") {
      return SUPER_MALL_CATEGORIES.map((c) => ({
        slug: c.slug,
        categoryName: c.name,
        name: c.name,
        itemCount: c.itemCount,
        bgClass: c.bgClass,
        categoryImage: c.image,
        image: c.image,
      }));
    }

    if (currentStore === "festive") {
      return READY2COOK_CATEGORIES.map((c) => ({
        slug: c.slug,
        categoryName: c.name,
        name: c.name,
        itemCount: c.itemCount,
        bgClass: c.bgClass,
        categoryImage: c.image,
        image: c.image,
      }));
    }

    return GROCERY_CATEGORIES;
  }, [currentStore, dbCategories]);

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
            to={currentStore && currentStore !== "main" ? `/categories?store=${currentStore}` : "/categories"}
            className="flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            View All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 lg:gap-4">
          {displayList.map((cat) => (
            <CategoryCard key={cat._id || cat.slug || cat.categoryName || cat.name} cat={cat} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategoryPills;
