import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const PAYMENT_OFFERS = [
  {
    id: "sbi",
    logoBg: "bg-[#00A3E0]",
    title: "SBI card",
    discount: "10% Instant Discount*",
    desc: "with SBI Credit Card & EMI Trxns",
    cardBg: "bg-[#E0F7FA]",
    borderColor: "border-cyan-200/80",
    tc: "*T&C Apply",
  },
  {
    id: "flipkart",
    logoBg: "bg-[#2874F0]",
    title: "Flipkart Axis",
    discount: "Get 10% Savings*",
    desc: "with Flipkart Axis Bank Credit Card",
    cardBg: "bg-[#FFF3E0]",
    borderColor: "border-orange-200/80",
    tc: "*T&C Apply",
  },
  {
    id: "hdfc",
    logoBg: "bg-[#004B8D]",
    title: "HDFC BANK",
    discount: "Flat ₹100 Cashback*",
    desc: "on HDFC Bank PayZapp & Cards",
    cardBg: "bg-[#F3E5F5]",
    borderColor: "border-purple-200/80",
    tc: "*T&C Apply",
  },
  {
    id: "paytm",
    logoBg: "bg-[#002E6E]",
    title: "Paytm UPI",
    discount: "Up to ₹75 Cashback*",
    desc: "on Paytm UPI transactions above ₹299",
    cardBg: "bg-[#E1F5FE]",
    borderColor: "border-sky-200/80",
    tc: "*T&C Apply",
  },
];

const PROMO_BANNERS = [
  {
    id: 1,
    title: "Gentle Summer Organic Care",
    subtitle: "Up to 30% Off",
    badge: "#1 Farmer Trusted Brand",
    tag: "FARM FRESH",
    link: "/product?categoryName=Organic",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&h=600&q=80",
    overlayBg: "from-emerald-950/70 via-slate-900/40 to-transparent",
  },
  {
    id: 2,
    title: "Nashik Co-op Direct Harvest",
    subtitle: "Flat 40% Off on Veggie Combos",
    badge: "100% ORGANIC HARVEST",
    tag: "DIRECT FARM",
    link: "/product?categoryName=Vegetables",
    image: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=1200&h=600&q=80",
    overlayBg: "from-slate-950/70 via-teal-950/40 to-transparent",
  },
  {
    id: 3,
    title: "Juicy Exotic Fruits Fest",
    subtitle: "Starting from ₹49",
    badge: "FRESHLY PICKED DAILY",
    tag: "EXOTIC FRUITS",
    link: "/product?categoryName=Fruits",
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&h=600&q=80",
    overlayBg: "from-amber-950/70 via-orange-950/40 to-transparent",
  },
];

export default function TopPaymentOffersSection() {
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % PROMO_BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const banner = PROMO_BANNERS[activeBanner];

  return (
    <section className="bg-white px-4 sm:px-6 py-4 lg:rounded-2xl lg:shadow-sm space-y-3.5">
      {/* 1. Section Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
          Top offers
        </h2>
      </div>

      {/* 2. Top Payment Offer Cards (Horizontal Scrollable Cards matching reference UI) */}
      <div className="flex gap-2.5 sm:gap-3.5 overflow-x-auto hide-scrollbar pb-1">
        {PAYMENT_OFFERS.map((offer) => (
          <div
            key={offer.id}
            className={`w-[260px] sm:w-[310px] shrink-0 rounded-xl ${offer.cardBg} border ${offer.borderColor} p-2.5 sm:p-3 shadow-2xs flex items-center justify-between gap-2 transition hover:scale-[1.01]`}
          >
            {/* Logo area */}
            <div className="flex items-center gap-1.5 shrink-0">
              {offer.id === "sbi" ? (
                <div className="flex items-center gap-1">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00A3E0]">
                    <div className="h-2 w-2 rounded-full bg-white flex items-end justify-center">
                      <div className="h-1 w-[1.5px] bg-[#00A3E0]" />
                    </div>
                  </div>
                  <div className="flex items-baseline font-black text-xs sm:text-sm tracking-tight">
                    <span className="text-[#1E293B] font-extrabold">SBI</span>
                    <span className="text-[#00A3E0] font-bold ml-0.5">card</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${offer.logoBg} text-white font-black text-[9px]`}>
                    💳
                  </div>
                  <span className="font-black text-xs text-slate-900">{offer.title}</span>
                </div>
              )}
            </div>

            {/* Vertical Divider */}
            <div className="h-6 w-[1px] bg-slate-400/30 shrink-0" />

            {/* Offer details */}
            <div className="min-w-0 flex-1">
              <h4 className="text-[10.5px] sm:text-xs font-black text-slate-900 leading-tight truncate">
                {offer.discount}
              </h4>
              <p className="text-[8.5px] sm:text-[10px] font-medium text-slate-600 truncate leading-tight mt-0.5">
                {offer.desc}
              </p>
            </div>

            {/* Vertical T&C Text */}
            <div className="shrink-0 text-[6.5px] sm:text-[7.5px] font-bold text-slate-500 uppercase tracking-tighter [writing-mode:vertical-rl] rotate-180 leading-none select-none pl-0.5">
              {offer.tc}
            </div>
          </div>
        ))}
      </div>

      {/* 3. Large Promo Feature Banner with AD badge and dots (Matching reference photo) */}
      <div className="relative">
        <Link
          to={banner.link}
          className="relative block w-full overflow-hidden rounded-2xl sm:rounded-3xl min-h-[160px] sm:min-h-[220px] shadow-sm border border-slate-200/80 group cursor-pointer"
        >
          {/* Background Banner Image */}
          <img
            src={banner.image}
            alt={banner.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-r ${banner.overlayBg}`} />

          {/* Banner Content */}
          <div className="relative z-10 p-4 sm:p-7 h-full min-h-[160px] sm:min-h-[220px] flex flex-col justify-between text-white max-w-lg">
            <div>
              <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[9px] sm:text-xs font-black backdrop-blur-xs uppercase tracking-wider mb-2">
                {banner.tag}
              </span>
              <h3 className="text-base sm:text-2xl font-black leading-tight drop-shadow-xs">
                {banner.title}
              </h3>
              <p className="mt-1 text-sm sm:text-lg font-bold text-amber-300 drop-shadow-xs">
                {banner.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-medium text-slate-200 opacity-90">
                {banner.badge}
              </span>
            </div>
          </div>

        </Link>

        {/* Carousel Slider Dot Indicators */}
        <div className="mt-2.5 flex justify-center items-center gap-1.5">
          {PROMO_BANNERS.map((b, idx) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setActiveBanner(idx)}
              className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                idx === activeBanner ? "w-6 bg-slate-900" : "w-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
