import React from "react";
import { SUPER_MALL_CATEGORIES } from "../../../data/superMallCategories";
import SuperMallCategoryCard from "./SuperMallCategoryCard";

export function SuperMallCategories({ onSelectCategory, selectedCategory }) {
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
        {SUPER_MALL_CATEGORIES.map((cat) => (
          <SuperMallCategoryCard
            key={cat.id}
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
