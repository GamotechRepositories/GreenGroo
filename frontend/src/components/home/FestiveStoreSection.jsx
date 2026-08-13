import { useState } from "react";
import QuickCommerceProductCard from "../product/QuickCommerceProductCard";
import { useProductCartActions } from "../../hooks/useProductCartActions";
import SectionHeader from "../mobile/SectionHeader";
import TwoRowHorizontalProducts from "../grocery/TwoRowHorizontalProducts";

const FESTIVE_CATEGORIES = [
  "All Festive",
  "Festive Sweets",
  "Pooja Essentials",
  "Dry Fruit Hampers",
  "Decor & Diyas",
];

const FESTIVE_PRODUCTS = [
  // Sweets
  {
    _id: "festive-1",
    name: "Kaju Katli Premium Box",
    sub: "500 g",
    price: 480,
    discountedPrice: 390,
    ratings: 4.8,
    reviewCount: 420,
    productImages: [
      "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Festive Sweets"],
    stock: 50,
  },
  {
    _id: "festive-2",
    name: "Motichoor Ladoo",
    sub: "500 g",
    price: 260,
    discountedPrice: 210,
    ratings: 4.7,
    reviewCount: 310,
    productImages: [
      "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Festive Sweets"],
    stock: 40,
  },
  {
    _id: "festive-3",
    name: "Gulab Jamun Tin",
    sub: "1 kg",
    price: 240,
    discountedPrice: 190,
    ratings: 4.6,
    reviewCount: 280,
    productImages: [
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Festive Sweets"],
    stock: 45,
  },
  {
    _id: "festive-4",
    name: "Pure Ghee Besan Ladoo",
    sub: "500 g",
    price: 290,
    discountedPrice: 235,
    ratings: 4.8,
    reviewCount: 190,
    productImages: [
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Festive Sweets"],
    stock: 35,
  },

  // Pooja Essentials
  {
    _id: "festive-5",
    name: "Camphor & Brass Diya Set",
    sub: "Pack of 2 Diyas + 100g Camphor",
    price: 199,
    discountedPrice: 149,
    ratings: 4.9,
    reviewCount: 520,
    productImages: [
      "https://images.unsplash.com/photo-1606312619070-d48b7cec1f1e?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Pooja Essentials"],
    stock: 60,
  },
  {
    _id: "festive-6",
    name: "Chandan Agarbatti Premium Pack",
    sub: "Pack of 3 (150 Sticks)",
    price: 150,
    discountedPrice: 99,
    ratings: 4.7,
    reviewCount: 410,
    productImages: [
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Pooja Essentials"],
    stock: 80,
  },
  {
    _id: "festive-7",
    name: "Brass Pooja Thali Set",
    sub: "5 Piece Set",
    price: 599,
    discountedPrice: 449,
    ratings: 4.9,
    reviewCount: 230,
    productImages: [
      "https://images.unsplash.com/photo-1606312619070-d48b7cec1f1e?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Pooja Essentials"],
    stock: 30,
  },
  {
    _id: "festive-8",
    name: "Pooja Ghee & Cotton Wicks Combo",
    sub: "500ml Ghee + 200 Wicks",
    price: 350,
    discountedPrice: 280,
    ratings: 4.8,
    reviewCount: 175,
    productImages: [
      "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Pooja Essentials"],
    stock: 45,
  },

  // Dry Fruit Hampers
  {
    _id: "festive-9",
    name: "Royal Almond & Cashew Gift Box",
    sub: "500 g Box",
    price: 699,
    discountedPrice: 549,
    ratings: 4.9,
    reviewCount: 640,
    productImages: [
      "https://images.unsplash.com/photo-1508061250071-47227b62b4c0?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Dry Fruit Hampers"],
    stock: 50,
  },
  {
    _id: "festive-10",
    name: "4-in-1 Festive Nuts Assortment",
    sub: "1 kg Hamper Box",
    price: 1299,
    discountedPrice: 999,
    ratings: 4.9,
    reviewCount: 380,
    productImages: [
      "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Dry Fruit Hampers"],
    stock: 25,
  },

  // Decor & Diyas
  {
    _id: "festive-11",
    name: "Handcrafted Clay Terracotta Diyas",
    sub: "Set of 12 Diyas",
    price: 249,
    discountedPrice: 169,
    ratings: 4.8,
    reviewCount: 290,
    productImages: [
      "https://images.unsplash.com/photo-1606312619070-d48b7cec1f1e?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Decor & Diyas"],
    stock: 75,
  },
  {
    _id: "festive-12",
    name: "LED Marigold Flower String Lights",
    sub: "10 Feet Length",
    price: 399,
    discountedPrice: 279,
    ratings: 4.7,
    reviewCount: 180,
    productImages: [
      "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&h=400&q=80",
    ],
    categories: ["Decor & Diyas"],
    stock: 40,
  },
];

function FestiveStoreSection() {
  const [activeCategory, setActiveCategory] = useState("All Festive");
  const { getCartQuantity, handleAdd, handleIncrease, handleDecrease } =
    useProductCartActions();

  const filteredProducts =
    activeCategory === "All Festive"
      ? FESTIVE_PRODUCTS
      : FESTIVE_PRODUCTS.filter((p) => p.categories.includes(activeCategory));

  const cardProps = (product) => ({
    product,
    onAdd: handleAdd,
    onIncrease: handleIncrease,
    onDecrease: handleDecrease,
    cartQuantity: getCartQuantity(product),
  });

  return (
    <div className="space-y-4 py-2">
      {/* Festive Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 p-5 text-white shadow-lg border border-amber-300/40">
        <div className="relative z-10 max-w-lg">
          <span className="inline-block rounded-full bg-yellow-300/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-yellow-200 backdrop-blur-sm border border-yellow-300/40">
            ✨ Special Festival Store
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl text-white">
            Festive Celebrations &amp; Gifting
          </h2>
          <p className="mt-1 text-xs text-amber-100 sm:text-sm">
            Flat 25% OFF on Sweets, Pooja Essentials, Dry Fruit Hampers &amp; Diyas.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-amber-700 shadow-sm">
              Use Code: FESTIVE100
            </span>
          </div>
        </div>
        <div className="absolute right-2 -bottom-4 text-7xl opacity-25 select-none pointer-events-none">
          🪔
        </div>
      </div>

      {/* Festive Quick Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {FESTIVE_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-2xl px-4 py-2 text-xs font-extrabold transition-all shadow-sm ${
                isActive
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-400"
                  : "bg-white text-slate-800 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Festive Sweets & Products Display */}
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

export default FestiveStoreSection;
