import React from "react";

export default function WhatMakesUsDifferent() {
  const features = [
    {
      id: "direct-from-farmers",
      title: "Direct from Farmers",
      description: "Fresh produce sourced straight from trusted local farms.",
      icon: (
        <svg
          className="w-9 h-9 sm:w-10 sm:h-10 text-[#0d5329]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Hat */}
          <path d="M2 11h20M7 11c0-2.8 2.2-4.8 5-4.8s5 2 5 4.8" />
          {/* Head */}
          <circle cx="12" cy="14" r="2.4" />
          {/* Shoulders */}
          <path d="M6.5 21v-1.5a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4V21" />
          {/* Leaf emblem */}
          <path
            d="M17 7c2-1 4 0 4 2s-1 3-4 2c0-1.5 0-3 0-4z"
            fill="#0d5329"
          />
        </svg>
      ),
    },
    {
      id: "fresh-natural",
      title: "100% Fresh & Natural",
      description: "Carefully selected fruits and vegetables, every day.",
      icon: (
        <svg
          className="w-9 h-9 sm:w-10 sm:h-10 text-[#0d5329]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          {/* Double Leaves */}
          <path d="M6 3c5.5 0 9.5 4 9.5 9.5c0 5-4 9.5-9.5 9.5c-2 0-3-1-3-3c0-5.5 3-16 3-16z" />
          <path
            d="M13 7.5c4 0 7 3 7 7c0 4-3 7-7 7c-1.5 0-2.2-.8-2.2-2.2c0-4 2.2-11.8 2.2-11.8z"
            opacity="0.75"
          />
        </svg>
      ),
    },
    {
      id: "quality-assured",
      title: "Quality Assured",
      description: "Every order checked for freshness and quality.",
      icon: (
        <svg
          className="w-9 h-9 sm:w-10 sm:h-10 text-[#0d5329]"
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
      id: "fast-delivery",
      title: "Fast Doorstep Delivery",
      description: "Farm-fresh goodness delivered right to your home.",
      icon: (
        <svg
          className="w-10 h-10 sm:w-11 sm:h-11 text-[#0d5329]"
          viewBox="0 0 24 24"
          fill="none"
        >
          {/* Speed Wind Streaks */}
          <path
            d="M1 8h4M0 12h5M2 16h3"
            stroke="#0d5329"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Delivery Truck Body */}
          <path d="M6.5 6h7.5v7H6.5z" fill="#0d5329" />
          <path d="M14 8h3.5l2.5 3.2v1.8H14z" fill="#0d5329" />
          <path d="M6.5 13h10.5v2H6.5z" fill="#0d5329" />
          {/* Wheels */}
          <circle cx="9.5" cy="17" r="2" fill="#0d5329" />
          <circle cx="17.5" cy="17" r="2" fill="#0d5329" />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative w-full pt-5 pb-1 sm:py-7 lg:py-8 bg-gradient-to-b from-[#f8faf8] via-white to-[#f0f7f2] overflow-hidden select-none">
      {/* Corner Floating Leaves (Desktop only — hidden on mobile so it never collides with or overlaps the title text) */}
      <div className="hidden md:block absolute top-1 left-4 w-28 pointer-events-none opacity-80 z-0">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-emerald-600">
          <path d="M10 20 C30 5, 60 10, 75 35 C55 45, 25 40, 10 20 Z" fill="#22c55e" opacity="0.6" />
          <path d="M30 40 C50 25, 80 30, 90 60 C70 70, 45 60, 30 40 Z" fill="#15803d" opacity="0.75" />
          <path d="M5 55 C20 45, 45 50, 55 70 C40 80, 20 75, 5 55 Z" fill="#16a34a" opacity="0.5" />
        </svg>
      </div>

      <div className="hidden md:block absolute top-1 right-4 w-28 pointer-events-none opacity-80 z-0 transform scale-x-[-1]">
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-emerald-600">
          <path d="M10 20 C30 5, 60 10, 75 35 C55 45, 25 40, 10 20 Z" fill="#22c55e" opacity="0.6" />
          <path d="M30 40 C50 25, 80 30, 90 60 C70 70, 45 60, 30 40 Z" fill="#15803d" opacity="0.75" />
          <path d="M5 55 C20 45, 45 50, 55 70 C40 80, 20 75, 5 55 Z" fill="#16a34a" opacity="0.5" />
        </svg>
      </div>

      <div className="relative w-full px-3 sm:px-4 lg:px-6 z-10">
        {/* ========================================================
            HEADER: Leaf Accent Line, Headline, Underline & Subtitle
           ======================================================== */}
        <div className="text-center max-w-2xl mx-auto mb-4 sm:mb-6">
          {/* Top Leaf Accent Divider (— 🌿 —) */}
          <div className="flex items-center justify-center gap-2.5 mb-1.5">
            <div className="h-[1.5px] w-8 sm:w-16 bg-gradient-to-r from-transparent to-[#15803d]/70" />
            <svg className="w-4 h-4 text-[#15803d] fill-[#15803d]" viewBox="0 0 24 24">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
            </svg>
            <div className="h-[1.5px] w-8 sm:w-16 bg-gradient-to-l from-transparent to-[#15803d]/70" />
          </div>

          {/* Heading (Responsive: cleanly fitted on mobile without collision) */}
          <div className="relative inline-block px-1">
            <h2 className="text-[21px] sm:text-3xl lg:text-[34px] font-black text-[#0a351d] tracking-tight leading-tight">
              What Makes Us Different?
            </h2>
            {/* Subtle Artistic Green Underline Brush */}
            <div className="w-24 sm:w-40 h-1 bg-gradient-to-r from-[#22c55e]/30 via-[#15803d] to-[#22c55e]/30 rounded-full mx-auto mt-1" />
          </div>

          {/* Subtitle */}
          <p className="mt-1 text-xs sm:text-sm text-gray-600 font-medium tracking-normal px-2">
            Freshness, trust, and convenience in every order.
          </p>
        </div>

        {/* ========================================================
            THE 4 CARDS:
            Mobile: Clean 2x2 Grid fitting comfortably on screen
            Desktop: Exact Original 4-Column Full-Width Row
           ======================================================== */}
        
        {/* Mobile View: 2x2 Clean Compact Grid */}
        <div className="grid grid-cols-2 lg:hidden gap-2.5 sm:gap-3.5 px-1 pb-1">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="relative flex flex-col items-center text-center rounded-2xl bg-white p-3.5 sm:p-4 shadow-[0_4px_16px_rgba(0,0,0,0.03)] border border-emerald-100/70"
            >
              {/* Circular Icon Badge */}
              <div className="w-12 h-12 rounded-full bg-[#e8f7ee] flex items-center justify-center mb-2 shadow-2xs">
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="text-[12px] sm:text-sm font-black text-[#0a351d] tracking-tight leading-snug">
                {feature.title}
              </h3>

              {/* Green Accent Dash */}
              <div className="w-6 h-0.5 bg-[#86efac] rounded-full my-1.5" />

              {/* Description */}
              <p className="text-[10px] sm:text-xs text-gray-500 font-normal leading-tight">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Desktop View: Exact Original 4-Column Row (Untouched) */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-5 pb-0 w-full">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="w-full relative flex flex-col items-center text-center rounded-2xl bg-white p-5 shadow-[0_6px_24px_rgba(0,0,0,0.04)] border border-emerald-100/70 hover:shadow-[0_12px_32px_rgba(16,185,129,0.1)] hover:-translate-y-1 transition-all duration-300 group"
            >
              {/* Circular Icon Badge */}
              <div className="w-16 h-16 rounded-full bg-[#e8f7ee] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300 shadow-2xs">
                {feature.icon}
              </div>

              {/* Title */}
              <h3 className="text-base font-black text-[#0a351d] tracking-tight leading-snug">
                {feature.title}
              </h3>

              {/* Green Accent Dash */}
              <div className="w-7 h-1 bg-[#86efac] rounded-full my-1.5" />

              {/* Description */}
              <p className="text-xs text-gray-500 font-normal leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* ========================================================
            BOTTOM ORGANIC WAVE & LEAF ORNAMENT
           ======================================================== */}
        <div className="relative mt-2 sm:mt-7 flex items-center justify-center">
          <div className="h-[1.5px] w-16 sm:w-36 bg-gradient-to-r from-transparent to-[#15803d]/60" />
          <div className="mx-2.5 flex items-center gap-1.5 text-[#15803d]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
            <svg className="w-4 h-4 fill-[#15803d] text-[#15803d]" viewBox="0 0 24 24">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
            </svg>
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
          </div>
          <div className="h-[1.5px] w-16 sm:w-36 bg-gradient-to-l from-transparent to-[#15803d]/60" />
        </div>
      </div>
    </section>
  );
}
