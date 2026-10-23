import React from "react";
import { Check, X } from "lucide-react";

export default function WhatMakesUsDifferent() {
  const appFeatures = [
    {
      id: "farmers",
      title: "Direct from Farmers",
      marathiSubtitle: "(शेतकऱ्यांशी थेट)",
      description: "Fresh produce sourced straight from trusted local farms.",
      icon: (
        <svg
          className="w-7 h-7 text-[#0c4a28]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Farmer with Hat */}
          <path d="M2 11h20M7 11c0-2.8 2.2-4.8 5-4.8s5 2 5 4.8" />
          <circle cx="12" cy="14" r="2.2" />
          <path d="M6.5 21v-1.5a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4V21" />
          <path d="M17 7c2-1 4 0 4 2s-1 3-4 2c0-1.5 0-3 0-4z" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "fresh-natural",
      title: "100% Fresh & Natural",
      marathiSubtitle: "(ताजे व नैसर्गिक)",
      description: "Carefully selected fruits and vegetables, every day.",
      icon: (
        <svg
          className="w-7 h-7 text-[#0c4a28]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          {/* Double Leaves */}
          <path d="M6 3c5.5 0 9.5 4 9.5 9.5c0 5-4 9.5-9.5 9.5c-2 0-3-1-3-3c0-5.5 3-16 3-16z" />
          <path
            d="M13 7.5c4 0 7 3 7 7c0 4-3 7-7 7c-1.5 0-2.2-.8-2.2-2.2c0-4 2.2-11.8 2.2-11.8z"
            opacity="0.8"
          />
        </svg>
      ),
    },
    {
      id: "quality-assured",
      title: "Quality Assured",
      marathiSubtitle: "(गुणवत्ता तपासणी)",
      description: "Every order checked for freshness and quality.",
      icon: (
        <svg
          className="w-7 h-7 text-[#0c4a28]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Shield with Checkmark */}
          <path d="M12 22s8-4 8-10V5l-8-3l-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12l2 2l4-4" strokeWidth="2.6" />
        </svg>
      ),
    },
    {
      id: "organic-chemical-free",
      title: "Organic & Chemical Free",
      marathiSubtitle: "(सेंद्रिय उत्पादन)",
      description: "Safe, healthy and chemical-free produce for your family.",
      icon: (
        <svg
          className="w-7 h-7 text-[#0c4a28]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Beaker Flask */}
          <path d="M10 2v5.5L4.5 19a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 7.5V2" />
          <path d="M8.5 2h7" />
          <path d="M7 16h10" strokeWidth="1.8" />
        </svg>
      ),
    },
    {
      id: "exclusive-offers",
      title: "Exclusive Offers",
      marathiSubtitle: "(विशेष सवलती)",
      description: "Best deals and offers only on GreenGrocc.",
      icon: (
        <svg
          className="w-7 h-7 text-[#0c4a28]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Discount Badge % */}
          <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
          <path d="m15 9-6 6" />
          <circle cx="9" cy="9" r="1" fill="currentColor" />
          <circle cx="15" cy="15" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "easy-ordering",
      title: "Easy Ordering",
      marathiSubtitle: "(सोपे ऑर्डर)",
      description: "Hassle-free ordering in just a few taps.",
      icon: (
        <svg
          className="w-7 h-7 text-[#0c4a28]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Clipboard / Easy Order */}
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      ),
    },
    {
      id: "fast-delivery",
      title: "Fast Doorstep Delivery",
      marathiSubtitle: "(घरपोच सुविधा)",
      description: "Farm-fresh goodness delivered to your home.",
      icon: (
        <svg
          className="w-8 h-8 text-[#0c4a28]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Fast Delivery Truck */}
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18H9" />
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.24-4.05A2 2 0 0 0 17 8h-3v10h1" />
          <circle cx="17" cy="18" r="2" fill="#0c4a28" />
          <circle cx="7" cy="18" r="2" fill="#0c4a28" />
        </svg>
      ),
    },
    {
      id: "support",
      title: "24/7 Support",
      marathiSubtitle: "(ग्राहक सहाय्य)",
      description: "We are always here to help you.",
      icon: (
        <svg
          className="w-7 h-7 text-[#0c4a28]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* 24/7 Support Headset */}
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
          <path d="M21 14a8 8 0 0 0-16 0" />
        </svg>
      ),
    },
  ];

  const otherPlatformPoints = [
    "शेतकरी माहिती नाही",
    "सेंद्रिय गुणवत्तेची खात्री नाही",
    "ट्रेसेबिलिटी नाही",
    "लॅब टेस्ट नाही",
    "स्थानिक उत्पादनांना प्राधान्य नाही",
  ];

  const greenGroccPoints = [
    "प्रत्येक शेतकऱ्याची माहिती",
    "100% सेंद्रिय व नैसर्गिक उत्पादने",
    "एंड टू एंड ट्रेसेबिलिटी",
    "प्रमाणित लॅब टेस्ट रिपोर्ट",
    "स्थानिक शेतकऱ्यांना समर्थन",
    "ताजे व हंगामी उत्पादने",
  ];

  return (
    <section className="w-full py-4 sm:py-6 lg:py-8 bg-white select-none">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 space-y-10 sm:space-y-14">
        {/* =========================================================
            DESKTOP VIEW (Visible on md: / lg: and up)
            Matches 1st Image (4 Columns x 2 Rows with hairline dividers)
            AND Desktop Comparison (2 Separate Rounded Cards Side-by-Side)
           ========================================================= */}
        <div className="hidden md:block space-y-12">
          {/* 1. App मध्ये खास वैशिष्ट्ये */}
          <div>
            <h2 className="text-2xl sm:text-[26px] font-black text-[#0c4a28] tracking-tight mb-6 text-left">
              App मध्ये खास वैशिष्ट्ये
            </h2>

            <div className="grid grid-cols-4 w-full">
              {appFeatures.map((feat, idx) => {
                const col = idx % 4; // 0, 1, 2, 3
                const isRow1 = idx < 4;

                const borderClasses = [
                  col < 3 ? "border-r border-[#e1ede4]" : "",
                  isRow1 ? "border-b border-[#e1ede4]" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <div
                    key={feat.id}
                    className={`flex flex-col items-center text-center py-6 px-4 group transition-colors duration-150 ${borderClasses}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-[#e6f5ea] flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-105">
                      {feat.icon}
                    </div>

                    <h3 className="text-[15px] font-black text-[#113821] tracking-tight leading-tight">
                      {feat.title}
                    </h3>

                    <p className="text-[13px] font-bold text-[#0c4a28] mt-1 leading-snug">
                      {feat.marathiSubtitle}
                    </p>

                    <p className="text-[11.5px] text-gray-500 mt-2 leading-relaxed max-w-[215px] mx-auto">
                      {feat.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Why Choose GreenGrocc? (Desktop 2-Card Side-by-Side Layout Matching 1st Image) */}
          <div>
            <h2 className="text-2xl sm:text-[26px] font-black text-[#0c4a28] tracking-tight mb-5 text-left">
              Why Choose GreenGrocc?
            </h2>

            <div className="grid grid-cols-2 gap-5 w-full">
              {/* Card 1: इतर प्लॅटफॉर्म */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col">
                <div className="bg-[#e4e9f0] py-3.5 px-4 text-center border-b border-[#cbd5e1]">
                  <span className="font-extrabold text-base text-gray-800 tracking-wide">
                    इतर प्लॅटफॉर्म
                  </span>
                </div>

                <div className="p-6 space-y-4 bg-white flex-1">
                  {otherPlatformPoints.map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-3.5">
                      <div className="w-5 h-5 rounded-full bg-[#ef4444] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <X className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className="text-[14.5px] font-bold text-gray-700">
                        {pt}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: GREENGROCC */}
              <div className="bg-white rounded-2xl overflow-hidden border border-emerald-200/80 shadow-[0_2px_8px_rgba(12,131,61,0.06)] flex flex-col">
                <div className="bg-[#0c833d] py-3.5 px-4 text-center border-b border-[#0a7034] flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-white fill-white" viewBox="0 0 24 24">
                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                  </svg>
                  <span className="font-black text-base text-white tracking-wider">
                    GREENGROCC
                  </span>
                </div>

                <div className="p-6 space-y-4 bg-white flex-1">
                  {greenGroccPoints.map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-3.5">
                      <div className="w-5 h-5 rounded-full bg-[#0a803e] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-[14.5px] font-bold text-gray-800">
                        {pt}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            MOBILE VIEW (Visible on mobile up to md)
            Matches 2nd Image (2 Columns x 4 Rows with hairline dividers, no description)
            AND Mobile Comparison (Single Stacked Rounded Card + Bottom Green Bar)
           ========================================================= */}
        <div className="block md:hidden space-y-8">
          {/* 1. App मध्ये खास वैशिष्ट्ये */}
          <div>
            <h2 className="text-xl sm:text-[22px] font-black text-[#0c4a28] tracking-tight mb-4 px-1 text-left">
              App मध्ये खास वैशिष्ट्ये
            </h2>

            <div className="grid grid-cols-2 w-full">
              {appFeatures.map((feat, idx) => {
                const col = idx % 2; // 0 or 1
                const row = Math.floor(idx / 2); // 0, 1, 2, 3

                const borderClasses = [
                  col === 0 ? "border-r border-[#e1ede4]" : "",
                  row < 3 ? "border-b border-[#e1ede4]" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <div
                    key={feat.id}
                    className={`flex flex-col items-center text-center py-5 px-2.5 transition-colors duration-150 ${borderClasses}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-[#e6f5ea] flex items-center justify-center mb-2.5">
                      {feat.icon}
                    </div>

                    <h3 className="text-xs sm:text-[13px] font-black text-[#113821] tracking-tight leading-tight">
                      {feat.title}
                    </h3>

                    <p className="text-[11px] sm:text-xs font-bold text-[#0c4a28] mt-1 leading-snug">
                      {feat.marathiSubtitle}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. ग्रीनग्रोक का वेगळं ? (Mobile Stacked Comparison Card Matching 2nd Image) */}
          <div>
            <h2 className="text-xl sm:text-[22px] font-black text-[#0c4a28] tracking-tight mb-3 px-1 text-left">
              ग्रीनग्रोक का वेगळं ?
            </h2>

            {/* Single Stacked Card Container matching Image 2 */}
            <div className="rounded-2xl overflow-hidden border border-gray-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.03)] bg-white">
              {/* Block 1: इतर प्लॅटफॉर्म */}
              <div className="bg-white border-b border-gray-200">
                <div className="bg-[#e4e9f0] py-2.5 px-3 text-center border-b border-[#cbd5e1]">
                  <span className="font-extrabold text-[13px] text-gray-800">
                    इतर प्लॅटफॉर्म
                  </span>
                </div>
                <div className="p-3.5 space-y-3 bg-white">
                  {otherPlatformPoints.map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <X className="w-4 h-4 text-[#ef4444] stroke-[3.5] shrink-0" />
                      <span className="text-xs sm:text-[13px] font-bold text-gray-800">
                        {pt}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Block 2: GREENGROCC */}
              <div className="bg-white">
                <div className="bg-[#0c833d] py-2.5 px-3 text-center border-b border-[#0a7034] flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4 text-white fill-white" viewBox="0 0 24 24">
                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                  </svg>
                  <span className="font-black text-xs sm:text-[13px] text-white tracking-wider">
                    GREENGROCC
                  </span>
                </div>
                <div className="p-3.5 space-y-3 bg-white">
                  {greenGroccPoints.map((pt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-[#0a803e] stroke-[3.5] shrink-0" />
                      <span className="text-xs sm:text-[13px] font-bold text-gray-800">
                        {pt}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Dark Green Bar matching Image 2 */}
              <div className="bg-[#06381b] py-2.5 px-2 text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-2 sm:gap-3 border-t border-[#052b15]">
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" viewBox="0 0 24 24">
                    <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                  </svg>
                  <span>Healthy Food</span>
                </div>
                <span className="text-white/40">|</span>
                <div className="flex items-center gap-1">
                  <span>👥</span>
                  <span>Happy Farmers</span>
                </div>
                <span className="text-white/40">|</span>
                <div className="flex items-center gap-1">
                  <span className="text-white">🤍</span>
                  <span>Stronger Maharashtra</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
