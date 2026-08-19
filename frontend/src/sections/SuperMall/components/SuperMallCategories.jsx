import React from "react";
import { useSuperMall } from "../hooks/useSuperMall";
import { SUPER_MALL_CATEGORIES } from "../../../data/superMallCategories";
import SuperMallCategoryCard from "./SuperMallCategoryCard";

export function SuperMallCategories({ categories: propCategories, onSelectCategory, selectedCategory }) {
  const { categories: hookCategories } = useSuperMall();
  const rawList = propCategories?.length ? propCategories : hookCategories?.length ? hookCategories : SUPER_MALL_CATEGORIES;

  const displayList = rawList.map((cat, idx) => ({
    id: cat._id || cat.id || `sm-${idx}`,
    name: cat.categoryName || cat.name,
    slug: cat.slug || cat.categoryName || cat.name,
    itemCount: cat.itemCount || (cat.productCount ? `${cat.productCount}+ items` : "50+ items"),
    bgClass: cat.bgClass || "bg-[#E8F8EE]",
    image: cat.categoryImage || cat.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&h=400&q=80",
    emoji: cat.emoji,
  }));

  return (
    <section className="px-4 sm:px-6 py-3">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            Shop by Category
          </h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-500 sm:text-sm">
            Top brand groceries, essentials & packaged foods
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {displayList.map((cat) => (
          <SuperMallCategoryCard
            key={cat.id || cat.slug}
            cat={cat}
            isSelected={selectedCategory === cat.slug || selectedCategory === cat.name}
            onClick={() => onSelectCategory && onSelectCategory(cat.name)}
          />
        ))}
      </div>
    </section>
  );
}

export default SuperMallCategories;
