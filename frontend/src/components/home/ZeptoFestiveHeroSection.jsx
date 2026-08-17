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
    <div className="relative overflow-hidden rounded-xl bg-white py-1 px-1 shadow-2xs border border-white/90">
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
            className="flex items-center gap-1.5 shrink-0 px-1.5 py-0.5 transition cursor-pointer hover:opacity-80"
          >
            <span className="text-xs">{offer.icon}</span>
            <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${offer.badgeBg}`}>
              {offer.badge}
            </span>
            <span className="text-[11px] font-black text-slate-900 whitespace-nowrap">
              {offer.text}
            </span>
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-800 border border-emerald-300/60 whitespace-nowrap">
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

  // Ready2Cook and Super Mall store views: Show Sliding Banners format like Ready2Cook
  if (currentStore === "festive" || currentStore === "mall") {
    return (
      <div className={`${theme.contentBg} transition-colors duration-300 pb-1`}>
        <HomeSlidingBanners />
      </div>
    );
  }

  const sectionBgClass = theme.bannerBg || theme.contentBg;

  return (
    <section className={`${sectionBgClass} pt-0 pb-4 transition-colors duration-300 space-y-2.5 rounded-b-3xl sm:rounded-b-[36px] overflow-hidden`}>
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

        {/* 3. 4-Column Category Offer Cards (Exact 1:1 Reference Screenshot UI) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {HERO_CARDS.map((card) => (
            <Link
              key={card.title}
              to={card.link}
              className="group relative flex flex-col justify-between items-center rounded-2xl bg-white text-center shadow-xs border-2 border-amber-300/80 transition-all duration-200 hover:scale-[1.03] hover:shadow-md cursor-pointer overflow-hidden pt-2.5"
            >
              {/* Top Category Title */}
              <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 leading-tight px-1 line-clamp-1 min-h-[16px]">
                {card.title}
              </h4>

              {/* Center Product Image (Direct Clean View) */}
              <div className="my-1.5 h-16 sm:h-22 w-full flex items-center justify-center px-1">
                <img
                  src={card.image}
                  alt={card.title}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              {/* Edge-to-Edge Yellow Bottom Offer Block (Exact Reference UI) */}
              <div className="w-full bg-[#FFD600] py-1.5 px-0.5 text-[10.5px] sm:text-xs font-black text-slate-950 uppercase tracking-tight line-clamp-1 rounded-b-xl shadow-2xs">
                {card.badge}
              </div>
            </Link>
          ))}
        </div>

        {/* 4. SBI Card Instant Discount Pill (Exact Reference Screenshot UI) */}
        <div className="relative flex items-center justify-center pt-0.5">
          {/* Subtle Horizontal Side Lines (Left and Right) */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col gap-[3px] pointer-events-none px-1 opacity-25">
            <div className="w-full h-[1px] bg-slate-400" />
            <div className="w-full h-[1px] bg-slate-400" />
          </div>

          {/* Center Ultra-Compact White Pill Container (Sharp Corners) */}
          <div className="relative z-10 w-[68%] sm:w-[56%] max-w-[320px] rounded-lg bg-white px-2 sm:px-2.5 py-1 sm:py-1.5 shadow-xs border border-white/90 flex items-center justify-between gap-1.5 mx-auto">
            {/* SBI Card Logo (Authentic Keyhole Logo + SBI card text) */}
            <div className="flex items-center gap-1 shrink-0">
              {/* SBI Blue Keyhole Icon */}
              <div className="relative flex h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full bg-[#00A3E0] shadow-2xs">
                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-white flex flex-col items-center justify-end">
                  <div className="h-0.8 sm:h-1 w-[1px] bg-[#00A3E0]" />
                </div>
              </div>
              {/* Logo Text: "SBI card" */}
              <div className="flex items-baseline font-black text-[11px] sm:text-xs tracking-tight">
                <span className="text-[#1E293B] font-extrabold">SBI</span>
                <span className="text-[#00A3E0] font-bold ml-0.5">card</span>
              </div>
            </div>

            {/* Thin Vertical Divider */}
            <div className="h-5 sm:h-6 w-[1px] bg-slate-200 shrink-0" />

            {/* Offer Details Text */}
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <h4 className="text-[10px] sm:text-[11px] font-black text-slate-900 leading-tight">
                10% Instant Discount<span className="text-slate-600 font-semibold">*</span>
              </h4>
              <p className="text-[8.5px] sm:text-[9.5px] font-medium text-slate-500 truncate leading-tight mt-0.5">
                with SBI Credit Card (also valid on EMI Trxns.)
              </p>
            </div>

            {/* Vertical T&C Apply Text (Exact Reference UI) */}
            <div className="shrink-0 text-[6.5px] sm:text-[7.5px] font-bold text-slate-400 uppercase tracking-tighter [writing-mode:vertical-rl] rotate-180 leading-none select-none pl-0.5">
              *T&amp;C Apply
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
