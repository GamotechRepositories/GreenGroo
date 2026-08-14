import { Link, useSearchParams } from "react-router-dom";
import { resolveStoreTheme } from "../grocery/homeHeaderThemes";

const HERO_CARDS = [
  {
    title: "Daily Veggies",
    badge: "Up To 40% Off",
    link: "/product?categoryName=Vegetables",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    title: "Fresh Fruits",
    badge: "Flat 30% Off",
    link: "/product?categoryName=Fruits",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    title: "Green Leafy Bhaji",
    badge: "From ₹19",
    link: "/product?categoryName=Vegetables",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=300&h=300&q=80",
  },
  {
    title: "Nashik Organic",
    badge: "Save Up To ₹50",
    link: "/product?categoryName=Organic",
    image: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=300&h=300&q=80",
  },
];

export default function ZeptoFestiveHeroSection() {
  const [searchParams] = useSearchParams();
  const currentStore = searchParams.get("store")?.trim()?.toLowerCase() || "main";
  const theme = resolveStoreTheme(currentStore);
  const isGreenTheme = currentStore !== "festive";

  const outerBg = isGreenTheme
    ? "bg-gradient-to-b from-[#C6F6D5] via-[#C6F6D5] to-[#A7F3D0] border-emerald-300/40"
    : "bg-gradient-to-b from-[#FFE0B2] via-[#FFE0B2] to-[#FFB763] border-amber-300/40";

  return (
    <section className={`${theme.contentBg} px-4 sm:px-6 pt-1 pb-3 transition-colors duration-300`}>
      {/* Outer Dynamic Theme Gradient Box */}
      <div className={`relative overflow-hidden rounded-3xl ${outerBg} p-3 sm:p-5 shadow-sm border`}>
        
        {/* 1. Sky Blue Video Header Card (Clean Video View with Explore More Button) */}
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-4 sm:p-6 text-center text-white shadow-md border border-blue-300/50 min-h-[160px] sm:min-h-[190px] flex flex-col justify-end items-center">
          
          {/* Background Auto-Playing Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-90 pointer-events-none"
            src="/10847026-hd_1920_1080_25fps.mp4"
          />

          {/* Subtle Bottom Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20 pointer-events-none" />

          {/* Explore More White Pill Button */}
          <div className="relative z-10 mb-1">
            <Link
              to="/product"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 sm:px-6 py-1.5 text-xs sm:text-sm font-black text-slate-900 shadow-lg transition hover:bg-slate-50 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Explore more
            </Link>
          </div>
        </div>

        {/* 2. Farmers & Vegetables Trust Partners Bar */}
        <div className="my-2.5 rounded-2xl bg-white px-3 py-2 shadow-xs border border-white/80 flex items-center justify-between text-[10px] sm:text-xs font-black text-slate-900 overflow-x-auto hide-scrollbar gap-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-500 font-semibold">Direct Farmers</span>
            <span className="rounded bg-emerald-700 px-2 py-0.5 text-white font-black">👨‍🌾 Nashik Farmers Co-op</span>
          </div>

          <div className="h-4 w-px bg-slate-200 shrink-0" />

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-slate-500 font-semibold">Quality Guarantee</span>
            <span className="font-extrabold text-emerald-800 flex items-center gap-1">🌿 100% Organic</span>
            <span className="font-black text-emerald-900 flex items-center gap-1">🚜 Direct Farm Harvest</span>
            <span className="font-bold text-teal-800 flex items-center gap-1">🔬 Quality Checked</span>
          </div>

          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white text-[10px]">
            →
          </div>
        </div>

        {/* 3. 4-Column Category Offer Cards (Yellow Bottom Badges) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {HERO_CARDS.map((card) => (
            <Link
              key={card.title}
              to={card.link}
              className="rounded-2xl bg-white p-2 sm:p-3 shadow-xs border border-white/80 flex flex-col justify-between items-center text-center group cursor-pointer transition hover:scale-[1.02] overflow-hidden"
            >
              <h4 className="text-[10px] sm:text-xs font-black text-slate-900 leading-tight line-clamp-1 min-h-[16px]">
                {card.title}
              </h4>

              <div className="my-1.5 h-14 sm:h-20 w-full overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center">
                <img
                  src={card.image}
                  alt={card.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              {/* Yellow Bottom Badge */}
              <div className="w-full rounded-xl bg-[#FFD600] py-1 px-1 text-[10px] sm:text-xs font-black text-slate-950 uppercase shadow-xs">
                {card.badge}
              </div>
            </Link>
          ))}
        </div>

        {/* 4. SBI Card Instant Discount Pill */}
        <div className="mt-2.5 rounded-2xl bg-white p-2.5 sm:p-3 shadow-xs border border-white/80 flex items-center justify-center gap-2 text-center text-slate-900 cursor-pointer hover:bg-slate-50">
          <span className="font-black text-sky-700 text-xs sm:text-sm">💳 SBI card</span>
          <span className="h-3 w-px bg-slate-300" />
          <span className="text-[10px] sm:text-xs font-black text-slate-900">
            10% Instant Discount* <span className="text-slate-500 font-medium hidden sm:inline">with SBI Credit Card &amp; EMI Txns</span>
          </span>
        </div>

      </div>
    </section>
  );
}
