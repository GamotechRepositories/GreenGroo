import React from "react";
import { Tractor, Leaf, QrCode, FlaskConical, Scale } from "lucide-react";

export const TRUST_FEATURES = [
  {
    id: "farmers",
    line1: "Direct from",
    line2: "Farmers",
    subtitle: "0 Middlemen",
    icon: Tractor,
  },
  {
    id: "organic",
    line1: "100%",
    line2: "Organic",
    subtitle: "Pure & Natural",
    icon: Leaf,
  },
  {
    id: "traceability",
    line1: "Full",
    line2: "Traceability",
    subtitle: "Farm to Door",
    icon: QrCode,
  },
  {
    id: "lab-tested",
    line1: "Lab",
    line2: "Tested",
    subtitle: "Safety Certified",
    icon: FlaskConical,
  },
  {
    id: "fair-price",
    line1: "Fair",
    line2: "Price",
    subtitle: "Ethical Rates",
    icon: Scale,
  },
];

export default function HeroTrustBadges({ features = TRUST_FEATURES }) {
  return (
    <section className="w-full bg-white overflow-hidden py-2 sm:py-3 select-none">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="grid grid-cols-5 py-1 w-full">
          {features.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.id}
                className="flex flex-col items-center justify-center text-center px-1 sm:px-3 min-w-0"
              >
                {/* Clean squircle badge without hover effect */}
                <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/70 border border-emerald-200/60 flex items-center justify-center text-[#15803d] shadow-[0_1px_2px_rgba(20,83,45,0.05)] mb-1.5 sm:mb-2 shrink-0">
                  <IconComponent className="w-4 h-4 xs:w-4.5 xs:h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
                </div>

                {/* English Title: 2 stacked clean lines on mobile, single line on desktop */}
                <h3 className="text-[9px] xs:text-[10px] sm:text-xs md:text-[13px] font-bold text-neutral-800 leading-[1.15] sm:leading-snug tracking-tight">
                  <span className="block sm:inline">{item.line1}</span>
                  {item.line2 ? (
                    <span className="block sm:inline sm:ml-1">{item.line2}</span>
                  ) : null}
                </h3>

                {/* Subtle desktop subtext */}
                <span className="hidden sm:block text-[10.5px] font-medium text-neutral-400 mt-0.5 tracking-tight">
                  {item.subtitle}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
