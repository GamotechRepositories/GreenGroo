import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Leaf, Zap, CreditCard } from "lucide-react";

export const STRIP_OFFERS = [
  {
    id: "welcome50",
    icon: Sparkles,
    highlight: "Flat 50% Off",
    description: "on your first 3 orders",
    code: "CODE: FRESH50",
    link: "/coupons",
  },
  {
    id: "organic-coop",
    icon: Leaf,
    highlight: "100% Certified Organic",
    description: "direct from Nashik farmers co-op",
    code: "FARM FRESH",
    link: "/product?categoryName=Organic",
  },
  {
    id: "express-free",
    icon: Zap,
    highlight: "Free 10-Min Delivery",
    description: "on all orders above ₹99",
    code: "NO CODE",
    link: "/product",
  },
  {
    id: "sbi-bank",
    icon: CreditCard,
    highlight: "10% Instant Discount",
    description: "with SBI Cards up to ₹100",
    code: "AUTO-APPLY",
    link: "/coupons",
  },
];

export default function MovingOfferMarquee() {
  // Quadruple the array to ensure perfectly seamless, infinite continuous flow across any screen width
  const loopedOffers = [
    ...STRIP_OFFERS,
    ...STRIP_OFFERS,
    ...STRIP_OFFERS,
    ...STRIP_OFFERS,
  ];

  return (
    <section className="relative w-full overflow-hidden bg-[#f4f9f4] border-y border-[#dbeef0]/80 py-2 sm:py-2.5 select-none">
      <style>{`
        @keyframes continuousStripFlow {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .animate-continuous-strip {
          display: flex;
          align-items: center;
          width: max-content;
          animation: continuousStripFlow 36s linear infinite;
          will-change: transform;
        }
        .animate-continuous-strip:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Infinite Continuous Flowing Ribbon (No Boxed Cards) */}
      <div className="animate-continuous-strip">
        {loopedOffers.map((offer, index) => {
          const Icon = offer.icon;

          return (
            <React.Fragment key={`${offer.id}-${index}`}>
              <Link
                to={offer.link}
                className="inline-flex items-center gap-2 px-2 py-0.5 text-neutral-900 hover:text-[#14532d] transition-colors cursor-pointer shrink-0"
              >
                {/* Micro Icon */}
                <span className="flex h-5 w-5 sm:h-5.5 sm:w-5.5 items-center justify-center rounded-full bg-[#15803d]/12 text-[#15803d] shrink-0">
                  <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[2.4]" />
                </span>

                {/* Bold Highlight */}
                <span className="text-[11.5px] sm:text-[13px] font-bold text-neutral-900 tracking-tight whitespace-nowrap">
                  {offer.highlight}
                </span>

                {/* Subtle Description */}
                <span className="text-[11px] sm:text-[12.5px] font-medium text-neutral-600 whitespace-nowrap">
                  {offer.description}
                </span>

                {/* Clean Code Pill Tag */}
                <span className="ml-1 inline-flex items-center rounded-full bg-[#14532d] px-2 py-0.5 text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-wider text-white whitespace-nowrap shadow-xs">
                  {offer.code}
                </span>
              </Link>

              {/* Clean separator bullet between items */}
              <span
                className="mx-4 sm:mx-6 text-[#15803d]/35 font-bold select-none text-xs sm:text-sm shrink-0"
                aria-hidden="true"
              >
                •
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}
