import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useCategoriesQuery } from "../hooks/queries/useCategoriesQuery";
import CategoryIcon from "../components/grocery/CategoryIcon";

function Categories() {
  const { data: apiCategories = [], isLoading } = useCategoriesQuery();

  const categories = useMemo(() => {
    return apiCategories
      .filter((cat) => cat.categoryName?.toLowerCase() !== "most purchase")
      .map((cat) => ({
        name: cat.categoryName,
        image: cat.categoryImage,
        count: cat.productCount || 0,
      }));
  }, [apiCategories]);

  return (
    <div className="min-h-screen bg-mobile-bg pb-24 lg:pb-8">
      <div className="border-b border-border-light bg-gradient-to-br from-primary-light/60 via-white to-white px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-widest text-primary lg:text-sm">Shop Fresh</p>
          <h1 className="mt-2 text-2xl font-extrabold text-text-primary lg:text-4xl">All Categories</h1>
          <p className="mt-2 max-w-xl text-sm text-text-secondary lg:text-base">
            Browse fruits, vegetables, dairy, and more — everything you need for a healthy kitchen.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/product"
              className="inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition hover:bg-primary-dark"
            >
              Shop All Products
            </Link>
            <span className="inline-flex items-center gap-2 rounded-xl border border-border-light bg-white px-4 py-2.5 text-sm text-text-secondary">
              <span className="font-bold text-primary">{categories.length}</span> categories
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl bg-mobile-surface lg:h-44" />
              ))
            : categories.map((cat, index) => (
                <Link
                  key={cat.name}
                  to={`/product?categoryName=${encodeURIComponent(cat.name)}`}
                  className="group flex flex-col items-center rounded-2xl border border-border-light bg-white p-4 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 lg:p-5"
                >
                  <div className="mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary-light text-[#07875f] transition group-hover:scale-105 lg:h-20 lg:w-20">
                    {cat.image ? (
                      <img src={cat.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <CategoryIcon name={cat.name} index={index} className="h-8 w-8 lg:h-10 lg:w-10" />
                    )}
                  </div>
                  <p className="text-center text-sm font-bold text-text-primary lg:text-base">{cat.name}</p>
                  {cat.count > 0 ? (
                    <p className="mt-1 text-xs text-text-muted">{cat.count} items</p>
                  ) : null}
                </Link>
              ))}
        </div>
      </div>
    </div>
  );
}

export default Categories;
