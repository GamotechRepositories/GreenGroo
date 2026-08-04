import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import HorizontalScrollRow from "../home/HorizontalScrollRow";

const MOBILE_ITEMS_PER_SLIDE = 6;
const DESKTOP_ITEMS_PER_SLIDE = 12;

function useItemsPerSlide() {
  const [itemsPerSlide, setItemsPerSlide] = useState(() => {
    if (typeof window === "undefined") return MOBILE_ITEMS_PER_SLIDE;
    return window.matchMedia("(min-width: 1024px)").matches
      ? DESKTOP_ITEMS_PER_SLIDE
      : MOBILE_ITEMS_PER_SLIDE;
  });

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      setItemsPerSlide(mq.matches ? DESKTOP_ITEMS_PER_SLIDE : MOBILE_ITEMS_PER_SLIDE);
    };
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return itemsPerSlide;
}

const DEFAULT_CATEGORIES = [
  { name: "Chargers", icon: "charger" },
  { name: "Earphones", icon: "earphone" },
  { name: "Cables", icon: "cable" },
  { name: "Neckbands", icon: "neckband" },
  { name: "Power Banks", icon: "powerbank" },
  { name: "Smart Watches", icon: "watch" },
  { name: "Bluetooth Speakers", icon: "speaker" },
  { name: "Mobile Covers", icon: "cover" },
  { name: "Tempered Glass", icon: "glass" },
  { name: "Adapters", icon: "adapter" },
];

const ICON_TYPES = [
  "charger",
  "earphone",
  "cable",
  "neckband",
  "powerbank",
  "watch",
  "speaker",
  "cover",
  "glass",
  "adapter",
];

function chunkCategories(items, size) {
  const batches = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}

function sortCategories(categories, direction = "asc") {
  return [...categories].sort((a, b) => {
    const result = a.name.localeCompare(b.name, "en", { sensitivity: "base" });
    return direction === "asc" ? result : -result;
  });
}

