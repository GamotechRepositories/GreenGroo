import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resolveStoreTheme } from "../grocery/homeHeaderThemes";
import HomeSlidingBanners from "./HomeSlidingBanners";

const HERO_CARDS = [
  {
    title: "Daily Veggies",
    badge: "UP TO 40% OFF",
    link: "/product?categoryName=Vegetables",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&h=400&q=80",
  },
  {
    title: "Fresh Fruits",
    badge: "FLAT 30% OFF",
    link: "/product?categoryName=Fruits",
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&h=400&q=80",
  },
  {
    title: "Green Leafy Bhaji",
    badge: "FROM ₹19",
    link: "/product?categoryName=Vegetables",
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=400&h=400&q=80",
  },
  {
    title: "Nashik Organic",
    badge: "SAVE UP TO ₹50",
    link: "/product?categoryName=Organic",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&h=400&q=80",
  },
];

const TICKER_OFFERS = [
  {
    icon: "🏷️",
    badge: "SPECIAL OFFER",
    badgeBg: "bg-amber-500 text-slate-950",
    text: "FLAT 50% OFF on First 3 Orders",
    code: "USE: FRESH50",
    link: "/coupons",
  },
  {
    icon: "👨‍🌾",
    badge: "DIRECT FARMERS",
    badgeBg: "bg-emerald-700 text-white",
    text: "Nashik Farmers Co-op Harvest",
    code: "100% ORGANIC",
    link: "/product?categoryName=Organic",
  },
  {
    icon: "⚡",
    badge: "EXPRESS",
    badgeBg: "bg-emerald-600 text-white",
    text: "FREE 10-Min Express Delivery on ₹99+",
    code: "NO CODE NEEDED",
    link: "/product",
  },
  {
    icon: "💳",
    badge: "BANK DEAL",
    badgeBg: "bg-sky-600 text-white",
    text: "10% Instant Discount on SBI Cards",
    code: "SAVE UP TO ₹100",
    link: "/coupons",
  },
  {
    icon: "🎁",
    badge: "FREE GIFT",
    badgeBg: "bg-purple-600 text-white",
    text: "Free Fresh Palak Bunch on Orders ₹199+",
    code: "AUTO-ADDED",
    link: "/product?categoryName=Vegetables",
  },
];

function MovingOfferMarquee() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white py-2 px-1 shadow-xs border border-white/90">
      <style>{`
        @keyframes offerMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-offer-marquee {
          display: flex;
          width: max-content;
          animation: offerMarquee 24s linear infinite;
        }
        .animate-offer-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="animate-offer-marquee flex items-center gap-2.5">
        {[...TICKER_OFFERS, ...TICKER_OFFERS].map((offer, index) => (
          <Link
            key={`${offer.badge}-${index}`}
            to={offer.link || "/coupons"}
            className="flex items-center gap-2 shrink-0 rounded-xl bg-slate-50 px-2.5 py-1 border border-slate-100 hover:bg-emerald-50 transition cursor-pointer"
          >
            <span className="text-sm">{offer.icon}</span>
            <span className={`rounded-md px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider ${offer.badgeBg}`}>
              {offer.badge}
            </span>
            <span className="text-xs font-black text-slate-900 whitespace-nowrap">
              {offer.text}
            </span>
            <span className="rounded bg-white px-1.5 py-0.5 text-[9.5px] font-extrabold text-emerald-800 border border-emerald-200/80 whitespace-nowrap shadow-2xs">
              {offer.code}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ZeptoFestiveHeroSection() {
  const [searchParams] = useSearchParams();
  const currentStore = searchParams.get("store")?.trim()?.toLowerCase() || "main";
  const theme = resolveStoreTheme(currentStore);

  // Ready2Cook store view: Show Sliding Banners only
  if (currentStore === "festive") {
    return (
      <div className={`${theme.contentBg} transition-colors duration-300 pb-1`}>
        <HomeSlidingBanners />
      </div>
    );
  }

  return (
    <section className={`${theme.bannerBg || theme.contentBg} pt-0 pb-4 transition-colors duration-300 space-y-2.5 rounded-b-3xl sm:rounded-b-[36px] overflow-hidden`}>
      {/* 1. Sky Blue Video Header Card (Full Width Edge-to-Edge with Explore More Button) */}
      <div className="relative w-full overflow-hidden rounded-b-[20px] sm:rounded-b-[24px] rounded-t-none bg-slate-900 p-4 sm:p-6 text-center text-white shadow-md border-b border-blue-300/30 min-h-[160px] sm:min-h-[190px] flex flex-col justify-end items-center">
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

      {/* Container with side padding for Marquee, Category Cards & SBI Pill */}
      <div className="px-4 sm:px-6 space-y-2.5">
        {/* 2. Continuous Moving Offers Marquee Ticker Strip */}
        <MovingOfferMarquee />

        {/* 3. 4-Column Category Offer Cards (Zepto Style Yellow Pill Badges) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {HERO_CARDS.map((card) => (
            <Link
              key={card.title}
              to={card.link}
              className="group relative flex flex-col justify-between items-center rounded-2xl bg-white p-2 sm:p-2.5 text-center shadow-xs border border-white/90 transition-all duration-200 hover:scale-[1.03] hover:shadow-md cursor-pointer overflow-hidden"
            >
              <h4 className="text-[10.5px] sm:text-xs font-black text-slate-900 leading-tight line-clamp-1 min-h-[15px] sm:min-h-[18px]">
                {card.title}
              </h4>

              <div className="my-1.5 h-16 sm:h-20 w-full overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center p-1">
                <img
                  src={card.image}
                  alt={card.title}
                  className="h-full w-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              {/* Yellow Offer Pill Badge */}
              <div className="w-full rounded-xl bg-[#FFD600] py-1 px-0.5 text-[9.5px] sm:text-xs font-black text-slate-950 uppercase shadow-2xs tracking-tight line-clamp-1">
                {card.badge}
              </div>
            </Link>
          ))}
        </div>

        {/* 4. SBI Card Instant Discount Pill */}
        <div className="rounded-2xl bg-white p-2.5 sm:p-3 shadow-xs border border-white/80 flex items-center justify-center gap-2 text-center text-slate-900 cursor-pointer hover:bg-slate-50">
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
