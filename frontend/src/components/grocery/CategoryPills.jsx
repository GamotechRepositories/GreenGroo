import { Link } from "react-router-dom";
import { GROCERY_CATEGORIES } from "../../data/groceryCategories";
import CategoryCard from "./CategoryCard";

function CategoryPills() {
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
          {GROCERY_CATEGORIES.map((cat) => (
            <CategoryCard key={cat.slug} cat={cat} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategoryPills;
