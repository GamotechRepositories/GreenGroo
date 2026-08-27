import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useCategoriesQuery } from "../hooks/queries/useCategoriesQuery";
import { useSectionsQuery, DEFAULT_FALLBACK_SECTIONS } from "../hooks/queries/useSectionsQuery";
import { GROCERY_CATEGORIES } from "../data/groceryCategories";
import { SUPER_MALL_CATEGORIES } from "../data/superMallCategories";
import { READY2COOK_SHOP_CATEGORIES } from "../components/home/FestiveStoreSection";
import CategoryCard from "../components/grocery/CategoryCard";

function Categories() {
  const [searchParams] = useSearchParams();
  const currentStore = searchParams.get("store")?.trim()?.toLowerCase() || "main";

  const targetSection =
    currentStore === "mall"
      ? "supermall"
      : currentStore === "festive"
      ? "ready2cook"
      : currentStore === "main"
      ? "greengrocc"
      : currentStore;

  // Fetch dynamic categories from MongoDB for this department
  const { data: dbCategories = [], isLoading: loadingCats } = useCategoriesQuery({
    section: targetSection,
  });
  const { data: sections = DEFAULT_FALLBACK_SECTIONS } = useSectionsQuery();

  const currentSecObj = useMemo(() => {
    const s = sections.find(
      (sec) =>
        sec.slug?.toLowerCase() === targetSection.toLowerCase() ||
        (targetSection === "greengrocc" && sec.slug === "greengrocc") ||
        (targetSection === "ready2cook" && sec.slug === "ready2cook") ||
        (targetSection === "supermall" && sec.slug === "supermall")
    );
    return s || null;
  }, [sections, targetSection]);

  const headerMeta = useMemo(() => {
    if (currentSecObj) {
      return {
        badge: currentSecObj.badge || currentSecObj.sectionName,
        title: `${currentSecObj.sectionName} Categories`,
        subtitle: currentSecObj.description || "Browse all curated product categories",
        color: currentSecObj.color || "#0C831F",
      };
    }
    if (currentStore === "mall") {
      return {
        badge: "Super Mall Marketplace",
        title: "Super Mall Categories",
        subtitle: "Top brand groceries, essentials & packaged foods",
        color: "#2563EB",
      };
    }
    if (currentStore === "festive") {
      return {
        badge: "Ready2Cook Kitchen",
        title: "Ready2Cook Categories",
        subtitle: "Pre-washed, peeled & chopped ingredients for fast cooking",
        color: "#EA580C",
      };
    }
    return {
      badge: "GreenGrocc Fresh",
      title: "All Categories",
      subtitle: "Fresh picks for every kitchen need",
      color: "#0C831F",
    };
  }, [currentSecObj, currentStore]);

  const categoriesList = useMemo(() => {
    // 1. Dynamic database categories
    if (Array.isArray(dbCategories) && dbCategories.length > 0) {
      return dbCategories.map((c) => ({
        _id: c._id,
        slug: c.slug || c.categoryName,
        categoryName: c.categoryName,
        name: c.categoryName,
        categoryImage: c.categoryImage,
        image: c.categoryImage,
        itemCount:
          c.itemCount || (c.productCount ? `${c.productCount}+ items` : "50+ items"),
        items:
          c.itemCount || (c.productCount ? `${c.productCount}+ items` : "50+ items"),
        emoji: c.emoji,
        bg: c.bg,
        bgClass: c.bgClass,
        subcategories: c.subcategories,
        section: c.section,
      }));
    }

    // 2. Fallbacks if database is loading or empty
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

    return GROCERY_CATEGORIES;
  }, [currentStore, dbCategories]);

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-8">
      <div className="border-b border-border-light bg-gradient-to-br from-slate-50 via-white to-white px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-7xl">
          <p
            className="text-xs font-bold uppercase tracking-widest lg:text-sm"
            style={{ color: headerMeta.color }}
          >
            {headerMeta.badge}
          </p>
          <h1 className="mt-1.5 text-2xl font-black text-slate-900 lg:text-4xl">
            {headerMeta.title}
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 lg:text-sm">
            {headerMeta.subtitle}
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
