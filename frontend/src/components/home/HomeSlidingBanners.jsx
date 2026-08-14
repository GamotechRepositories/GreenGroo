import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resolveStoreTheme } from "../grocery/homeHeaderThemes";

const SLIDING_BANNERS = [
  {
    id: "banner-1",
    tag: "🥦 FRESH VEGETABLES",
    title: "Farm-Fresh Veggies Sale",
    offer: "UP TO 40% OFF",
    subtitle: "Onions, Potatoes, Tomatoes & Daily Green Bhaji",
    badge: "⚡ Free Express 10-Min Delivery",
    bgGradient: "from-emerald-950 via-green-900 to-teal-950",
    accentBadge: "bg-emerald-500 text-white",
    buttonText: "Shop Veggies",
    link: "/?categoryName=Vegetables",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&h=400&q=80",
  },
  {
    id: "banner-2",
    tag: "🍎 FRESH FRUITS FESTIVAL",
    title: "Juicy & Sweet Fruits Sale",
    offer: "FLAT 30% OFF",
    subtitle: "Apples, Bananas, Mangoes, Pomegranates & Oranges",
    badge: "💳 Extra 10% Off on UPI Payments",
    bgGradient: "from-rose-950 via-red-900 to-amber-950",
    accentBadge: "bg-rose-500 text-white",
    buttonText: "Shop Fruits",
    link: "/?categoryName=Fruits",
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&h=400&q=80",
  },
  {
    id: "banner-3",
    tag: "🧅 READY 2 COOK",
    title: "Pre-Washed & Chopped Veggies",
    offer: "FLAT ₹50 OFF",
    subtitle: "Cleaned Bhaji Mix, Chopped Onions & Peeled Garlic",
    badge: "⏱️ Save 30 Mins Daily Kitchen Prep Time",
    bgGradient: "from-orange-950 via-amber-900 to-yellow-950",
    accentBadge: "bg-orange-500 text-white",
    buttonText: "Order Cut Veggies",
    link: "/?store=festive",
    image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cf?auto=format&fit=crop&w=600&h=400&q=80",
  },
  {
    id: "banner-4",
    tag: "🌿 100% ORGANIC",
    title: "Traceable Nashik Farm Harvest",
    offer: "FLAT 25% OFF",
    subtitle: "Directly from Verified Farmers | Chemical-Free",
    badge: "👨‍🌾 Trace Your Farmer & Harvest Date",
    bgGradient: "from-teal-950 via-emerald-900 to-slate-950",
    accentBadge: "bg-teal-500 text-white",
    buttonText: "Shop Organic",
    link: "/?categoryName=Organic",
    image: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=600&h=400&q=80",
  },
  {
    id: "banner-5",
    tag: "📦 SUPER SAVER COMBOS",
    title: "Weekly Kitchen Combo Packs",
    offer: "SAVE UP TO ₹150",
    subtitle: "Essential Veggie Combo + Fruit Salad Mix",
    badge: "🏷️ Best Price Guaranteed",
    bgGradient: "from-purple-950 via-indigo-900 to-slate-900",
    accentBadge: "bg-purple-500 text-white",
    buttonText: "Explore Combos",
    link: "/?categoryName=Vegetables",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&h=400&q=80",
  },
];

export default function HomeSlidingBanners() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchParams] = useSearchParams();
  const currentStore = searchParams.get("store")?.trim()?.toLowerCase() || "main";
  const theme = resolveStoreTheme(currentStore);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Auto slide every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDING_BANNERS.length);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 40) {
      setCurrentIndex((prev) => (prev + 1) % SLIDING_BANNERS.length);
    } else if (diff < -40) {
      setCurrentIndex((prev) => (prev - 1 + SLIDING_BANNERS.length) % SLIDING_BANNERS.length);
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const banner = SLIDING_BANNERS[currentIndex];

  return (
    <section className="bg-white px-4 sm:px-6 py-2">
      {/* Main Full-Width Sliding Card with Uniform Compact Height */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-3 sm:p-4 bg-gradient-to-r ${banner.bgGradient} text-white shadow-sm transition-all duration-500 ease-in-out h-[135px] sm:h-[160px] flex items-center justify-between`}
      >
        {/* Top Category Tag */}
        <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-10">
          <span className={`text-[8.5px] sm:text-xs font-black px-2 py-0.5 sm:py-1 rounded-full uppercase tracking-wider ${banner.accentBadge} shadow-xs`}>
            {banner.tag}
          </span>
        </div>

        {/* Left Info Column */}
        <div className="relative z-10 max-w-[62%] sm:max-w-[60%] flex flex-col justify-between h-full py-0.5">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block rounded-md bg-amber-400 px-1.5 py-0.5 text-[9px] sm:text-[11px] font-black text-slate-950 uppercase shadow-xs">
                {banner.offer}
              </span>
            </div>
            <h2 className="text-sm sm:text-lg font-black tracking-tight leading-tight mt-1 line-clamp-1">
              {banner.title}
            </h2>
            <p className="text-[10.5px] sm:text-xs font-medium text-slate-200 mt-0.5 line-clamp-1">
              {banner.subtitle}
            </p>
          </div>

          {/* Bottom Card Offer Pill + Button */}
          <div className="pt-1 flex items-center gap-2">
            <Link
              to={banner.link}
              className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-1 text-[11px] sm:text-xs font-black text-slate-900 shadow-xs transition hover:bg-slate-100 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            >
              {banner.buttonText}
            </Link>

            <div className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-white/10 backdrop-blur-md px-2 py-1 border border-white/20 text-[10px] sm:text-xs font-extrabold text-amber-300">
              <span className="line-clamp-1">{banner.badge}</span>
            </div>
          </div>
        </div>

        {/* Right Promo Image */}
        <div className="relative w-[34%] sm:w-[35%] h-[95px] sm:h-[125px] shrink-0 flex items-center justify-center">
          <img
            src={banner.image}
            alt={banner.title}
            className="h-full w-full object-cover rounded-xl sm:rounded-2xl shadow-sm border border-white/10"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      </div>

      {/* Pagination Indicator Dots Bar */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {SLIDING_BANNERS.map((item, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`transition-all duration-300 rounded-full ${
                isActive
                  ? "w-6 h-1.5 bg-slate-900"
                  : "w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
