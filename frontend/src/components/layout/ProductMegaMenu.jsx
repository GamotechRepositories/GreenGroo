import { Link } from "react-router-dom";

const PROMO_TAGS = ["most purchase"];

const buildProductLink = (categoryName, subcategory) => {
  const params = new URLSearchParams({ categoryName });
  if (subcategory) params.set("subcategory", subcategory);
  return `/product?${params.toString()}`;
};

function ProductMegaMenu({ categories, onNavigate }) {
  const menuCategories = categories.filter(
    (item) => !PROMO_TAGS.includes(item.categoryName?.trim().toLowerCase())
  );

  if (menuCategories.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 top-full z-[60] border-t border-gray-200 bg-light-bg shadow-xl">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-10 gap-y-8">
          {menuCategories.map((category) => (
            <div key={category._id} className="min-w-0">
              <Link
                to={buildProductLink(category.categoryName)}
                onClick={onNavigate}
                className="block text-accent font-bold text-xs uppercase tracking-wide mb-3 hover:underline"
              >
                {category.categoryName}
              </Link>

              {category.subcategories?.length > 0 ? (
                <ul className="space-y-2">
                  {category.subcategories.map((sub) => (
                    <li key={sub}>
                      <Link
                        to={buildProductLink(category.categoryName, sub)}
                        onClick={onNavigate}
                        className="text-sm text-gray-700 hover:text-accent transition leading-snug"
                      >
                        {sub}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Link
                  to={buildProductLink(category.categoryName)}
                  onClick={onNavigate}
                  className="text-sm text-gray-600 hover:text-accent transition"
                >
                  View all
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductMegaMenu;
