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
    <section className="bg-white px-4 py-4 sm:px-6 lg:px-0 lg:py-0">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-end justify-between lg:mb-5">
          <div>
            <h2 className="text-base font-bold text-text-primary lg:text-xl">
              Shop by Category
            </h2>
            <p className="mt-0.5 text-xs font-medium text-text-secondary lg:text-sm">
              Fresh picks for every kitchen need
            </p>
          </div>
          <Link
            to="/categories"
            className="text-sm font-semibold text-[#0C831F] hover:underline"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 md:grid-cols-3 lg:grid-cols-4 lg:gap-3.5">
          {displayList.map((cat) => (
            <CategoryCard key={cat._id || cat.slug || cat.categoryName || cat.name} cat={cat} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategoryPills;
