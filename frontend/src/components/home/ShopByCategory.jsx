import { Link } from "react-router-dom";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";

function ShopByCategory() {
  const { data: categories = [], isLoading: loading } = useCategoriesQuery();

  return (
    <section className="bg-black text-white px-5 sm:px-6 md:px-8 lg:px-12 py-8 md:py-10">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-[1.75rem] font-bold uppercase tracking-tight">
            <span className="text-white">Shop By </span>
            <span className="text-accent">Category</span>
          </h2>
          <Link
            to="/product"
            className="inline-flex items-center gap-1 text-sm sm:text-base font-semibold uppercase text-accent hover:underline"
          >
            View All Categories
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-3 sm:px-3 sm:py-4 animate-pulse"
              >
                <div className="h-20 sm:h-24 md:h-28 w-full rounded-md bg-neutral-800 mb-2 sm:mb-3" />
                <div className="h-3 w-3/4 mx-auto rounded bg-neutral-800" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-center text-neutral-400 py-8">
            No categories available yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {categories.map((item) => (
              <Link
                key={item._id}
                to="/product"
                className="group flex flex-col items-center rounded-lg border border-neutral-700 bg-black px-2 py-3 sm:px-3 sm:py-4 hover:border-accent/50 hover:shadow-md transition-all"
              >
                <div className="flex h-20 sm:h-24 md:h-28 w-full items-center justify-center mb-2 sm:mb-3 overflow-hidden rounded-md bg-neutral-900">
                  <img
                    src={item.categoryImage}
                    alt={item.categoryName}
                    className="max-h-full max-w-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <p className="text-center text-[11px] sm:text-xs md:text-sm font-bold text-white leading-snug px-1">
                  {item.categoryName}
                </p>
                <p className="mt-1 text-center text-[10px] sm:text-[11px] text-neutral-400">
                  {Number(item.productCount) || 0} products
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ShopByCategory;
