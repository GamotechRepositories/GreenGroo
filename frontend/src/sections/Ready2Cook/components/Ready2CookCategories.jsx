import React from "react";
import { useReady2Cook } from "../hooks/useReady2Cook";
import { READY2COOK_CATEGORIES } from "../data/categories";
import Ready2CookCategoryCard from "./Ready2CookCategoryCard";

export function Ready2CookCategories({ categories: propCategories, onSelectCategory, selectedCategory }) {
  const { categories: hookCategories } = useReady2Cook();
  const rawList = propCategories?.length ? propCategories : hookCategories?.length ? hookCategories : READY2COOK_CATEGORIES;

  const displayList = rawList.map((cat, idx) => ({
    id: cat._id || cat.id || `rtc-${idx}`,
    name: cat.categoryName || cat.name,
    slug: cat.slug || cat.categoryName || cat.name,
    itemCount: cat.itemCount || (cat.productCount ? `${cat.productCount}+ items` : "20+ items"),
    bgClass: cat.bgClass || "bg-[#E8F8EE]",
    image: cat.categoryImage || cat.image || "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=300&h=300&q=80",
    emoji: cat.emoji,
  }));

  return (
    <section className="px-4 sm:px-6 py-3">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
            Ready2Cook Categories
          </h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-500 sm:text-sm">
            Pre-washed, peeled & sliced ingredients for 10-min cooking
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {displayList.map((cat) => (
          <Ready2CookCategoryCard
            key={cat.id || cat.slug}
            cat={cat}
            isSelected={selectedCategory === cat.slug || selectedCategory === cat.name}
            onClick={() => onSelectCategory && onSelectCategory(cat.slug)}
          />
        ))}
      </div>
    </section>
  );
}

export default Ready2CookCategories;
