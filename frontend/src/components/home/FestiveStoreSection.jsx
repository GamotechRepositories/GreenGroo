import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import SectionHeader from "../mobile/SectionHeader";
import TwoRowHorizontalProducts from "../grocery/TwoRowHorizontalProducts";
import HomeSlidingBanners from "./HomeSlidingBanners";
import FestiveSaleGridSection from "./FestiveSaleGridSection";
import ZeptoFestiveHeroSection from "./ZeptoFestiveHeroSection";

const READY2COOK_SHOP_CATEGORIES = [
  {
    name: "Chopped",
    tag: "🧅 Chopped",
    itemCount: "25+ items",
    bgClass: "bg-[#E8F8EE]",
    image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    name: "Cut & Sliced",
    tag: "🥕 Cut & Sliced",
    itemCount: "30+ items",
    bgClass: "bg-[#EEFBEB]",
    image: "https://images.unsplash.com/photo-1598170845058-12ef4a457c39?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    name: "Peeled & Cleaned",
    tag: "🥔 Peeled & Cleaned",
    itemCount: "20+ items",
    bgClass: "bg-[#EBF7FF]",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    name: "Cleaned Bhaji",
    tag: "🌿 Cleaned Bhaji",
    itemCount: "15+ items",
    bgClass: "bg-[#E8F8EE]",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    name: "Veggie Mix",
    tag: "🥗 Veggie Mix",
    itemCount: "18+ items",
    bgClass: "bg-[#FFF8E7]",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    name: "Bhaji Mix",
    tag: "🍲 Bhaji Mix",
    itemCount: "22+ items",
    bgClass: "bg-[#FFF3D6]",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    name: "Herbs",
    tag: "🌱 Herbs",
    itemCount: "12+ items",
    bgClass: "bg-[#E8F8EE]",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    name: "Combo Packs",
    tag: "📦 Combo Packs",
    itemCount: "10+ items",
    bgClass: "bg-[#FFE8E8]",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&h=300&q=80",
  },
];

const READY2COOK_PRODUCTS = [
  // Chopped
  {
    _id: "rtc-1",
    name: "Finely Chopped Red Onions",
    sub: "250 g",
    price: 45,
    discountedPrice: 35,
    ratings: 4.9,
    reviewCount: 380,
    productImages: [
      "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=500&h=500&q=80",
    ],
    categories: ["Chopped", "🧅 Chopped"],
    stock: 50,
  },
  {
    _id: "rtc-2",
    name: "Diced Tomatoes & Green Chillies",
    sub: "250 g",
    price: 40,
    discountedPrice: 30,
    ratings: 4.8,
    reviewCount: 290,
    productImages: [
      "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&h=500&q=80",
    ],
    categories: ["Chopped", "🧅 Chopped"],
    stock: 45,
  },
  {
    _id: "rtc-3",
    name: "Chopped Capsicum & Garlic Mix",
    sub: "200 g",
    price: 50,
    discountedPrice: 40,
    ratings: 4.7,
    reviewCount: 210,
    productImages: [
      "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=500&h=500&q=80",
    ],
    categories: ["Chopped", "🧅 Chopped"],
    stock: 35,
  },

  // Cut & Sliced
  {
    _id: "rtc-4",
    name: "Sliced Carrots & Beetroot Salad Cut",
    sub: "300 g",
    price: 55,
    discountedPrice: 45,
    ratings: 4.9,
    reviewCount: 410,
    productImages: [
      "https://images.unsplash.com/photo-1598170845058-12ef4a457c39?auto=format&fit=crop&w=500&h=500&q=80",
    ],
    categories: ["Cut & Sliced", "🥕 Cut & Sliced"],
    stock: 60,
  },
  {
    _id: "rtc-5",
    name: "Julienne Cut Carrots & French Beans",
    sub: "250 g",
    price: 60,
    discountedPrice: 50,
    ratings: 4.8,
    reviewCount: 320,
    productImages: [
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&h=500&q=80",
    ],
    categories: ["Cut & Sliced", "🥕 Cut & Sliced"],
    stock: 40,
  },

  // Peeled & Cleaned
  {
    _id: "rtc-6",
    name: "Peeled Baby Potatoes",
    sub: "500 g",
    price: 60,
    discountedPrice: 48,
    ratings: 4.8,
    reviewCount: 510,
    productImages: [
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&h=500&q=80",
    ],
    categories: ["Peeled & Cleaned", "🥔 Peeled & Cleaned"],
    stock: 70,
  },
  {
    _id: "rtc-7",
    name: "Peeled Garlic Cloves",
    sub: "100 g",
    price: 50,
    discountedPrice: 42,
    ratings: 4.9,
    reviewCount: 650,
    productImages: [
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&h=500&q=80",
    ],
    categories: ["Peeled & Cleaned", "🥔 Peeled & Cleaned"],
    stock: 80,
  },

  // Cleaned Bhaji
  {
    _id: "rtc-8",
    name: "Triple Washed & Cleaned Palak (Spinach)",
    sub: "250 g Pack",
    price: 45,
    discountedPrice: 35,
    ratings: 4.9,
    reviewCount: 580,
    productImages: [
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&h=500&q=80",
    ],
    categories: ["Cleaned Bhaji", "🌿 Cleaned Bhaji"],
    stock: 55,
  },

  // Veggie Mix
  {
    _id: "rtc-10",
    name: "Fried Rice & Chowmein Veggie Mix",
    sub: "300 g Pack",
    price: 80,
    discountedPrice: 65,
    ratings: 4.9,
    reviewCount: 490,
    productImages: [
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&h=500&q=80",
    ],
    categories: ["Veggie Mix", "🥗 Veggie Mix"],
    stock: 50,
  },

  // Bhaji Mix
  {
    _id: "rtc-12",
    name: "Pav Bhaji Special Chopped Veggies",
    sub: "500 g Pack",
    price: 95,
    discountedPrice: 75,
    ratings: 4.9,
    reviewCount: 720,
    productImages: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&h=500&q=80",
    ],
    categories: ["Bhaji Mix", "🍲 Bhaji Mix"],
    stock: 65,
  },

  // Herbs
  {
    _id: "rtc-14",
    name: "Fresh Mint & Coriander Combo",
    sub: "150 g Pack",
    price: 40,
    discountedPrice: 30,
    ratings: 4.9,
    reviewCount: 380,
    productImages: [
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&h=500&q=80",
    ],
    categories: ["Herbs", "🌱 Herbs"],
    stock: 60,
  },

  // Combo Packs
  {
    _id: "rtc-15",
    name: "Daily Sabzi Prep Essentials Kit",
    sub: "1 kg Super Saver Pack",
    price: 189,
    discountedPrice: 149,
    ratings: 5.0,
    reviewCount: 890,
    productImages: [
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=500&h=500&q=80",
    ],
    categories: ["Combo Packs", "📦 Combo Packs"],
    stock: 45,
  },
];

