import { Link, useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import CategoryIcon from "./CategoryIcon";
import { resolveStoreTheme } from "./homeHeaderThemes";

const CATEGORY_IMAGES = {
  fruits: "/fruits.png",
  fruit: "/fruits.png",
  vegetables: "/vegetables.png",
  vegetable: "/vegetables.png",
  veggies: "/vegetables.png",
  organic: "/organic.png",
  dairy: "/dairy.png",
  milk: "/dairy.png",
};

function getCategoryImage(name, apiImage) {
  const key = String(name || "").trim().toLowerCase();
  if (CATEGORY_IMAGES[key]) return CATEGORY_IMAGES[key];
  if (key.includes("fruit")) return "/fruits.png";
  if (key.includes("vegetable") || key.includes("veggie")) return "/vegetables.png";
  if (key.includes("organic")) return "/organic.png";
  if (key.includes("dairy") || key.includes("milk")) return "/dairy.png";
  return apiImage || null;
}

function isFruitsCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  return key === "fruits" || key === "fruit" || key.includes("fruit");
}

function isVegetablesCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  return key === "vegetables" || key === "vegetable" || key.includes("vegetable") || key.includes("veggie");
}

function isOrganicCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  return key === "organic" || key.includes("organic");
}

function isDairyCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  return key === "dairy" || key === "milk" || key.includes("dairy") || key.includes("milk");
}

function applyLocalCategoryImages(categories) {
  return categories.map((cat) => {
    if (isFruitsCategory(cat.name)) return { ...cat, image: "/fruits.png" };
    if (isVegetablesCategory(cat.name)) return { ...cat, image: "/vegetables.png" };
    if (isOrganicCategory(cat.name)) return { ...cat, image: "/organic.png" };
    if (isDairyCategory(cat.name)) return { ...cat, image: "/dairy.png" };
    return cat;
  });
}

