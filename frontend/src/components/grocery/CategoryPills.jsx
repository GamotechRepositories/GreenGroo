import { Link } from "react-router-dom";

const CATEGORIES = [
  { name: "Vegetables", emoji: "🥦", slug: "Vegetables", items: "150+", bg: "#F3F7EF" },
  { name: "Fruits", emoji: "🍎", slug: "Fruits", items: "120+", bg: "#FFF3F0" },
  { name: "Dairy", emoji: "🥛", slug: "Dairy", items: "80+", bg: "#F0F6FF" },
  { name: "Grains", emoji: "🌾", slug: "Grains", items: "90+", bg: "#FFF8E8" },
  { name: "Pulses", emoji: "🌱", slug: "Pulses", items: "70+", bg: "#F1F8E9" },
  { name: "Grocery", emoji: "🧂", slug: "Grocery", items: "200+", bg: "#F5F5F2" },
  { name: "Oils", emoji: "🫒", slug: "Oils", items: "45+", bg: "#F7F4E8" },
  { name: "Spices", emoji: "🌶️", slug: "Spices", items: "110+", bg: "#FFF3EE" },
  { name: "Dry Fruits", emoji: "🥜", slug: "Dry Fruits", items: "60+", bg: "#FFF6E9" },
  { name: "Organic", emoji: "🍯", slug: "Organic", items: "55+", bg: "#FFF8E1" },
  { name: "Beverages", emoji: "🥤", slug: "Beverages", items: "85+", bg: "#EAF6FE" },
  { name: "Bakery", emoji: "🍞", slug: "Bakery", items: "40+", bg: "#FFF4E5" },
];

function CategoryCard({ cat }) {
  return (
    <Link
      to={`/product?categoryName=${encodeURIComponent(cat.slug)}`}
      className="group relative flex h-[76px] items-stretch overflow-hidden rounded-xl transition hover:-translate-y-0.5 hover:shadow-md sm:h-[88px] sm:rounded-2xl lg:h-[100px]"
      style={{ backgroundColor: cat.bg }}
    >
      <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center py-2 pl-2.5 pr-1 sm:py-3 sm:pl-3.5 lg:pl-4">
        <h3 className="truncate text-[11px] font-bold leading-tight text-text-primary sm:text-sm lg:text-[15px]">
          {cat.name}
        </h3>
        <p className="mt-0.5 text-[9px] font-medium text-text-secondary sm:mt-1 sm:text-[11px] lg:text-xs">
          {cat.items} items
        </p>
      </div>

      <div className="relative flex w-[38%] shrink-0 items-end justify-end pr-0.5 pb-0 sm:w-[40%] sm:pr-1">
        <span
          className="translate-x-0.5 translate-y-1 text-[2rem] leading-none transition duration-200 group-hover:scale-105 sm:text-[2.75rem] lg:text-[3.25rem]"
          aria-hidden="true"
        >
          {cat.emoji}
        </span>
      </div>
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

        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 md:grid-cols-3 lg:grid-cols-4 lg:gap-3.5">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.slug} cat={cat} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategoryPills;
