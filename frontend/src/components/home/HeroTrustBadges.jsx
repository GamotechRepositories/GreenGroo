import React from "react";
import { Tractor, Leaf, QrCode, FlaskConical, Scale } from "lucide-react";

export const TRUST_FEATURES = [
  {
    id: "farmers",
    title: "Direct from Farmers",
    icon: Tractor,
  },
  {
    id: "organic",
    title: "100% Organic",
    icon: Leaf,
  },
  {
    id: "traceability",
    title: "Full Traceability",
    icon: QrCode,
  },
  {
    id: "lab-tested",
    title: "Lab Tested",
    icon: FlaskConical,
  },
  {
    id: "fair-price",
    title: "Fair Price",
    icon: Scale,
  },
];

export default function HeroTrustBadges({ features = TRUST_FEATURES }) {
  return (
    <section className="w-full bg-white border-y border-neutral-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex sm:grid sm:grid-cols-5 divide-x divide-neutral-200/90 overflow-x-auto no-scrollbar py-3.5 sm:py-4">
          {features.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.id}
                className="flex flex-col items-center justify-center text-center px-2.5 sm:px-3 flex-1 min-w-[125px] sm:min-w-0"
              >
                {/* Dark green circle icon */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#14532d] flex items-center justify-center text-white mb-2 sm:mb-2.5 shadow-sm shrink-0">
                  <IconComponent className="w-5 h-5 sm:w-5 sm:h-5 stroke-[2]" />
                </div>

                {/* English Title only */}
                <h3 className="text-xs sm:text-[13px] md:text-sm font-bold text-neutral-900 sm:text-[#14532d] leading-snug line-clamp-1">
                  {item.title}
                </h3>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