function BasketFilledIcon({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5.25 6.75h13.5l-.9 9.45a2.25 2.25 0 01-2.24 2.05H8.39a2.25 2.25 0 01-2.24-2.05L5.25 6.75z" />
      <path
        d="M8.25 6.75V5.25a3.75 3.75 0 017.5 0v1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function BasketOutlineIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h16l-1.2 9.2A2 2 0 0116.82 21H7.18a2 2 0 01-1.98-1.8L4 10z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  );
}

function CategoryTabIcon({ cat, index, isActive, isAll }) {
  if (isAll) {
    return isActive ? (
      <BasketFilledIcon className="h-5 w-5 text-slate-900" />
    ) : (
      <BasketOutlineIcon className="h-5 w-5 text-slate-600" />
    );
  }

  if (cat.image) {
    return <img src={cat.image} alt="" className="h-5 w-5 object-contain" />;
  }

  return <CategoryIcon name={cat.name} index={index} className="h-5 w-5" />;
}

function resolveActiveCategory(categories, categoryFromUrl) {
  if (!categoryFromUrl) return "All";

  const exact = categories.find(
    (cat) =>
      cat.name.toLowerCase() === categoryFromUrl.toLowerCase() ||
      cat.slug?.toLowerCase() === categoryFromUrl.toLowerCase()
  );
  if (exact) return exact.name;

  if (isFruitsCategory(categoryFromUrl)) {
    return categories.find((cat) => isFruitsCategory(cat.name))?.name || "Fruits";
  }
  if (isVegetablesCategory(categoryFromUrl)) {
    return categories.find((cat) => isVegetablesCategory(cat.name))?.name || "Vegetables";
  }
  if (isOrganicCategory(categoryFromUrl)) {
    return categories.find((cat) => isOrganicCategory(cat.name))?.name || "Organic";
  }
  if (isDairyCategory(categoryFromUrl)) {
    return categories.find((cat) => isDairyCategory(cat.name))?.name || "Dairy";
  }

  return categoryFromUrl;
}

function HomeCategoryStrip() {
  const { data: apiCategories = [] } = useCategoriesQuery();
  const [searchParams] = useSearchParams();

  const currentStore = searchParams.get("store")?.trim()?.toLowerCase() || "main";
  const theme = resolveStoreTheme(currentStore);

  const categories = useMemo(() => {
    const filtered = apiCategories.filter(
      (cat) => cat.categoryName?.toLowerCase() !== "most purchase"
    );

    const defaults = [
      { name: "All", slug: "" },
      { name: "Fruits", slug: "Fruits", image: "/fruits.png" },
      { name: "Vegetables", slug: "Vegetables", image: "/vegetables.png" },
      { name: "Organic", slug: "Organic", image: "/organic.png" },
      { name: "Dairy", slug: "Dairy", image: "/dairy.png" },
    ];

    let baseList = defaults;

    if (filtered.length) {
      const fromApi = filtered.slice(0, 8).map((cat) => ({
        name: cat.categoryName,
        slug: cat.categoryName,
        image: getCategoryImage(cat.categoryName, cat.categoryImage),
      }));

      const hasFruits = fromApi.some((cat) => isFruitsCategory(cat.name));
      const hasVegetables = fromApi.some((cat) => isVegetablesCategory(cat.name));
      const hasOrganic = fromApi.some((cat) => isOrganicCategory(cat.name));
      const hasDairy = fromApi.some((cat) => isDairyCategory(cat.name));
      const list = [{ name: "All", slug: "" }, ...fromApi];

      if (!hasFruits) {
        list.splice(1, 0, { name: "Fruits", slug: "Fruits", image: "/fruits.png" });
      }
      if (!hasVegetables) {
        const insertAt = list.findIndex((cat) => isFruitsCategory(cat.name)) + 1 || 2;
        list.splice(insertAt, 0, {
          name: "Vegetables",
          slug: "Vegetables",
          image: "/vegetables.png",
        });
      }
      if (!hasOrganic) {
        const vegIndex = list.findIndex((cat) => isVegetablesCategory(cat.name));
        const insertAt = vegIndex >= 0 ? vegIndex + 1 : list.length;
        list.splice(insertAt, 0, {
          name: "Organic",
          slug: "Organic",
          image: "/organic.png",
        });
      }
      if (!hasDairy) {
        const organicIndex = list.findIndex((cat) => isOrganicCategory(cat.name));
        const insertAt = organicIndex >= 0 ? organicIndex + 1 : list.length;
        list.splice(insertAt, 0, {
          name: "Dairy",
          slug: "Dairy",
          image: "/dairy.png",
        });
      }
      baseList = list;
    }

    let finalCategories = applyLocalCategoryImages(baseList);

    if (currentStore === "festive") {
      finalCategories = finalCategories.filter((cat) => !isDairyCategory(cat.name));
    }

    return finalCategories.slice(0, 5);
  }, [apiCategories, currentStore]);

  const categoryFromUrl = searchParams.get("categoryName")?.trim() || "";
  const activeCategory = useMemo(
    () => resolveActiveCategory(categories, categoryFromUrl),
    [categories, categoryFromUrl]
  );

  return (
    <nav className={`${theme.contentBg} px-4 pb-0 pt-2 transition-colors duration-300`}>
      <div className={`flex items-center justify-between border-b ${theme.categoryBorder}`}>
        {categories.map((cat, index) => {
          const isActive = activeCategory === cat.name;
          
          const params = new URLSearchParams();
          if (currentStore && currentStore !== "main") {
            params.set("store", currentStore);
          }
          if (cat.slug) {
            params.set("categoryName", cat.slug);
          }
          const queryString = params.toString();
          const to = queryString ? `/?${queryString}` : "/";

          return (
            <Link
              key={cat.name}
              to={to}
              className={`flex min-w-0 flex-1 flex-col items-center justify-between px-1 text-center transition ${
                isActive ? theme.categoryText : theme.categoryInactive
              }`}
            >
              <div className="flex h-6 w-6 items-center justify-center">
                <CategoryTabIcon cat={cat} index={index} isActive={isActive} isAll={cat.name === "All"} />
              </div>
              <span className={`mt-1 text-[11px] leading-tight ${isActive ? "font-black" : "font-semibold"}`}>
                {cat.name}
              </span>
              <div
                className={`mt-1.5 h-[3px] w-full rounded-full transition-all ${
                  isActive ? theme.categoryIndicator : "bg-transparent"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default HomeCategoryStrip;

