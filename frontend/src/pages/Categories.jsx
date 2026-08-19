import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useCategoriesQuery } from "../hooks/queries/useCategoriesQuery";
import { GROCERY_CATEGORIES } from "../data/groceryCategories";
import { SUPER_MALL_CATEGORIES } from "../data/superMallCategories";
import { READY2COOK_SHOP_CATEGORIES } from "../components/home/FestiveStoreSection";
import CategoryCard from "../components/grocery/CategoryCard";

function Categories() {
  const [searchParams] = useSearchParams();
  const currentStore = searchParams.get("store")?.trim()?.toLowerCase() || "main";

  // Fetch dynamic categories from MongoDB
  const { data: dbCategories = [] } = useCategoriesQuery();

  let title = "All Categories";
  let subtitle = "Fresh picks for every kitchen need";

  const categoriesList = useMemo(() => {
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
      return READY2COOK_SHOP_CATEGORIES.map((c) => ({
        slug: c.slug,
        categoryName: c.name,
        name: c.name,
        itemCount: c.itemCount,
        bgClass: c.bgClass,
        categoryImage: c.image,
        image: c.image,
      }));
    }

    // Main Fresh Store: use dynamic categories from database with fallback
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

    return GROCERY_CATEGORIES;
  }, [currentStore, dbCategories]);

  if (currentStore === "mall") {
    title = "Super Mall Categories";
    subtitle = "Top brand groceries, essentials & packaged foods";
  } else if (currentStore === "festive") {
    title = "Ready2Cook Categories";
    subtitle = "Pre-washed, peeled & chopped ingredients for fast cooking";
  }

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-8">
      <div className="border-b border-border-light bg-gradient-to-br from-slate-50 via-white to-white px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[#0C831F] lg:text-sm">
            {currentStore === "mall"
              ? "Super Mall Marketplace"
              : currentStore === "festive"
              ? "Ready2Cook Kitchen"
              : "GreenGrocc Fresh"}
          </p>
          <h1 className="mt-1.5 text-2xl font-black text-slate-900 lg:text-4xl">
            {title}
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 lg:text-sm">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {categoriesList.map((cat) => (
            <CategoryCard
              key={cat._id || cat.slug || cat.categoryName || cat.name}
              cat={cat}
              size="lg"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Categories;
