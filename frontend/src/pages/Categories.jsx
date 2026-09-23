import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useCategoriesQuery } from "../hooks/queries/useCategoriesQuery";
import { useSectionsQuery } from "../hooks/queries/useSectionsQuery";
import CategoryCard from "../components/grocery/CategoryCard";
import { sectionToStoreKey, storeToSection } from "../utils/storeSection";

function Categories() {
  const [searchParams] = useSearchParams();
  const currentStore = sectionToStoreKey(searchParams.get("store"));
  const targetSection = storeToSection(currentStore);

  const { data: dbCategories = [], isLoading: loadingCats } = useCategoriesQuery({
    section: targetSection,
  });
  const { data: sections = [] } = useSectionsQuery();

  const currentSecObj = useMemo(() => {
    const s = sections.find((sec) => {
      const slug = String(sec.slug || "").toLowerCase();
      const storeKey = sectionToStoreKey(slug || sec.storeType);
      return storeKey === currentStore || slug === targetSection;
    });
    return s || null;
  }, [sections, currentStore, targetSection]);

  const headerMeta = useMemo(() => {
    if (currentSecObj) {
      return {
        badge: currentSecObj.badge || currentSecObj.sectionName,
        title: `${currentSecObj.sectionName} Categories`,
        subtitle: currentSecObj.description || "Browse all curated product categories",
        color: currentSecObj.color || "#0C831F",
      };
    }
    return {
      badge: "Categories",
      title: "All Categories",
      subtitle: "Browse products by category",
      color: "#0C831F",
    };
  }, [currentSecObj]);

  const categoriesList = useMemo(() => {
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
      section: c.section,
    }));
  }, [dbCategories]);

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
        {loadingCats && categoriesList.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">Loading categories…</p>
        ) : categoriesList.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No categories yet. Add them in Product Management.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
            {categoriesList.map((cat) => (
              <CategoryCard
                key={cat._id || cat.slug || cat.categoryName || cat.name}
                cat={cat}
                size="lg"
                store={currentStore}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Categories;
