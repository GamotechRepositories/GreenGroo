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
    image: "/categories/category_vegetables.jpg",
    categoryFilter: "Vegetables",
  },
  {
    id: "spices-dry-fruits",
    name: "Spices & Dry Fruits",
    marathiName: "मसाले व ड्रायफ्रूट्स",
    image: "/categories/category_spices_dry_fruits.jpg",
    categoryFilter: "Spices",
  },
  {
    id: "pulses-grains",
    name: "Pulses & Grains",
    marathiName: "डाळी व धान्य",
    image: "/categories/category_pulses_grains.jpg",
    categoryFilter: "Pulses",
  },
  {
    id: "exotic-vegetables",
    name: "Exotic Vegetables",
    marathiName: "एक्सोटिक भाज्या",
    image: "/categories/category_exotic_vegetables.jpg",
    categoryFilter: "Vegetables",
  },
  {
    id: "fruits",
    name: "Fruits",
    marathiName: "फळे",
    image: "/categories/category_fruits.jpg",
    categoryFilter: "Fruits",
  },
  {
    id: "organic-range",
    name: "Organic Range",
    marathiName: "सेंद्रिय उत्पादने",
    image: "/categories/category_organic_range.jpg",
    categoryFilter: "Organic",
  },
  {
    id: "dairy-eggs",
    name: "Dairy & Eggs",
    marathiName: "दुग्धजन्य व अंडी",
    image: "/categories/category_dairy_eggs.png",
    categoryFilter: "Dairy",
  },
  {
    id: "beverages-more",
    name: "Beverages & More",
    marathiName: "पेये व इतर",
    image: "/categories/category_beverages.jpg",
    categoryFilter: "Beverages",
  },
  {
    id: "combo-packs",
    name: "Combo Packs",
    marathiName: "कॉम्बो पॅक्स",
    image: "/categories/category_combo_packs.jpg",
    categoryFilter: "Organic",
  },
  {
    id: "oils-ghee",
    name: "Oils & Ghee",
    marathiName: "तेले व तूप",
    image: "/categories/category_oils_ghee.jpg",
    categoryFilter: "Oils",
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

  return (
    <section className="w-full py-2 sm:py-3.5 bg-transparent">
      {/* Section Header: Left Title & Right "View All ->" link */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 px-0.5">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
          Shop by Category
        </h2>

        <Link
          to={viewAllUrl}
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#14532d] hover:text-[#0b381e] transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#14532d]" />
        </Link>
      </div>

      {/* MOBILE VIEW: Proper 2 Rows (5 cards per row, swipeable) */}
      <div className="grid grid-rows-2 grid-flow-col auto-cols-[135px] sm:auto-cols-[150px] overflow-x-auto gap-2.5 pb-2 hide-scrollbar md:hidden -mx-3 px-3">
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
              {/* Fullsize image container */}
              <div className="w-full aspect-[4/3] rounded-xl bg-white flex items-center justify-center overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-108"
                  onError={(e) => {
                    e.currentTarget.src = "/categories/category_vegetables.jpg";
                  }}
                />
              </div>

              {/* Bold Category Name */}
              <div className="mt-1.5 w-full px-0.5">
                <h3 className="text-[11.5px] sm:text-xs font-bold text-gray-800 leading-tight line-clamp-1">
                  {item.name}
                </h3>
              </div>
            </Link>
          );
        })}
      </div>

      {/* DESKTOP VIEW: Exactly 2 rows of 5 cards each (10 cards total) with Fullsize Images */}
      <div
        ref={scrollContainerRef}
        className="hidden md:grid md:grid-cols-5 gap-3.5 lg:gap-4.5"
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
              className="group bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-500 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-md p-2.5 lg:p-3 flex flex-col items-center justify-between text-center transition-all duration-150 active:scale-95 select-none cursor-pointer"
            >
              {/* Fullsize Image Container: edge-to-edge aspect-[4/3] for 3:2 photos */}
              <div className="w-full aspect-[4/3] rounded-xl bg-white flex items-center justify-center overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-108"
                  onError={(e) => {
                    e.currentTarget.src = "/categories/category_vegetables.jpg";
                  }}
                />
              </div>

              <div className="mt-2 w-full px-1">
                <h3 className="text-xs lg:text-[13.5px] font-bold text-gray-800 leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
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
