import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCategoriesQuery } from "../../hooks/queries/useCategoriesQuery";
import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import SectionHeader from "../mobile/SectionHeader";
import TwoRowHorizontalProducts from "../grocery/TwoRowHorizontalProducts";
import ZeptoFestiveHeroSection from "./ZeptoFestiveHeroSection";
import SuggestedForYouSection from "./SuggestedForYouSection";
import TopPaymentOffersSection from "./TopPaymentOffersSection";
import Ready2CookHotPickBanners from "./Ready2CookHotPickBanners";
import { SUPER_MALL_CATEGORIES } from "../../data/superMallCategories";
import { SUPERMALL_PRODUCTS } from "../../sections/SuperMall/data/products";
import { sectionToStoreKey } from "../grocery/HomeMobileHeader";

export const READY2COOK_SHOP_CATEGORIES = [
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
  const [searchParams] = useSearchParams();
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  const categoryFromUrl = searchParams.get("categoryName")?.trim() || "";
  const currentFilter = categoryFromUrl || "All";
  const currentStore = sectionToStoreKey(searchParams.get("store"));

  const buildProductCategoryUrl = (catName) => {
    const params = new URLSearchParams();
    if (currentStore && currentStore !== "main") {
      params.set("store", currentStore);
    }
    if (catName && catName !== "All") {
      params.set("categoryName", catName);
    }
    const qs = params.toString();
    return qs ? `/product?${qs}` : "/product";
  };

  const targetSection = currentStore === "mall" ? "supermall" : "ready2cook";
  const { data: dbCategories = [] } = useCategoriesQuery({ section: targetSection });

  const displayCategories = useMemo(() => {
    if (Array.isArray(dbCategories) && dbCategories.length > 0) {
      return dbCategories.map((c) => ({
        _id: c._id,
        name: c.categoryName,
        slug: c.slug || c.categoryName,
        tag: c.emoji ? `${c.emoji} ${c.categoryName}` : c.categoryName,
        itemCount: c.itemCount || (c.productCount ? `${c.productCount}+ items` : "20+ items"),
        bgClass: c.bgClass || "bg-[#E8F8EE]",
        image: c.categoryImage || (currentStore === "mall" ? "/categories/grocery.webp" : "/categories/vegetables.webp"),
        emoji: c.emoji,
      }));
    }
    return currentStore === "mall" ? SUPER_MALL_CATEGORIES : READY2COOK_SHOP_CATEGORIES;
  }, [dbCategories, currentStore]);

  const productPool = currentStore === "mall" ? SUPERMALL_PRODUCTS : READY2COOK_PRODUCTS;
  const isInstant = currentStore === "mall";

  const filteredProducts =
    currentFilter === "All" || !currentFilter
      ? productPool
      : productPool.filter(
          (p) =>
            p.categories.includes(currentFilter) ||
            p.categories.some((c) => c.toLowerCase().includes(currentFilter.toLowerCase()) || currentFilter.toLowerCase().includes(c.toLowerCase()))
        );

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
  });

  return (
    <div className="space-y-2 pb-2 pt-0">
      <ZeptoFestiveHeroSection />

      {/* Store intro strip */}
      <section className="px-4 pt-2 sm:px-6 lg:px-6">
        <div
          className={`relative overflow-hidden rounded-2xl px-4 py-3.5 sm:rounded-[1.35rem] sm:px-5 sm:py-4 ${
            isInstant
              ? "bg-[linear-gradient(120deg,#1E3A8A_0%,#2563EB_55%,#60A5FA_100%)] text-white"
              : "bg-[linear-gradient(120deg,#713F12_0%,#CA8A04_50%,#EAB308_100%)] text-white"
          }`}
        >
          <div className="pointer-events-none absolute -right-2 top-1/2 -translate-y-1/2 text-6xl opacity-20 sm:text-7xl">
            {isInstant ? "⚡" : "🍳"}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/75">
            {isInstant ? "Instant delivery" : "Kitchen-ready"}
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            {isInstant ? "Get essentials in minutes" : "Chopped. Cleaned. Cook-ready."}
          </h2>
          <p className="mt-1 max-w-[85%] text-xs font-medium text-white/85 sm:text-sm">
            {isInstant
              ? "Snacks, pantry staples & daily needs — delivered instantly."
              : "Skip the prep. Fresh cut veggies & meal mixes for faster cooking."}
          </p>
        </div>
      </section>

      <Ready2CookHotPickBanners />

      {/* Shop by Category */}
      <section className="px-4 py-3 sm:px-6">
        <div className="mb-3.5 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
              Shop by Category
            </h2>
            <p className="mt-0.5 text-xs font-medium text-gray-500 sm:text-sm">
              {isInstant
                ? "Top groceries, essentials & packaged foods"
                : "Fresh picks for every kitchen need"}
            </p>
          </div>
          <Link
            to={buildProductCategoryUrl("All")}
            className={`shrink-0 text-xs font-bold hover:underline sm:text-sm ${
              isInstant ? "text-blue-700" : "text-amber-800"
            }`}
          >
            View all
          </Link>
        </div>

        <div
          className={`grid gap-2.5 sm:gap-3 ${
            isInstant
              ? "grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4"
              : "grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
          }`}
        >
          {displayCategories.map((cat) => {
            const isSelected = currentFilter === cat.name || currentFilter === cat.slug;
            return (
              <Link
                key={cat.name}
                to={buildProductCategoryUrl(cat.name)}
                className={`group relative min-h-[100px] overflow-hidden rounded-2xl border p-3 transition duration-200 hover:-translate-y-0.5 sm:min-h-[112px] sm:rounded-[1.25rem] sm:p-3.5 ${
                  isSelected
                    ? isInstant
                      ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500/25"
                      : "border-amber-600 bg-amber-50 ring-2 ring-amber-500/30"
                    : `border-gray-100 ${cat.bgClass || "bg-gray-50"}`
                }`}
              >
                <div className="relative z-10 max-w-[62%] pr-1">
                  <h3 className="line-clamp-2 text-[11px] font-bold leading-tight text-gray-900 sm:text-[13px]">
                    {cat.name}
                  </h3>
                  <p className="mt-1 truncate text-[9px] font-semibold text-gray-500 sm:text-[11px]">
                    {cat.itemCount}
                  </p>
                </div>
                <div className="absolute bottom-1.5 right-1.5 h-11 w-11 overflow-hidden rounded-xl sm:bottom-2 sm:right-2 sm:h-14 sm:w-14">
                  <img
                    src={cat.image}
                    alt=""
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <SuggestedForYouSection
        title={isInstant ? "Instant bestsellers" : "Suggested for you"}
        subtitle={
          isInstant
            ? "Fast-moving grocery & essentials"
            : "Handpicked prep-ready picks"
        }
        customProducts={filteredProducts}
      />

      <TopPaymentOffersSection />

      <section className="px-4 py-2 sm:px-6">
        <SectionHeader
          title={
            !currentFilter || currentFilter === "All"
              ? isInstant
                ? "All Instant products"
                : "All Ready2Cook products"
              : currentFilter
          }
          viewAllTo={buildProductCategoryUrl("All")}
          className="mb-3"
        />

        <div className="lg:hidden">
          <TwoRowHorizontalProducts products={filteredProducts} cardProps={cardProps} />
        </div>

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
