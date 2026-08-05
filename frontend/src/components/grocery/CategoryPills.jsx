import { Link } from "react-router-dom";

const CATEGORIES = [
  { name: "Vegetables", emoji: "🥦", slug: "Vegetables", bg: "#EEF6EE" },
  { name: "Fruits", emoji: "🍎", slug: "Fruits", bg: "#FFF1F0" },
  { name: "Dairy", emoji: "🥛", slug: "Dairy", bg: "#F0F7FF" },
  { name: "Grains", emoji: "🌾", slug: "Grains", bg: "#FFF8E8" },
  { name: "Pulses", emoji: "🌱", slug: "Pulses", bg: "#F1F8E9" },
  { name: "Grocery", emoji: "🧂", slug: "Grocery", bg: "#F5F5F5" },
  { name: "Oils", emoji: "🫒", slug: "Oils", bg: "#F7F4E8" },
  { name: "Spices", emoji: "🌶️", slug: "Spices", bg: "#FFF3EE" },
  { name: "Dry Fruits", emoji: "🥜", slug: "Dry Fruits", bg: "#FFF6E9" },
  { name: "Organic", emoji: "🍯", slug: "Organic", bg: "#FFF8E1" },
  { name: "Beverages", emoji: "🥤", slug: "Beverages", bg: "#E8F5FE" },
  { name: "Bakery", emoji: "🍞", slug: "Bakery", bg: "#FFF4E5" },
];

function CategoryCard({ cat }) {
  return (
    <Link
      to={`/product?categoryName=${encodeURIComponent(cat.slug)}`}
      className="group flex flex-col items-center gap-1.5"
    >
      <div
        className="flex h-[64px] w-[64px] items-center justify-center rounded-xl transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-sm sm:h-[72px] sm:w-[72px] lg:h-[80px] lg:w-[80px] lg:rounded-2xl"
        style={{ backgroundColor: cat.bg }}
      >
        <span className="text-[1.5rem] leading-none sm:text-[1.65rem] lg:text-[1.85rem]" aria-hidden="true">
          {cat.emoji}
        </span>
      </div>
      <span className="line-clamp-2 min-h-[1.75rem] text-center text-[10px] font-semibold leading-tight text-text-primary sm:text-[11px] lg:text-xs">
        {cat.name}
      </span>
    </Link>
  );
}

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

        <div className="grid grid-cols-4 justify-items-center gap-x-2 gap-y-3 sm:grid-cols-6 md:grid-cols-6 lg:grid-cols-6 lg:justify-items-start lg:gap-x-4 lg:gap-y-4">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.slug} cat={cat} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategoryPills;
