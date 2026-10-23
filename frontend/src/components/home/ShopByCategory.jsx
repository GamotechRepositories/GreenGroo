import React, { useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, ChevronRight, ChevronLeft } from "lucide-react";
import { sectionToStoreKey, buildStoreProductUrl } from "../../utils/storeSection";
import { addCategoryVisit } from "../../utils/categoryVisits";

export const SHOP_BY_CATEGORY_ITEMS = [
  {
    id: "vegetables",
    name: "Vegetables",
    marathiName: "भाज्या",
    image: "/categories/shop_vegetables.jpg",
    categoryFilter: "Vegetables",
  },
  {
    id: "fruits",
    name: "Fruits",
    marathiName: "फळे",
    image: "/categories/shop_fruits.jpg",
    categoryFilter: "Fruits",
  },
  {
    id: "pulses-grains",
    name: "Pulses & Grains",
    marathiName: "डाळी व धान्य",
    image: "/categories/shop_pulses.jpg",
    categoryFilter: "Pulses",
  },
  {
    id: "organic-range",
    name: "Organic Range",
    marathiName: "सेंद्रिय उत्पादने",
    image: "/categories/shop_organic_range.jpg",
    categoryFilter: "Organic",
  },
  {
    id: "dairy-eggs",
    name: "Dairy & Eggs",
    marathiName: "दुग्धजन्य व अंडी",
    image: "/categories/shop_dairy_eggs.jpg",
    categoryFilter: "Dairy",
  },
  {
    id: "spices-dry-fruits",
    name: "Spices & Dry Fruits",
    marathiName: "मसाले व ड्रायफ्रूट्स",
    image: "/categories/shop_dry_fruits.jpg",
    categoryFilter: "Spices",
  },
  {
    id: "beverages-more",
    name: "Beverages & More",
    marathiName: "पेये व इतर",
    image: "/categories/shop_beverages.jpg",
    categoryFilter: "Beverages",
  },
  {
    id: "exotic-vegetables",
    name: "Exotic Vegetables",
    marathiName: "एक्सोटिक भाज्या",
    image: "/categories/cat_exotic_vegetables.jpg",
    categoryFilter: "Vegetables",
  },
  {
    id: "combo-packs",
    name: "Combo Packs",
    marathiName: "कॉम्बो पॅक्स",
    image: "/categories/shop_combo_packs.jpg",
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
    <section className="w-full py-2 sm:py-3.5 bg-transparent">
      {/* Section Header: Left Title & Right "View All ->" link */}
      <div className="flex items-center justify-between mb-2.5 sm:mb-3.5 px-0.5">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
          Shop by Category
        </h2>

        <div className="flex items-center gap-2">
          {/* Desktop Arrow Controls */}
          <div className="hidden sm:flex items-center gap-1 mr-1">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              aria-label="Previous categories"
              className="p-1 rounded-full text-gray-700 hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              aria-label="Next categories"
              className="p-1 rounded-full text-gray-700 hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Link
            to={viewAllUrl}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#14532d] hover:text-[#0b381e] transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#14532d]" />
          </Link>
        </div>
      </div>

      {/* MOBILE VIEW: Exactly 3-column x 3-row grid matching photo */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 md:hidden">
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
              className="group bg-white rounded-2xl border border-gray-200/90 shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-2 flex flex-col items-center justify-between text-center transition-all duration-150 active:scale-[0.97] hover:border-emerald-500 hover:shadow-xs select-none"
            >
              {/* Product cutout image on pure white container */}
              <div className="w-full aspect-square rounded-xl bg-white flex items-center justify-center p-0.5 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = "/categories/vegetables.webp";
                  }}
                />
              </div>

              {/* Bold Category Name */}
              <div className="mt-1.5 w-full px-0.5">
                <h3 className="text-[11px] sm:text-xs font-bold text-gray-800 leading-tight line-clamp-1">
                  {item.name}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>

      {/* DESKTOP VIEW: Sleek responsive grid */}
      <div
        ref={scrollContainerRef}
        className="hidden md:grid md:grid-cols-6 lg:grid-cols-9 gap-3 lg:gap-3.5"
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
              className="group bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-500 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-md p-2.5 flex flex-col items-center justify-between text-center transition-all duration-150 active:scale-95 select-none cursor-pointer"
            >
              <div className="w-full aspect-square rounded-xl bg-white flex items-center justify-center p-1 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = "/categories/vegetables.webp";
                  }}
                />
              </div>

              <div className="mt-2 w-full px-1">
                <h3 className="text-xs lg:text-[13px] font-bold text-gray-800 leading-snug line-clamp-2">
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
