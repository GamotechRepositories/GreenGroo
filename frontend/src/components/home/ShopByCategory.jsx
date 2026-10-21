import React, { useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { sectionToStoreKey, buildStoreProductUrl } from "../../utils/storeSection";
import { addCategoryVisit } from "../../utils/categoryVisits";

export const SHOP_BY_CATEGORY_ITEMS = [
  {
    id: "organic-vegetables",
    name: "Organic Vegetables",
    marathiName: "ऑर्गेनिक भाज्या",
    image: "/categories/cat_organic_vegetables.jpg",
    categoryFilter: "Vegetables",
  },
  {
    id: "fruits",
    name: "Fruits",
    marathiName: "फळे",
    image: "/categories/cat_fruits.jpg",
    categoryFilter: "Fruits",
  },
  {
    id: "pulses-grains",
    name: "Pulses & Grains",
    marathiName: "डाळी व धान्य",
    image: "/categories/cat_pulses_grains.jpg",
    categoryFilter: "Pulses",
  },
  {
    id: "exotic-vegetables",
    name: "Exotic Vegetables",
    marathiName: "एक्सोटिक भाज्या",
    image: "/categories/cat_exotic_vegetables.jpg",
    categoryFilter: "Vegetables",
  },
  {
    id: "dairy-farm-fresh",
    name: "Dairy & Farm Fresh",
    marathiName: "दुग्धजन्य उत्पादने",
    image: "/categories/cat_dairy_farm.jpg",
    categoryFilter: "Dairy",
  },
  {
    id: "organic-products",
    name: "Organic Products",
    marathiName: "सेंद्रिय उत्पादने",
    image: "/categories/cat_organic_products.jpg",
    categoryFilter: "Organic",
  },
];

export default function ShopByCategory({ items = SHOP_BY_CATEGORY_ITEMS }) {
  const [searchParams] = useSearchParams();
  const currentStore = sectionToStoreKey(searchParams.get("store"));
  const scrollContainerRef = useRef(null);

  const viewAllUrl =
    currentStore && currentStore !== "main"
      ? `/categories?store=${currentStore}`
      : "/categories";

  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === "left" ? -280 : 280;
    scrollContainerRef.current.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full py-2 sm:py-4 bg-transparent">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
        <h2 className="text-xl sm:text-2xl font-bold text-[#14532d] tracking-tight">
          Shop by Category
        </h2>

        <div className="flex items-center gap-2">
          {/* Clean arrow controls for smooth horizontal scrolling */}
          <div className="hidden sm:flex items-center gap-1 mr-1">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              aria-label="Previous categories"
              className="p-1 rounded-full text-[#14532d] hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              aria-label="Next categories"
              className="p-1 rounded-full text-[#14532d] hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Link
            to={viewAllUrl}
            className="inline-flex items-center gap-0.5 text-xs sm:text-sm font-semibold text-[#14532d] hover:text-[#0b381e] transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4 text-[#14532d]" />
          </Link>
        </div>
      </div>

      {/* Categories Row: Clean 6-col grid on desktop, smooth horizontal swipe on mobile */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-1 pt-0.5 md:grid md:grid-cols-6 md:gap-4"
      >
        {items.map((item) => {
          const targetUrl = buildStoreProductUrl({
            categoryName: item.categoryFilter || item.name,
            store: currentStore,
          });

          return (
            <Link
              key={item.id || item.name}
              to={targetUrl}
              onClick={() => addCategoryVisit(item.categoryFilter || item.name)}
              className="group flex flex-col flex-shrink-0 w-[120px] sm:w-[140px] md:w-auto items-center cursor-pointer active:opacity-85 select-none"
            >
              {/* Image Container: Clean rounded rectangle, warm studio background, stable fine border, no jitter or bouncing shadows */}
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#F6F3EB] border border-[#E8E3D8] transition-colors duration-150 group-hover:border-[#C4BAA5]">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    e.currentTarget.src = "/categories/vegetables.webp";
                  }}
                />
              </div>

              {/* Category Title in English */}
              <div className="mt-2.5 text-center w-full px-1">
                <h3 className="text-xs sm:text-[13px] md:text-sm font-bold text-[#14532d] leading-snug line-clamp-2">
                  {item.name}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
