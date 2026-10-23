import React from "react";

/**
 * FarmerGrowthBanner (शेतकऱ्यांसोबत वाढणारा भारत)
 * Positioned directly below the Dairy section and above 'App मध्ये खास वैशिष्ट्ये'
 * Features:
 * - 5000+ शेतकरी जोडलेले (Farmer icon)
 * - 200+ गावे (Village icon)
 * - 10,000+ ग्राहक कुटुंबे (Shield icon)
 * - शेतकऱ्यांसोबत वाढणारा भारत (Leaf icons)
 */
export default function FarmerGrowthBanner({ className = "" }) {
  return (
    <section className={`w-full py-2.5 sm:py-3.5 my-2 sm:my-3 ${className}`}>
      {/* Outer Banner Card with Deep Forest Green Background */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#033418] via-[#064e29] to-[#033418] text-white shadow-md border border-emerald-900/60 px-3 py-3 sm:px-5 sm:py-3.5">
        
        {/* Subtle Decorative Leaves on Left (Desktop & Mobile) */}
        <div className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-85 select-none">
          <svg
            className="w-8 h-8 sm:w-11 sm:h-11 text-emerald-400 drop-shadow-sm"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 28C14 28 24 22 26 10C16 10 8 18 8 28Z"
              fill="currentColor"
              fillOpacity="0.85"
            />
            <path
              d="M14 26C18 20 26 16 32 14C28 22 22 26 14 26Z"
              fill="currentColor"
              fillOpacity="0.65"
            />
            <path
              d="M10 27C15 22 21 17 25 12"
              stroke="#042a13"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Subtle Decorative Leaves on Right (Desktop & Mobile) */}
        <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-85 select-none">
          <svg
            className="w-8 h-8 sm:w-11 sm:h-11 text-emerald-400 drop-shadow-sm transform scale-x-[-1]"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 28C14 28 24 22 26 10C16 10 8 18 8 28Z"
              fill="currentColor"
              fillOpacity="0.85"
            />
            <path
              d="M14 26C18 20 26 16 32 14C28 22 22 26 14 26Z"
              fill="currentColor"
              fillOpacity="0.65"
            />
            <path
              d="M10 27C15 22 21 17 25 12"
              stroke="#042a13"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* =========================================================
            DESKTOP LAYOUT (md: and up)
            Exact 1-Line Match of Image 1:
            Left: 3 Stats with Dividers | Right: शेतकऱ्यांसोबत वाढणारा भारत
            ========================================================= */}
        <div className="hidden md:flex items-center justify-between gap-4 relative z-10 pl-6 pr-6 lg:pl-8 lg:pr-8">
          {/* Left Stats Group */}
          <div className="flex items-center gap-4 lg:gap-6 shrink-0">
            {/* Stat 1: 5000+ शेतकरी जोडलेले */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-amber-300/30">
                {/* Farmer Hat Icon in Amber */}
                <svg
                  className="w-5 h-5 text-[#f3ba2f]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 11h20M7 11c0-2.8 2.2-4.8 5-4.8s5 2 5 4.8" />
                  <circle cx="12" cy="14" r="2.2" />
                  <path d="M6.5 21v-1.5a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4V21" />
                </svg>
              </div>
              <div className="leading-tight">
                <p className="text-base lg:text-lg font-black text-white tracking-tight">
                  5000+
                </p>
                <p className="text-[11px] lg:text-[12px] font-semibold text-[#fde047] whitespace-nowrap">
                  शेतकरी जोडलेले
                </p>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="h-8 w-[1px] bg-white/20 shrink-0" />

            {/* Stat 2: 200+ गावे */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-amber-300/30">
                {/* Village / House Icon in Amber */}
                <svg
                  className="w-5 h-5 text-[#f3ba2f]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5z" />
                  <path d="M9 21V12h6v9" />
                </svg>
              </div>
              <div className="leading-tight">
                <p className="text-base lg:text-lg font-black text-white tracking-tight">
                  200+
                </p>
                <p className="text-[11px] lg:text-[12px] font-semibold text-[#fde047] whitespace-nowrap">
                  गावे
                </p>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="h-8 w-[1px] bg-white/20 shrink-0" />

            {/* Stat 3: 10,000+ ग्राहक कुटुंबे */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-amber-300/30">
                {/* Shield Checkmark Icon in Amber */}
                <svg
                  className="w-5 h-5 text-[#f3ba2f]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="leading-tight">
                <p className="text-base lg:text-lg font-black text-white tracking-tight">
                  10,000+
                </p>
                <p className="text-[11px] lg:text-[12px] font-semibold text-[#fde047] whitespace-nowrap">
                  ग्राहक कुटुंबे
                </p>
              </div>
            </div>
          </div>

          {/* Right Tagline */}
          <div className="flex items-center gap-2 lg:gap-2.5 shrink-0">
            <span className="text-lg lg:text-xl text-emerald-300 animate-pulse">🌿</span>
            <span className="text-base lg:text-lg font-black text-white tracking-wide whitespace-nowrap">
              शेतकऱ्यांसोबत वाढणारा भारत
            </span>
            <span className="text-lg lg:text-xl text-emerald-300 animate-pulse">🌿</span>
          </div>
        </div>

        {/* =========================================================
            MOBILE LAYOUT (< md)
            Compact, perfectly readable, no text truncation:
            Top: Tagline with leaves
            Bottom: 3 columns with vertical dividers
            ========================================================= */}
        <div className="md:hidden space-y-2 relative z-10 px-2 sm:px-4 text-center">
          {/* Top Tagline */}
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="text-base text-emerald-300">🌿</span>
            <span className="text-[14px] sm:text-[15px] font-black text-white tracking-wide">
              शेतकऱ्यांसोबत वाढणारा भारत
            </span>
            <span className="text-base text-emerald-300">🌿</span>
          </div>

          {/* Bottom 3 Stats Row */}
          <div className="grid grid-cols-3 divide-x divide-white/20 pt-1 border-t border-white/15">
            {/* Stat 1 */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5 text-[#f3ba2f] shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M2 11h20M7 11c0-2.8 2.2-4.8 5-4.8s5 2 5 4.8" />
                  <circle cx="12" cy="14" r="2.2" />
                </svg>
                <span className="text-[13px] sm:text-sm font-black text-white leading-tight">
                  5000+
                </span>
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-[#fde047] leading-tight mt-0.5">
                शेतकरी जोडलेले
              </span>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5 text-[#f3ba2f] shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5z" />
                </svg>
                <span className="text-[13px] sm:text-sm font-black text-white leading-tight">
                  200+
                </span>
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-[#fde047] leading-tight mt-0.5">
                गावे
              </span>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="flex items-center gap-1">
                <svg
                  className="w-3.5 h-3.5 text-[#f3ba2f] shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span className="text-[13px] sm:text-sm font-black text-white leading-tight">
                  10,000+
                </span>
              </div>
              <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-[#fde047] leading-tight mt-0.5">
                ग्राहक कुटुंबे
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