function FestiveStoreSection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("All");
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  const categoryFromUrl = searchParams.get("categoryName")?.trim() || "";
  const currentFilter = categoryFromUrl || activeCategory;

  const handleSelectCategory = (catName) => {
    setActiveCategory(catName);
    const nextParams = new URLSearchParams(searchParams);
    if (catName === "All") {
      nextParams.delete("categoryName");
    } else {
      nextParams.set("categoryName", catName);
    }
    setSearchParams(nextParams);
  };

  const filteredProducts =
    currentFilter === "All" || !currentFilter
      ? READY2COOK_PRODUCTS
      : READY2COOK_PRODUCTS.filter(
          (p) =>
            p.categories.includes(currentFilter) ||
            p.categories.some((c) => c.toLowerCase().includes(currentFilter.toLowerCase()))
        );

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
  });

  return (
    <div className="space-y-4 py-1">
      {/* Zepto Festive Freedom Sale Banner Structure (Matching Photos 1 & 2) */}
      <ZeptoFestiveHeroSection />

      {/* Shop by Category Section */}
      <section className="px-4 sm:px-6 py-3">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
              Shop by Category
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-500 sm:text-sm">
              Fresh picks for every kitchen need
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSelectCategory("All")}
            className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          {READY2COOK_SHOP_CATEGORIES.map((cat) => {
            const isSelected = currentFilter === cat.name;
            return (
              <div
                key={cat.name}
                onClick={() => handleSelectCategory(cat.name)}
                className={`group relative overflow-hidden rounded-2xl p-2.5 sm:p-4 min-h-[92px] sm:min-h-[110px] cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md border ${
                  isSelected
                    ? "border-emerald-600 ring-2 ring-emerald-500/30"
                    : "border-transparent"
                } ${cat.bgClass}`}
              >
                <div className="relative z-10 max-w-[60%] sm:max-w-[65%] pr-1">
                  <h3 className="text-[11px] sm:text-base font-black text-slate-900 leading-tight">
                    {cat.name}
                  </h3>
                  <p className="mt-0.5 text-[9px] sm:text-xs font-semibold text-slate-600">
                    {cat.itemCount}
                  </p>
                </div>
                <div className="absolute right-1 bottom-1 h-11 w-11 sm:h-16 sm:w-16 overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover rounded-xl shadow-xs"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Festive Freedom Sale Grid Section matching user screenshot */}
      <FestiveSaleGridSection />

      {/* Sliding Banners Section */}
      <HomeSlidingBanners />

      {/* Category Products Section */}
      <section className="px-4 sm:px-6 py-2">
        <SectionHeader
          title={!currentFilter || currentFilter === "All" ? "All Ready-to-Cook Products" : currentFilter}
          viewAllTo="/product"
          className="mb-3"
        />

        {/* Mobile View: 2-Row Horizontal Scroll */}
        <div className="lg:hidden">
          <TwoRowHorizontalProducts products={filteredProducts} cardProps={cardProps} />
        </div>

        {/* Desktop View: Grid */}
        <div className="hidden grid-cols-4 gap-4 lg:grid xl:grid-cols-5">
          {filteredProducts.map((product) => (
            <QuickCommerceProductCard
              key={product._id}
              {...cardProps(product)}
              layout="grid"
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default FestiveStoreSection;
