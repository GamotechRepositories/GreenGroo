import { Link, useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import CategoryIcon from "./CategoryIcon";
import { resolveStoreTheme } from "./homeHeaderThemes";
import {
  sectionToStoreKey,
  storeToSection,
  buildStoreProductUrl,
} from "../../utils/storeSection";

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

/** Compact label for the strip — keeps full name for routing/title. */
function shortCategoryLabel(name) {
  let label = String(name || "").trim();
  if (!label || /^all$/i.test(label)) return "All";

  label = label
    .replace(
      /^(super\s*mall|supermall|ready\s*2\s*cook|ready2cook|ready-to-cook|instant\s*order|instant|green\s*grocc|greengrocc)\s*[-:]?\s*/i,
      ""
    )
    .trim();

  const key = label.toLowerCase();
  if (/packaged/.test(key)) return "Packaged";
  if (/grain|pulse/.test(key)) return "Grains";
  if (/snack|namkeen/.test(key)) return "Snacks";
  if (/beverage|drink/.test(key)) return "Drinks";
  if (/chopped/.test(key)) return "Chopped";
  if (/cut.*sliced|sliced/.test(key)) return "Sliced";
  if (/peeled/.test(key)) return "Peeled";
  if (/cleaned\s*bhaji|bhaji.*leafy|leafy/.test(key)) return "Bhaji";
  if (/veggie.*bhaji|bhaji\s*mix/.test(key)) return "Mix";
  if (/dry\s*fruit/.test(key)) return "Dry Fruits";
  if (/vegetable|veggies/.test(key)) return "Veggies";

  if (label.length <= 11) return label;

  const beforeJoin = label.split(/\s*[&/|]\s*/)[0].trim();
  if (beforeJoin.length >= 3 && beforeJoin.length <= 11) return beforeJoin;

  const words = label.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const two = `${words[0]} ${words[1]}`;
    if (two.length <= 11) return two;
    return words[0].length <= 11 ? words[0] : `${words[0].slice(0, 10)}…`;
  }

  return `${label.slice(0, 10)}…`;
}

function BasketFilledIcon({ className = "h-[18px] w-[18px]" }) {
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

function BasketOutlineIcon({ className = "h-[18px] w-[18px]" }) {
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
      <BasketFilledIcon className="h-[18px] w-[18px] text-current" />
    ) : (
      <BasketOutlineIcon className="h-[18px] w-[18px] text-current" />
    );
  }

  return (
    <CategoryIcon
      name={cat.label || cat.name}
      index={index}
      className="h-[18px] w-[18px] text-current"
    />
  );
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

function HomeCategoryStrip({ hideIcons = false }) {
  const [searchParams] = useSearchParams();
  const currentStore = sectionToStoreKey(searchParams.get("store"));
  const theme = resolveStoreTheme(currentStore);

  const targetSection = storeToSection(currentStore);

  const { data: apiCategories = [] } = useCategoriesQuery({ section: targetSection });

  const categories = useMemo(() => {
    const toItem = (name) => ({
      name,
      label: shortCategoryLabel(name),
    });

    const list = [toItem("All")];
    if (!Array.isArray(apiCategories) || apiCategories.length === 0) return list;

    const fromApi = apiCategories
      .filter((cat) => cat.categoryName?.toLowerCase() !== "most purchase")
      .slice(0, 12)
      .map((cat) => toItem(cat.categoryName));
    list.push(...fromApi);
    return list;
  }, [apiCategories]);

  const categoryFromUrl = searchParams.get("categoryName")?.trim() || "";
  const activeCategory = useMemo(
    () => resolveActiveCategory(categories, categoryFromUrl),
    [categories, categoryFromUrl]
  );

  return (
    <nav
      className={`${theme.categoryBg || theme.contentBg} transition-colors duration-300 ${
        hideIcons ? "pb-0 pt-1" : "pb-0 pt-1.5"
      }`}
      aria-label="Product categories"
    >
      <div
        className={`hide-scrollbar flex snap-x snap-mandatory items-end gap-1 overflow-x-auto overscroll-x-contain scroll-smooth border-b px-2.5 ${theme.categoryBorder}`}
      >
        {categories.map((cat, index) => {
          const isActive = activeCategory === cat.name;
          const to = buildStoreProductUrl({
            categoryName: cat.name === "All" ? "" : cat.name,
            store: currentStore,
          });

          return (
            <Link
              key={`${cat.name}-${index}`}
              to={to}
              title={cat.name}
              className={`flex w-[3.4rem] shrink-0 snap-start flex-col items-center overflow-hidden px-0.5 text-center transition ${
                isActive ? theme.categoryText : theme.categoryInactive
              }`}
            >
              {!hideIcons ? (
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  <CategoryTabIcon
                    cat={cat}
                    index={index}
                    isActive={isActive}
                    isAll={cat.name === "All"}
                  />
                </div>
              ) : null}
              <span
                className={`${hideIcons ? "mt-0" : "mt-0.5"} w-full truncate text-[10px] leading-tight ${
                  isActive ? "font-bold" : "font-semibold"
                }`}
              >
                {cat.label}
              </span>
              <div
                className={`mt-1 h-[2.5px] w-7 shrink-0 rounded-full transition-all ${
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
