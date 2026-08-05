import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import CategoryIcon from "./CategoryIcon";

function DesktopCategorySidebar() {
  const { data: apiCategories = [] } = useCategoriesQuery();

  const categories = useMemo(() => {
    return apiCategories
      .filter((cat) => cat.categoryName?.toLowerCase() !== "most purchase")
      .slice(0, 8)
      .map((cat) => ({
        name: cat.categoryName,
        image: cat.categoryImage,
      }));
  }, [apiCategories]);

  if (!categories.length) return null;

  return (
    <div className="flex h-full w-[240px] shrink-0 flex-col rounded-2xl border border-border-light bg-white p-4 shadow-sm xl:w-[260px]">
      <h3 className="mb-3 text-sm font-bold text-text-primary">Shop by Category</h3>
      <ul className="flex flex-1 flex-col gap-1">
        {categories.map((cat, index) => (
          <li key={cat.name}>
            <Link
              to={`/product?categoryName=${encodeURIComponent(cat.name)}`}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-primary transition hover:bg-primary-light hover:text-primary"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary-light text-[#07875f]">
                {cat.image ? (
                  <img src={cat.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <CategoryIcon name={cat.name} index={index} className="h-5 w-5" />
                )}
              </span>
              <span className="truncate">{cat.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        to="/categories"
        className="mt-3 rounded-xl bg-primary-light py-2.5 text-center text-sm font-bold text-primary transition hover:bg-primary hover:text-white"
      >
        View All Categories
      </Link>
    </div>
  );
}

export default DesktopCategorySidebar;
