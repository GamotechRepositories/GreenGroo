import React from "react";
import {
  Sprout,
  Building2,
  ShieldCheck,
  PackageCheck,
  Warehouse,
  Truck,
} from "lucide-react";

export const JOURNEY_STEPS = [
  {
    step: 1,
    id: "farm",
    line1: "Farm",
    line2: "",
    desktopDetail: "Harvested",
    icon: Sprout,
  },
  {
    step: 2,
    id: "collection-center",
    line1: "Collection",
    line2: "Center",
    desktopDetail: "Aggregated",
    icon: Building2,
  },
  {
    step: 3,
    id: "quality-check",
    line1: "Quality",
    line2: "Check",
    desktopDetail: "Lab Tested",
    icon: ShieldCheck,
  },
  {
    step: 4,
    id: "packaging",
    line1: "Eco",
    line2: "Packaging",
    desktopDetail: "Safe Sealed",
    icon: PackageCheck,
  },
  {
    step: 5,
    id: "delivery-hub",
    line1: "Delivery",
    line2: "Hub",
    desktopDetail: "Cold Storage",
    icon: Warehouse,
  },
  {
    step: 6,
    id: "doorstep",
    line1: "Your",
    line2: "Doorstep",
    desktopDetail: "Fast Delivery",
    icon: Truck,
  },
];

export default function FarmToDoorstepJourney() {
  return (
    <section className="w-full bg-white py-3 sm:py-5 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        {/* Unboxed, Seamless Timeline Pipeline */}
        <div className="relative w-full pt-1 pb-2">
          {/* Connected Progress Rail Line */}
          <div
            className="absolute top-4 sm:top-5 left-[7%] right-[7%] h-[2px] bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-500 z-0 rounded-full"
            aria-hidden="true"
          />

          {/* 6 Step Nodes */}
          <div className="relative z-10 flex w-full items-start justify-between">
            {JOURNEY_STEPS.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className="flex flex-1 flex-col items-center justify-start text-center px-0.5 min-w-0"
                >
                  {/* Static Circular Step Node sitting on the rail */}
                  <div className="relative flex h-8 w-8 xs:h-9 xs:w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white border-2 border-[#15803d] text-[#15803d] shadow-sm mb-1.5 shrink-0">
                    <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 stroke-[2.2]" />

                    {/* Step Number Badge */}
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-[#14532d] text-[8px] sm:text-[9px] font-black text-white ring-2 ring-white">
                      {step.step}
                    </span>
                  </div>

                  {/* Step Title (2 lines on mobile, clean line on desktop) */}
                  <h4 className="text-[8.5px] xs:text-[9.5px] sm:text-xs md:text-[12.5px] font-bold text-neutral-800 leading-[1.1] sm:leading-snug text-center tracking-tight">
                    <span className="block sm:inline">{step.line1}</span>
                    {step.line2 ? (
                      <span className="block sm:inline sm:ml-1">
                        {step.line2}
                      </span>
                    ) : null}
                  </h4>

                  {/* Desktop Subtitle Detail */}
                  <span className="hidden sm:block text-[10px] font-medium text-neutral-400 mt-0.5">
                    {step.desktopDetail}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
