import { Link, useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import CategoryIcon from "./CategoryIcon";
import { resolveStoreTheme } from "./homeHeaderThemes";
import { SUPER_MALL_CATEGORIES } from "../../data/superMallCategories";

function isFruitsCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  return key === "fruits" || key === "fruit" || key.includes("fruit");
}

function isVegetablesCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  return (
    key === "vegetables" ||
    key === "vegetable" ||
    key.includes("vegetable") ||
    key.includes("veggie")
  );
}

function isOrganicCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  return key === "organic" || key.includes("organic");
}

function isDairyCategory(name) {
  const key = String(name || "").trim().toLowerCase();
  return key === "dairy" || key === "milk" || key.includes("dairy") || key.includes("milk");
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 10h16l-1.2 9.2A2 2 0 0116.82 21H7.18a2 2 0 01-1.98-1.8L4 10z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  );
}

function CategoryTabIcon({ cat, index, isActive, isAll }) {
  if (isAll) {
    return isActive ? (
      <BasketFilledIcon className="h-5 w-5 text-current" />
    ) : (
      <BasketOutlineIcon className="h-5 w-5 text-current" />
    );
  }

  return <CategoryIcon name={cat.name} index={index} className="h-5 w-5 text-current" />;
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
  const [searchParams] = useSearchParams();
  const currentStore = searchParams.get("store")?.trim()?.toLowerCase() || "main";
  const theme = resolveStoreTheme(currentStore);

  const targetSection =
    currentStore === "mall"
      ? "supermall"
      : currentStore === "festive"
        ? "ready2cook"
        : currentStore === "main"
          ? "greengrocc"
          : currentStore;

  const { data: apiCategories = [] } = useCategoriesQuery({ section: targetSection });

  const categories = useMemo(() => {
    const list = [{ name: "All", slug: "" }];

    if (Array.isArray(apiCategories) && apiCategories.length > 0) {
      const fromApi = apiCategories
        .filter((cat) => cat.categoryName?.toLowerCase() !== "most purchase")
        .slice(0, 6)
        .map((cat) => ({
          name: cat.categoryName,
          slug: cat.slug || cat.categoryName,
        }));
      list.push(...fromApi);
      return list;
    }

    if (currentStore === "mall") {
      return [
        { name: "All", slug: "" },
        ...SUPER_MALL_CATEGORIES.slice(0, 5).map((cat) => ({
          name: cat.name,
          slug: cat.slug,
        })),
      ];
    }

    if (currentStore === "festive") {
      return [
        { name: "All", slug: "" },
        { name: "Chopped", slug: "Chopped" },
        { name: "Cut & Sliced", slug: "Cut & Sliced" },
        { name: "Peeled & Cleaned", slug: "Peeled & Cleaned" },
        { name: "Cleaned Bhaji", slug: "Cleaned Bhaji" },
      ];
    }

    return [
      { name: "All", slug: "" },
      { name: "Vegetables", slug: "Vegetables" },
      { name: "Fruits", slug: "Fruits" },
      { name: "Dairy", slug: "Dairy" },
      { name: "Organic", slug: "Organic" },
    ];
  }, [apiCategories, currentStore]);

  const categoryFromUrl = searchParams.get("categoryName")?.trim() || "";
  const activeCategory = useMemo(
    () => resolveActiveCategory(categories, categoryFromUrl),
    [categories, categoryFromUrl]
  );

  return (
    <nav className={`${theme.categoryBg || theme.contentBg} px-4 pb-0 pt-2 transition-colors duration-300`}>
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
          const to = queryString ? `/product?${queryString}` : "/product";

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
