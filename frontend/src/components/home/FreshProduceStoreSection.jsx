import { useState } from "react";
import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import SectionHeader from "../mobile/SectionHeader";
import TwoRowHorizontalProducts from "../grocery/TwoRowHorizontalProducts";

const FRESH_CATEGORIES = [
  "All Fresh Produce",
  "Daily Vegetables",
  "Seasonal Fruits",
  "Organic Herbs & Leafy",
  "Exotic Veggies",
];

const FRESH_PRODUCE_PRODUCTS = [
  // Veggies
  {
    _id: "fresh-1",
    name: "Farm Fresh Tomatoes",
    sub: "1 kg",
    price: 45,
    discountedPrice: 28,
    ratings: 4.9,
    reviewCount: 780,
    productImages: [
      "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Daily Vegetables"],
    stock: 100,
  },
  {
    _id: "fresh-2",
    name: "Organic Red Onions",
    sub: "1 kg",
    price: 38,
    discountedPrice: 25,
    ratings: 4.8,
    reviewCount: 650,
    productImages: [
      "https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Daily Vegetables"],
    stock: 120,
  },
  {
    _id: "fresh-3",
    name: "Shimla Potatoes",
    sub: "1 kg",
    price: 32,
    discountedPrice: 22,
    ratings: 4.7,
    reviewCount: 520,
    productImages: [
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Daily Vegetables"],
    stock: 90,
  },
  {
    _id: "fresh-4",
    name: "Fresh Green Capsicum",
    sub: "500 g",
    price: 40,
    discountedPrice: 29,
    ratings: 4.8,
    reviewCount: 340,
    productImages: [
      "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Daily Vegetables"],
    stock: 60,
  },

  // Fruits
  {
    _id: "fresh-5",
    name: "Alphonso Mangoes Box",
    sub: "1 Dozen (12 Pcs)",
    price: 699,
    discountedPrice: 549,
    ratings: 4.9,
    reviewCount: 920,
    productImages: [
      "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Seasonal Fruits"],
    stock: 40,
  },
  {
    _id: "fresh-6",
    name: "Crispy Shimla Apples",
    sub: "1 kg",
    price: 160,
    discountedPrice: 125,
    ratings: 4.8,
    reviewCount: 480,
    productImages: [
      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Seasonal Fruits"],
    stock: 70,
  },
  {
    _id: "fresh-7",
    name: "Sweet Juicy Oranges",
    sub: "1 kg",
    price: 90,
    discountedPrice: 69,
    ratings: 4.7,
    reviewCount: 390,
    productImages: [
      "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Seasonal Fruits"],
    stock: 80,
  },
  {
    _id: "fresh-8",
    name: "Green Seedless Grapes",
    sub: "500 g",
    price: 75,
    discountedPrice: 55,
    ratings: 4.9,
    reviewCount: 410,
    productImages: [
      "https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Seasonal Fruits"],
    stock: 65,
  },

  // Organic Herbs
  {
    _id: "fresh-9",
    name: "Fresh Palak (Spinach) Bunch",
    sub: "250 g",
    price: 25,
    discountedPrice: 18,
    ratings: 4.9,
    reviewCount: 510,
    productImages: [
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Organic Herbs & Leafy"],
    stock: 100,
  },
  {
    _id: "fresh-10",
    name: "Coriander & Mint Combo",
    sub: "100 g + 100 g",
    price: 30,
    discountedPrice: 20,
    ratings: 4.8,
    reviewCount: 630,
    productImages: [
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Organic Herbs & Leafy"],
    stock: 110,
  },

  // Exotic Veggies
  {
    _id: "fresh-11",
    name: "Fresh Green Broccoli",
    sub: "1 Pc (approx 400g)",
    price: 80,
    discountedPrice: 59,
    ratings: 4.8,
    reviewCount: 290,
    productImages: [
      "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Exotic Veggies"],
    stock: 35,
  },
  {
    _id: "fresh-12",
    name: "Button Mushrooms Pack",
    sub: "200 g Pack",
    price: 60,
    discountedPrice: 45,
    ratings: 4.7,
    reviewCount: 320,
    productImages: [
      "https://images.unsplash.com/photo-1568584711075-3d021a7e8cae?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Exotic Veggies"],
    stock: 45,
  },
];

function FreshProduceStoreSection() {
  const [activeCategory, setActiveCategory] = useState("All Fresh Produce");
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  const filteredProducts =
    activeCategory === "All Fresh Produce"
      ? FRESH_PRODUCE_PRODUCTS
      : FRESH_PRODUCE_PRODUCTS.filter((p) =>
          p.categories.includes(activeCategory)
        );

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
  });

  return (
    <div className="space-y-4 py-2">
      {/* Fresh Produce Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 p-5 text-white shadow-lg border border-emerald-300/40">
        <div className="relative z-10 max-w-lg">
          <span className="inline-block rounded-full bg-emerald-300/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-200 backdrop-blur-sm border border-emerald-300/40">
            🌿 100% Organic &amp; Farm Fresh
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl text-white">
            Directly From Local Farmers
          </h2>
          <p className="mt-1 text-xs text-emerald-100 sm:text-sm">
            Harvested Today • Zero Harmful Chemicals • Guaranteed Freshness.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-800 shadow-sm">
              ✓ Harvested Within 12 hrs
            </span>
            <span className="rounded-full bg-emerald-900/60 px-3 py-1 text-xs font-extrabold text-emerald-200 border border-emerald-400/30">
              ✓ Money Back Guarantee
            </span>
          </div>
        </div>
        <div className="absolute right-2 -bottom-4 text-7xl opacity-20 select-none pointer-events-none">
          🥦
        </div>
      </div>

      {/* Fresh Categories Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {FRESH_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-2xl px-4 py-2 text-xs font-extrabold transition-all shadow-sm ${
                isActive
                  ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/30 ring-2 ring-emerald-400"
                  : "bg-white text-slate-800 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Fresh Products Display */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <SectionHeader
          title={activeCategory}
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

export default FreshProduceStoreSection;
