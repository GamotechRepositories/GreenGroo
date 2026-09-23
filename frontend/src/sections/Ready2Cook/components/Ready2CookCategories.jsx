import React from "react";
import { useReady2Cook } from "../hooks/useReady2Cook";
import Ready2CookCategoryCard from "./Ready2CookCategoryCard";

export function Ready2CookCategories({ categories: propCategories, onSelectCategory, selectedCategory }) {
  const { categories: hookCategories, loading } = useReady2Cook();
  const rawList = propCategories?.length ? propCategories : hookCategories || [];

  const displayList = rawList.map((cat, idx) => ({
    id: cat._id || cat.id || `rtc-${idx}`,
    name: cat.categoryName || cat.name,
    slug: cat.slug || cat.categoryName || cat.name,
    itemCount: cat.itemCount || (cat.productCount ? `${cat.productCount}+ items` : "Shop now"),
    bgClass: cat.bgClass || "bg-[#E8F8EE]",
    image: cat.categoryImage || cat.image || "/categories/vegetables.webp",
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

      {loading && displayList.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Loading categories…</p>
      ) : displayList.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          No categories yet. Add them in Product Management.
        </p>
      ) : (
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
      )}
    </section>
  );
}

export default Ready2CookCategories;