function CategoryIcon({ type, className = "h-10 w-10" }) {
  const icons = {
    charger: (
      <>
        <rect x="8" y="3" width="8" height="5" rx="1" />
        <rect x="10" y="8" width="4" height="3" />
        <rect x="9" y="11" width="6" height="8" rx="1" />
        <rect x="11" y="14" width="2" height="3" rx="0.5" />
      </>
    ),
    earphone: (
      <>
        <path d="M7 10a5 5 0 0110 0v4a2.5 2.5 0 01-2.5 2.5h-.5v3h-3v-3H9A2.5 2.5 0 016.5 14V10z" />
        <circle cx="9" cy="9" r="1.5" />
        <circle cx="15" cy="9" r="1.5" />
      </>
    ),
    cable: (
      <>
        <rect x="4" y="9" width="4" height="6" rx="1" />
        <rect x="16" y="9" width="4" height="6" rx="1" />
        <path d="M8 12h8" stroke="currentColor" strokeWidth="2" fill="none" />
      </>
    ),
    neckband: (
      <>
        <path d="M6 11a6 6 0 0112 0v3a2 2 0 01-2 2h-1.5v2h-3v-2H8a2 2 0 01-2-2v-3z" />
        <rect x="5" y="10" width="3" height="4" rx="1.5" />
        <rect x="16" y="10" width="3" height="4" rx="1.5" />
      </>
    ),
    powerbank: (
      <>
        <rect x="7" y="5" width="10" height="14" rx="2" />
        <rect x="17" y="9" width="2" height="6" rx="0.5" />
      </>
    ),
    watch: (
      <>
        <rect x="8" y="6" width="8" height="12" rx="2" />
        <rect x="10" y="4" width="4" height="2" rx="0.5" />
        <rect x="10" y="18" width="4" height="2" rx="0.5" />
        <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
    speaker: (
      <>
        <rect x="7" y="8" width="6" height="10" rx="3" />
        <rect x="13" y="10" width="4" height="6" rx="1" />
      </>
    ),
    cover: (
      <>
        <rect x="8" y="4" width="8" height="16" rx="2" />
        <circle cx="12" cy="17" r="1" />
      </>
    ),
    glass: (
      <>
        <rect x="8" y="4" width="8" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 7h6M9 10h6" stroke="currentColor" strokeWidth="1" fill="none" />
      </>
    ),
    adapter: (
      <>
        <rect x="5" y="9" width="14" height="8" rx="1.5" />
        <rect x="7" y="6" width="3" height="3" rx="0.5" />
        <rect x="11.5" y="6" width="3" height="3" rx="0.5" />
        <rect x="16" y="6" width="3" height="3" rx="0.5" />
      </>
    ),
    default: <circle cx="12" cy="12" r="7" />,
  };

  return (
    <svg
      className={`text-text-primary ${className}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      {icons[type] || icons.default}
    </svg>
  );
}

function isUsableCategoryImage(url) {
  if (!url?.trim()) return false;
  if (url.includes("res.cloudinary.com/demo")) return false;
  return true;
}

function CategoryImage({ src, name, icon, className = "h-10 w-10" }) {
  const [failed, setFailed] = useState(false);

  if (!isUsableCategoryImage(src) || failed) {
    return (
      <CategoryIcon
        type={icon}
        className={`${className} transition-transform duration-300 ease-out group-hover:scale-110`}
      />
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className="max-h-full max-w-full object-contain transition-transform duration-300 ease-out group-hover:scale-110"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function CategoryCard({ category }) {
  return (
    <Link
      to={`/product?categoryName=${encodeURIComponent(category.name)}`}
      className="group flex min-h-[118px] flex-col overflow-hidden rounded-xl border border-[#e6e6e6] bg-white transition-colors hover:border-primary sm:min-h-[172px] lg:min-h-[188px]"
    >
      <div className="flex flex-1 items-center justify-center overflow-hidden px-1 pt-2 sm:px-2 sm:pt-5">
        <div className="flex h-[52px] w-[52px] items-center justify-center sm:h-20 sm:w-20 lg:h-24 lg:w-24">
          <CategoryImage
            src={category.image}
            name={category.name}
            icon={category.icon}
            className="h-9 w-9 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
          />
        </div>
      </div>
      <p className="line-clamp-2 px-1 pb-0.5 text-center text-[10px] font-extrabold uppercase leading-tight tracking-tight text-neutral-900 transition-colors duration-300 group-hover:text-primary sm:px-2 sm:pb-1 sm:text-sm">
        {category.name.replace(/&/g, " / ")}
      </p>
      {Number.isFinite(category.productCount) ? (
        <p className="px-1 pb-2 text-center text-[9px] font-medium text-neutral-500 sm:px-2 sm:pb-3 sm:text-[11px]">
          {Math.max(0, Number(category.productCount))} products
        </p>
      ) : null}
    </Link>
  );
}

function CategoryTwoRowSlider({ sectionKey, categories }) {
  const itemsPerSlide = useItemsPerSlide();

  const batches = useMemo(
    () => chunkCategories(categories, itemsPerSlide),
    [categories, itemsPerSlide]
  );

  if (categories.length === 0) return null;

  return (
    <div className="mb-6 last:mb-0 sm:mb-8">
      <div className="px-1 sm:px-2">
        <HorizontalScrollRow autoScroll gapClassName="gap-0">
          {batches.map((batch, batchIndex) => (
            <div
              key={`${sectionKey}-batch-${batchIndex}`}
              className="w-full shrink-0 snap-start px-0.5 pb-1"
            >
              <div className="grid grid-cols-3 grid-rows-2 gap-2 sm:gap-3 lg:grid-cols-6 lg:gap-4">
                {batch.map((category) => (
                  <CategoryCard key={`${sectionKey}-${category.name}`} category={category} />
                ))}
              </div>
            </div>
          ))}
        </HorizontalScrollRow>
      </div>
    </div>
  );
}

function CategoryNav() {
  const { data: apiCategories = [] } = useCategoriesQuery();

  const categories = useMemo(() => {
    const filtered = apiCategories.filter(
      (cat) => cat.categoryName?.toLowerCase() !== "most purchase"
    );

    if (filtered.length === 0) {
      return DEFAULT_CATEGORIES;
    }

    return filtered.map((cat, index) => ({
      name: cat.categoryName,
      image: isUsableCategoryImage(cat.categoryImage) ? cat.categoryImage : undefined,
      icon: ICON_TYPES[index % ICON_TYPES.length],
      productCount: Number(cat.productCount) || 0,
    }));
  }, [apiCategories]);

  const categoriesAZ = useMemo(() => sortCategories(categories, "asc"), [categories]);
  const categoriesZA = useMemo(() => sortCategories(categories, "desc"), [categories]);

  return (
    <section className="bg-mobile-bg px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
          <h2 className="text-lg font-bold text-text-primary sm:text-xl lg:text-2xl">
            Explore Our Categories
          </h2>
          <Link
            to="/product"
            className="shrink-0 text-sm font-semibold text-primary transition hover:underline"
          >
            View All
          </Link>
        </div>

        <CategoryTwoRowSlider sectionKey="az" categories={categoriesAZ} />

        <CategoryTwoRowSlider sectionKey="za" categories={categoriesZA} />
      </div>
    </section>
  );
}

export default CategoryNav;
