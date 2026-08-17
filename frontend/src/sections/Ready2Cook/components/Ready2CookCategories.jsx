import React from "react";
import { READY2COOK_CATEGORIES } from "../data/categories";
import Ready2CookCategoryCard from "./Ready2CookCategoryCard";

export function Ready2CookCategories({ onSelectCategory, selectedCategory }) {
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
        {READY2COOK_CATEGORIES.map((cat) => (
          <Ready2CookCategoryCard
            key={cat.id}
            cat={cat}
            isSelected={selectedCategory === cat.slug}
            onClick={() => onSelectCategory && onSelectCategory(cat.slug)}
          />
        ))}
      </div>
    </section>
  );
}

export default Ready2CookCategories;
