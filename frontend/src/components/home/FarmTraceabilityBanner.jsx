import React from "react";

export default function FarmTraceabilityBanner({ className = "" }) {
  const pillars = [
    {
      id: "farmers",
      title: "Direct from Farmers",
      subtitle: "0 Middlemen",
      icon: (
        <svg
          className="w-6 h-6 sm:w-8 sm:h-8 text-[#0a6c38]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="7" cy="16" r="4" strokeWidth="2.2" />
          <circle cx="7" cy="16" r="1.5" fill="currentColor" />
          <circle cx="18" cy="17" r="2.5" strokeWidth="2.2" />
          <circle cx="18" cy="17" r="1" fill="currentColor" />
          <path d="M7 12h5l3 2h3.5a1.5 1.5 0 0 1 1.5 1.5V17M11 12V7h-4v5" />
          <path d="M16 11V8m1 0h-2" strokeWidth="2" />
          <path d="M12 9l2 2" strokeWidth="2" />
        </svg>
      ),
    },
    {
      id: "organic",
      title: "100% Organic",
      subtitle: "Pure & Natural",
      icon: (
        <svg
          className="w-6 h-6 sm:w-8 sm:h-8 text-[#0a6c38]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M21 3C21 3 13 3 8 8C4.5 11.5 4 17 4 17C4 17 9.5 16.5 13 13C18 8 21 3 21 3Z" />
          <path
            d="M8 16L14 10"
            stroke="#e8f7ee"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      id: "traceability",
      title: "Full Traceability",
      subtitle: "Farm to Door",
      icon: (
        <svg
          className="w-5 h-5 sm:w-7 sm:h-7 text-[#0a6c38]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M3 3h7v7H3V3zm2 2v3h3V5H5z" />
          <path d="M14 3h7v7h-7V3zm2 2v3h3V5h-3z" />
          <path d="M3 14h7v7H3v-7zm2 2v3h3v-3H5z" />
          <rect x="11.5" y="4" width="2" height="2" />
          <rect x="11.5" y="8" width="2" height="2" />
          <rect x="4" y="11.5" width="2" height="2" />
          <rect x="8" y="11.5" width="2" height="2" />
          <rect x="11.5" y="11.5" width="2" height="2" />
          <rect x="15" y="11.5" width="2" height="2" />
          <rect x="18.5" y="11.5" width="2" height="2" />
          <rect x="11.5" y="15" width="2" height="2" />
          <rect x="15" y="15" width="2" height="2" />
          <rect x="18.5" y="15" width="2" height="2" />
          <rect x="15" y="18.5" width="2" height="2" />
          <rect x="18.5" y="18.5" width="2" height="2" />
        </svg>
      ),
    },
    {
      id: "tested",
      title: "Lab Tested",
      subtitle: "Safety Certified",
      icon: (
        <svg
          className="w-6 h-6 sm:w-8 sm:h-8 text-[#0a6c38]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 2v5.5L4.5 19a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 7.5V2" />
          <path d="M8.5 2h7" />
          <path d="M6.5 15h11" strokeWidth="1.8" />
        </svg>
      ),
    },
    {
      id: "fairprice",
      title: "Fair Price",
      subtitle: "Ethical Rates",
      icon: (
        <svg
          className="w-6 h-6 sm:w-8 sm:h-8 text-[#0a6c38]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v18M8 21h8" strokeWidth="2.2" />
          <path d="M4 6h16" strokeWidth="2.2" />
          <path d="M4 6l-2.5 6h5L4 6z" />
          <path d="M1.5 12a2.5 2.5 0 0 0 5 0" />
          <path d="M20 6l-2.5 6h5L20 6z" />
          <path d="M17.5 12a2.5 2.5 0 0 0 5 0" />
        </svg>
      ),
    },
  ];

  const steps = [
    {
      step: 1,
      title: "Farm",
      subtitle: "Harvested",
      icon: (
        <svg
          className="w-5 h-5 sm:w-7 sm:h-7 text-[#0a6c38]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 21V11" strokeWidth="2.2" />
          <path
            d="M12 11c0-4 3.5-7 8-7c0 4.5-3 8-8 7z"
            fill="#0a6c38"
            fillOpacity="0.2"
          />
          <path
            d="M12 13c0-3.5-3-6-7-6c0 4 2.5 7 7 6z"
            fill="#0a6c38"
            fillOpacity="0.2"
          />
          <path d="M8 21h8" strokeWidth="2.5" />
        </svg>
      ),
    },
    {
      step: 2,
      title: "Collection Center",
      subtitle: "Aggregated",
      icon: (
        <svg
          className="w-5 h-5 sm:w-7 sm:h-7 text-[#0a6c38]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 10l9-6l9 6v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z" />
          <path d="M10 21v-6h4v6" />
          <rect x="6" y="11" width="2.5" height="2.5" />
          <rect x="15.5" y="11" width="2.5" height="2.5" />
        </svg>
      ),
    },
    {
      step: 3,
      title: "Quality Check",
      subtitle: "Lab Tested",
      icon: (
        <svg
          className="w-5 h-5 sm:w-7 sm:h-7 text-[#0a6c38]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3l-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12l2 2l4-4" strokeWidth="2.6" />
        </svg>
      ),
    },
    {
      step: 4,
      title: "Eco Packaging",
      subtitle: "Safe Sealed",
      icon: (
        <svg
          className="w-5 h-5 sm:w-7 sm:h-7 text-[#0a6c38]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      ),
    },
    {
      step: 5,
      title: "Delivery Hub",
      subtitle: "Cold Storage",
      icon: (
        <svg
          className="w-5 h-5 sm:w-7 sm:h-7 text-[#0a6c38]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-6l9 6v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z" />
          <rect x="7" y="12" width="10" height="9" rx="0.5" />
          <path d="M7 15h10M7 18h10" />
        </svg>
      ),
    },
    {
      step: 6,
      title: "Your Doorstep",
      subtitle: "Fast Delivery",
      icon: (
        <svg
          className="w-5 h-5 sm:w-7 sm:h-7 text-[#0a6c38]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 6h12v11H2z" fill="#0a6c38" fillOpacity="0.1" />
          <path d="M14 9h4.5l2.5 3.5V17H14" />
          <path d="M2 17h3m6 0h4m5 0h2" />
          <circle cx="7" cy="17" r="2" fill="currentColor" />
          <circle cx="17" cy="17" r="2" fill="currentColor" />
        </svg>
      ),
    },
  ];

  // Quadruple steps array for truly continuous, seamless infinite loop across all screens
  const loopedSteps = [...steps, ...steps, ...steps, ...steps];

  return (
    <>
      <style>{`
        @keyframes farmContinuousJourney {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .animate-farm-continuous-journey {
          display: flex;
          align-items: flex-start;
          width: max-content;
          animation: farmContinuousJourney 20s linear infinite;
          will-change: transform;
        }
      `}</style>

      {/* =========================================================================
          1. DESKTOP VIEW: EXACT ORIGINAL DESIGN PRESERVED (NO CHANGES FOR DESKTOP)
         ========================================================================= */}
      <div
        className={`hidden md:block w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-white py-5 sm:py-6 lg:py-7 my-3 sm:my-5 border-y border-emerald-100/70 overflow-hidden select-none ${className}`}
      >
        {/* Decorative Left Foliage (Desktop) */}
        <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-36 lg:w-48 pointer-events-none z-0 overflow-hidden">
          <svg
            viewBox="0 0 160 200"
            fill="none"
            className="w-full h-full"
            preserveAspectRatio="xMinYMid meet"
          >
            <defs>
              <linearGradient id="leafG1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
              <linearGradient id="leafG2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#166534" />
              </linearGradient>
              <linearGradient id="mistL" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 0 C90 40, 100 160, 0 200 Z" fill="url(#mistL)" />
            <path
              d="M-10 100 C30 95, 60 70, 80 25"
              stroke="#15803d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M20 20 C45 5, 80 25, 75 55 C50 50, 25 35, 20 20 Z"
              fill="url(#leafG1)"
            />
            <path
              d="M20 20 Q48 35 75 55"
              stroke="#166534"
              strokeWidth="1.2"
              opacity="0.6"
            />
            <path
              d="M0 65 C35 50, 85 75, 70 115 C40 105, 10 90, 0 65 Z"
              fill="url(#leafG2)"
            />
            <path
              d="M0 65 Q40 85 70 115"
              stroke="#166534"
              strokeWidth="1.2"
              opacity="0.6"
            />
            <path
              d="M-10 135 C25 115, 65 135, 55 175 C25 165, 5 150, -10 135 Z"
              fill="url(#leafG1)"
            />
            <path
              d="M-10 135 Q25 145 55 175"
              stroke="#166534"
              strokeWidth="1.2"
              opacity="0.6"
            />
            <path
              d="M50 45 C75 35, 95 50, 85 70 C70 65, 55 58, 50 45 Z"
              fill="url(#leafG2)"
              opacity="0.9"
            />
          </svg>
        </div>

        {/* Decorative Right Foliage (Desktop) */}
        <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-36 lg:w-48 pointer-events-none z-0 overflow-hidden transform scale-x-[-1]">
          <svg
            viewBox="0 0 160 200"
            fill="none"
            className="w-full h-full"
            preserveAspectRatio="xMinYMid meet"
          >
            <defs>
              <linearGradient id="leafG1R" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
              <linearGradient id="leafG2R" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#166534" />
              </linearGradient>
              <linearGradient id="mistR" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#bbf7d0" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 0 C90 40, 100 160, 0 200 Z" fill="url(#mistR)" />
            <path
              d="M-10 100 C30 95, 60 70, 80 25"
              stroke="#15803d"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M20 20 C45 5, 80 25, 75 55 C50 50, 25 35, 20 20 Z"
              fill="url(#leafG1R)"
            />
            <path
              d="M20 20 Q48 35 75 55"
              stroke="#166534"
              strokeWidth="1.2"
              opacity="0.6"
            />
            <path
              d="M0 65 C35 50, 85 75, 70 115 C40 105, 10 90, 0 65 Z"
              fill="url(#leafG2R)"
            />
            <path
              d="M0 65 Q40 85 70 115"
              stroke="#166534"
              strokeWidth="1.2"
              opacity="0.6"
            />
            <path
              d="M-10 135 C25 115, 65 135, 55 175 C25 165, 5 150, -10 135 Z"
              fill="url(#leafG1R)"
            />
            <path
              d="M-10 135 Q25 145 55 175"
              stroke="#166534"
              strokeWidth="1.2"
              opacity="0.6"
            />
            <path
              d="M50 45 C75 35, 95 50, 85 70 C70 65, 55 58, 50 45 Z"
              fill="url(#leafG2R)"
              opacity="0.9"
            />
          </svg>
        </div>

        {/* Content Container (Desktop) */}
        <div className="relative z-10 w-full px-8 lg:px-14 xl:px-20">
          {/* Tier 1: 5 Value Pillars */}
          <div className="w-full pb-4 mb-4 sm:mb-5 border-b border-emerald-100/90">
            <div className="grid grid-cols-5 items-center w-full">
              {pillars.map((pillar, idx) => (
                <div
                  key={pillar.id}
                  className={`relative flex flex-col items-center text-center px-1 py-1 ${
                    idx < pillars.length - 1 ? "border-r border-emerald-200/70" : ""
                  }`}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#e8f7ee] flex items-center justify-center mb-1.5 shadow-2xs">
                    {pillar.icon}
                  </div>
                  <h4 className="text-xs sm:text-[14px] lg:text-[15px] font-bold text-[#0a351d] tracking-tight leading-snug whitespace-nowrap">
                    {pillar.title}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5 whitespace-nowrap">
                    {pillar.subtitle}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tier 2: 6-Step Connected Stepper */}
          <div className="w-full pt-1">
            <div className="flex items-start justify-between w-full">
              {steps.map((stepItem, idx) => (
                <React.Fragment key={stepItem.step}>
                  <div className="flex-shrink-0 w-24 sm:w-28 flex flex-col items-center text-center relative px-0.5">
                    <div className="relative mb-1.5">
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#075e34] text-white text-[10px] font-black flex items-center justify-center shadow-xs border-[1.5px] border-white z-20">
                        {stepItem.step}
                      </span>
                      <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 border-[#00a859] bg-white flex items-center justify-center shadow-xs">
                        {stepItem.icon}
                      </div>
                    </div>
                    <h5 className="text-[11px] sm:text-xs lg:text-[13.5px] font-bold text-[#0a351d] tracking-tight leading-snug whitespace-nowrap">
                      {stepItem.title}
                    </h5>
                    <p className="text-[9.5px] sm:text-[11px] text-gray-500 font-medium mt-0.5 whitespace-nowrap">
                      {stepItem.subtitle}
                    </p>
                  </div>

                  {idx < steps.length - 1 && (
                    <div className="flex-1 flex items-center justify-center relative mt-5 sm:mt-6 -mx-1">
                      <div className="w-full h-[2px] bg-[#00a859] relative flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full border border-[#00a859] bg-white flex items-center justify-center shadow-2xs z-10">
                          <svg
                            className="w-2.5 h-2.5 text-[#00a859]"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m9 18l6-6l-6-6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}

              <div className="flex items-center justify-center self-center mt-[-10px] pl-1 text-[#00a859] flex-shrink-0">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18l6-6l-6-6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. MOBILE VIEW: NO BG CARD + CONTINUOUSLY SCROLLING RUNNING CAROUSEL
         ========================================================================= */}
      <section className="block md:hidden px-2.5 py-3 my-1 select-none space-y-4">
        {/* ROW 1: 5 Pillars directly on clean background (NO BG CARD/BOX) */}
        <div className="w-full overflow-x-auto no-scrollbar py-1">
          <div className="grid grid-cols-5 min-w-[340px] items-stretch divide-x divide-emerald-100/80">
            {pillars.map((pillar) => (
              <div
                key={pillar.id}
                className="flex flex-col items-center text-center px-1 py-0.5"
              >
                {/* Mint Circle Container */}
                <div className="w-11 h-11 rounded-full bg-[#dcf4e4] flex items-center justify-center mb-1.5 shadow-2xs">
                  {pillar.icon}
                </div>
                {/* Title */}
                <h4 className="text-[10px] sm:text-[11px] font-bold text-[#0a351d] tracking-tight leading-tight line-clamp-2">
                  {pillar.title}
                </h4>
                {/* Subtitle */}
                <p className="text-[8.5px] sm:text-[9.5px] text-gray-500 font-medium mt-0.5 whitespace-nowrap">
                  {pillar.subtitle}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 2: PROPER CONTINUOUSLY SCROLLING RUNNING CAROUSEL (NO BG CARD) */}
        <div className="relative w-full overflow-hidden py-1">
          {/* Subtle Left and Right edge fade masks for seamless infinite effect */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10" />

          {/* Infinite Smooth Continuous Running Marquee */}
          <div className="animate-farm-continuous-journey">
            {loopedSteps.map((stepItem, idx) => (
              <div key={`${stepItem.step}-${idx}`} className="flex items-start shrink-0">
                {/* Step Node */}
                <div className="w-[84px] flex flex-col items-center text-center relative px-0.5 shrink-0">
                  <div className="relative mb-2">
                    {/* Step Number Badge */}
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#075e34] text-white text-[10px] font-black flex items-center justify-center shadow-xs border-2 border-white z-10">
                      {stepItem.step}
                    </span>

                    {/* Node Circle */}
                    <div className="w-[52px] h-[52px] rounded-full border-2 border-[#00a859] bg-white flex items-center justify-center shadow-xs">
                      {stepItem.icon}
                    </div>
                  </div>

                  {/* Step Title */}
                  <h5 className="text-[11.5px] font-bold text-[#0a351d] tracking-tight leading-tight">
                    {stepItem.title}
                  </h5>

                  {/* Step Subtitle */}
                  <p className="text-[10px] text-[#5e718d] font-medium mt-0.5 whitespace-nowrap">
                    {stepItem.subtitle}
                  </p>
                </div>

                {/* Connecting Solid Green Line with Chevron Badge linking to next step */}
                <div className="w-8 sm:w-10 flex items-center justify-center relative mt-[26px] -mx-0.5 shrink-0">
                  <div className="w-full h-[2px] bg-[#00a859] relative flex items-center justify-center">
                    <div className="w-4.5 h-4.5 rounded-full border-[1.5px] border-[#00a859] bg-white flex items-center justify-center shadow-2xs z-10">
                      <svg
                        className="w-2.5 h-2.5 text-[#00a859]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18l6-6l-6-6" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
