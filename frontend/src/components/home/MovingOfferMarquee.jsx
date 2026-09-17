import { Link } from "react-router-dom";
import { Sparkles, Leaf, Zap, CreditCard } from "lucide-react";

const TICKER_OFFERS = [
  {
    icon: Sparkles,
    badge: "SPECIAL",
    badgeBg: "bg-gray-100 text-gray-700",
    iconColor: "text-amber-500",
    text: "FLAT 50% OFF on First 3 Orders",
    code: "USE: FRESH50",
    link: "/coupons",
  },
  {
    icon: Leaf,
    badge: "FARMERS",
    badgeBg: "bg-gray-100 text-gray-700",
    iconColor: "text-emerald-600",
    text: "Nashik Farmers Co-op Harvest",
    code: "100% ORGANIC",
    link: "/product?categoryName=Organic",
  },
  {
    icon: Zap,
    badge: "EXPRESS",
    badgeBg: "bg-gray-100 text-gray-700",
    iconColor: "text-blue-500",
    text: "FREE 10-Min Delivery on ₹99+",
    code: "NO CODE",
    link: "/product",
  },
  {
    icon: CreditCard,
    badge: "BANK DEAL",
    badgeBg: "bg-gray-100 text-gray-700",
    iconColor: "text-indigo-600",
    text: "10% Instant Discount on SBI Cards",
    code: "SAVE UP TO ₹100",
    link: "/coupons",
  },
];

export default function MovingOfferMarquee() {
  return (
    <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl py-2 shadow-sm border-y border-gray-100">
      <style>{`
        @keyframes offerMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-offer-marquee {
          display: flex;
          width: max-content;
          animation: offerMarquee 30s linear infinite;
        }
        .animate-offer-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="animate-offer-marquee flex items-center gap-6">
        {[...TICKER_OFFERS, ...TICKER_OFFERS].map((offer, index) => {
          const IconComponent = offer.icon;
          return (
            <Link
              key={`${offer.badge}-${index}`}
              to={offer.link || "/coupons"}
              className="flex items-center gap-2.5 shrink-0 px-2 py-1 transition-transform cursor-pointer hover:scale-[1.02]"
            >
              <div className="flex items-center justify-center bg-gray-50 rounded-full h-7 w-7 border border-gray-100">
                <IconComponent className={`h-3.5 w-3.5 ${offer.iconColor}`} strokeWidth={2.5} />
              </div>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${offer.badgeBg}`}>
                {offer.badge}
              </span>
              <span className="text-[13px] font-semibold text-gray-700 whitespace-nowrap">
                {offer.text}
              </span>
              <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white whitespace-nowrap">
                {offer.code}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
