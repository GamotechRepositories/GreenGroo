import { GROCERY_CATEGORIES } from "../data/groceryCategories";
import CategoryCard from "../components/grocery/CategoryCard";

function Categories() {
  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-8">
      <div className="border-b border-border-light bg-gradient-to-br from-primary-light/60 via-white to-white px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-widest text-primary lg:text-sm">
            Shop Fresh
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-text-primary lg:text-4xl">
            All Categories
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 md:grid-cols-3 lg:grid-cols-4 lg:gap-3.5">
          {GROCERY_CATEGORIES.map((cat) => (
            <CategoryCard key={cat.slug} cat={cat} size="lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Categories;
