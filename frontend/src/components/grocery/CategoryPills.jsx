import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import HorizontalScrollRow from "../home/HorizontalScrollRow";
import CategoryIcon from "./CategoryIcon";

function CategoryCard({ cat, size = "sm", index = 0 }) {
  const isLarge = size === "lg";

  return (
    <Link
      to={cat.slug ? `/product?categoryName=${encodeURIComponent(cat.slug)}` : "/product"}
      className={`group flex flex-col items-center gap-2 transition ${
        isLarge
          ? "rounded-2xl border border-border-light bg-white p-4 hover:border-primary hover:shadow-md"
          : "w-[72px] shrink-0 sm:w-[80px]"
      }`}
    >
      <div
        className={`flex items-center justify-center overflow-hidden rounded-2xl bg-primary-light text-[#07875f] transition group-hover:scale-105 group-hover:bg-primary/20 ${
          isLarge ? "h-16 w-16 lg:h-20 lg:w-20" : "h-14 w-14 sm:h-16 sm:w-16"
        }`}
      >
        {cat.image ? (
          <img src={cat.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <CategoryIcon name={cat.name} index={index} className={isLarge ? "h-8 w-8" : "h-6 w-6"} />
        )}
      </div>
      <span
        className={`line-clamp-2 text-center font-semibold text-text-primary ${
          isLarge ? "text-sm" : "text-[11px] sm:text-xs"
        }`}
      >
        {cat.name}
      </span>
    </Link>
  );
}

function CategoryPills() {
  const { data: apiCategories = [] } = useCategoriesQuery();

  const categories = useMemo(() => {
    const filtered = apiCategories.filter(
      (cat) => cat.categoryName?.toLowerCase() !== "most purchase"
    );
    if (!filtered.length) {
      return [
        { name: "All", slug: "" },
        { name: "Fruits", slug: "Fruits" },
        { name: "Vegetables", slug: "Vegetables" },
        { name: "Organic", slug: "Organic" },
      ];
    }
    return [
      { name: "All", slug: "" },
      ...filtered.map((cat) => ({
        name: cat.categoryName,
        slug: cat.categoryName,
        image: cat.categoryImage,
      })),
    ];
  }, [apiCategories]);

  return (
    <section className="px-4 pb-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-3 flex items-center justify-between lg:mb-4">
          <h2 className="text-base font-bold text-text-primary lg:text-xl">Categories</h2>
          <Link to="/categories" className="text-sm font-semibold text-primary hover:underline">
            View All
          </Link>
        </div>

        <div className="lg:hidden">
          <HorizontalScrollRow gapClassName="gap-3">
            {categories.map((cat, index) => (
              <CategoryCard key={cat.name} cat={cat} index={index} />
            ))}
          </HorizontalScrollRow>
        </div>

        <div className="hidden grid-cols-4 gap-4 sm:grid-cols-6 lg:grid xl:grid-cols-8 xl:gap-5">
          {categories.slice(0, 8).map((cat, index) => (
            <CategoryCard key={cat.name} cat={cat} size="lg" index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategoryPills;
