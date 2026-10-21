import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sprout,
  ShieldCheck,
  Check,
  X,
  ArrowRight,
  TrendingUp,
  CircleDollarSign,
  Handshake,
  Ban,
  Layers,
  Sparkles,
  QrCode,
  MapPin,
  Clock,
  Thermometer,
  Award,
  HeartPulse,
  Leaf,
  ShieldAlert,
  Zap,
} from "lucide-react";

export default function WhatMakesUsDifferent() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <section className="w-full py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-[#fbfdfc] via-[#f3f9f5] to-[#fbfdfc] select-none border-t border-emerald-900/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ========================================================
            FLAGSHIP HEADER: Editorial Badge & Punchy Headline
           ======================================================== */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-300/60 text-emerald-900 text-xs font-black tracking-wider uppercase mb-3 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>THE GREENGROCC DIFFERENCE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            What Makes Us Different?
          </h2>

          <p className="mt-3 text-sm sm:text-base text-gray-600 font-medium leading-relaxed max-w-2xl mx-auto">
            An uncompromising standard of pure living soil, verified farmer prosperity, and 100% digital transparency for your family.
          </p>
        </div>

        <div className="space-y-8 sm:space-y-12">
          {/* ========================================================
              CARD 1: Farmers First (शेतकरी आमचा अभिमान) — Dark Editorial Luxury
             ======================================================== */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#041d11] via-[#093520] to-[#03150c] text-white shadow-2xl border border-emerald-500/30">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
              {/* Left Side: Authentic Farmer Portrait */}
              <div className="lg:col-span-5 relative min-h-[300px] sm:min-h-[380px] lg:min-h-full overflow-hidden">
                <img
                  src="/assets/features/farmer_portrait_pro.jpg"
                  alt="Proud Maharashtrian Organic Farmer"
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
                {/* Multi-stop cinematic gradients for seamless blend */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#041d11] via-transparent to-transparent lg:hidden" />
                <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-[#041d11]/40 to-[#041d11]" />

                {/* Floating Farmer Origin Badge */}
                <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:left-4 z-10 flex items-center gap-2.5 p-2.5 rounded-2xl bg-black/65 backdrop-blur-md border border-white/20 shadow-lg">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white truncate">Nashik & Pune Co-operatives</p>
                    <p className="text-[10px] text-emerald-300 font-bold truncate">840+ Direct Partner Farmers</p>
                  </div>
                </div>
              </div>

              {/* Right Side: Editorial Content & 4 Stat Cards */}
              <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  {/* Eyebrow Chip */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10.5px] font-black tracking-wider uppercase border border-emerald-400/30">
                      ETHICAL PROCUREMENT • ZERO BROKERAGE
                    </span>
                  </div>

                  {/* Headlines */}
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-1">
                    शेतकरी आमचा अभिमान
                  </h3>
                  <p className="text-base sm:text-lg font-bold text-emerald-400 mb-3">
                    Farmers First — Fair, Direct & Transparent
                  </p>

                  <p className="text-xs sm:text-sm text-emerald-100/80 font-medium leading-relaxed mb-6 max-w-xl">
                    आम्ही शेतकऱ्यांना योग्य दर, वेळेवर थेट पेमेंट आणि दीर्घकालीन हमी देतो. By cutting out APMC mandi commissions and multi-tier middlemen, farmers earn substantially higher while you get morning-harvest freshness.
                  </p>
                </div>

                {/* 4 Pillars Stat Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-emerald-400/20 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                      <CircleDollarSign className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-white block">Fair Price</span>
                    <span className="text-[10px] text-emerald-300/90 font-medium block mt-0.5">+28% Over Mandi</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-emerald-400/20 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                      <Handshake className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-white block">Direct Buy</span>
                    <span className="text-[10px] text-emerald-300/90 font-medium block mt-0.5">0 Middlemen</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-emerald-400/20 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-white block">Agronomy</span>
                    <span className="text-[10px] text-emerald-300/90 font-medium block mt-0.5">Bio-Seed Support</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-emerald-400/20 hover:bg-white/10 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-white block">Fast Pay</span>
                    <span className="text-[10px] text-emerald-300/90 font-medium block mt-0.5">48-Hr Settlement</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              CARD 2: Organic Matters — Nature-Luxury Clean Card
             ======================================================== */}
          <div className="relative overflow-hidden rounded-3xl bg-white text-gray-900 shadow-xl border border-emerald-200/80">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
              {/* Left Side: Content & 4 Natural Standards */}
              <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between order-2 lg:order-1">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-black tracking-wider uppercase mb-3">
                    <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                    <span>CERTIFIED NATURAL CULTIVATION</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-1">
                    Organic Matters
                  </h3>
                  <p className="text-base sm:text-lg font-bold text-emerald-700 mb-3">
                    Good for You. Good for the Planet.
                  </p>

                  <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed mb-6 max-w-xl">
                    रसायनमुक्त, नैसर्गिक आणि आरोग्यदायी उत्पादने – तुमच्या आणि तुमच्या कुटुंबासाठी. We cultivate purely in bio-dynamic, nutrient-dense living soil without chemical pesticides, carcinogenic sprays, or carbide ripeners.
                  </p>
                </div>

                {/* 4 Clean Metric Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-50 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs">
                      <Ban className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-gray-900 block leading-tight">0.00% Pesticides</span>
                    <span className="text-[10px] text-gray-500 font-medium block mt-1">Zero Synthetic Sprays</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-50 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-gray-900 block leading-tight">Better Nutrition</span>
                    <span className="text-[10px] text-gray-500 font-medium block mt-1">Dense Micronutrients</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-50 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-gray-900 block leading-tight">Living Soil</span>
                    <span className="text-[10px] text-gray-500 font-medium block mt-1">Bio-Compost Fed</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-50 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs">
                      <Sprout className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-black text-gray-900 block leading-tight">Heirloom Non-GMO</span>
                    <span className="text-[10px] text-gray-500 font-medium block mt-1">Native Heritage Seeds</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Living Soil Sprout Image */}
              <div className="lg:col-span-5 relative min-h-[280px] sm:min-h-[350px] lg:min-h-full overflow-hidden order-1 lg:order-2">
                <img
                  src="/assets/features/organic_soil_sprout.jpg"
                  alt="Living Organic Soil and Sprout"
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent lg:hidden" />
                <div className="hidden lg:block absolute inset-0 bg-gradient-to-l from-transparent via-white/20 to-white" />

                {/* Living Soil Certified Floating Pill */}
                <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-emerald-200 text-emerald-900 text-xs font-black shadow-md">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>NPOP Living Soil Certified</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              CARD 3: Pure Through Traceability — High-Tech Digital Console
             ======================================================== */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#021812] via-[#052b20] to-[#01120c] text-white shadow-2xl border border-teal-500/30">
            {/* Scanline Animation */}
            <style>{`
              @keyframes scanLaserLine {
                0% { transform: translateY(0); opacity: 0.8; }
                50% { transform: translateY(120px); opacity: 1; }
                100% { transform: translateY(0); opacity: 0.8; }
              }
              .laser-scan {
                animation: scanLaserLine 2.8s ease-in-out infinite;
              }
            `}</style>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
              {/* Left Side: Scanner Visual & Phone Mockup */}
              <div className="lg:col-span-5 relative min-h-[300px] sm:min-h-[380px] lg:min-h-full overflow-hidden bg-black flex items-center justify-center p-6">
                <img
                  src="/assets/features/traceability_phone_qr.jpg"
                  alt="QR Traceability Scanner"
                  className="w-full h-full object-cover object-center rounded-2xl opacity-90 shadow-2xl"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#021812] via-transparent to-transparent lg:hidden" />
                <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-transparent via-[#021812]/30 to-[#021812]" />

                {/* Laser scanner HUD effect overlay */}
                <div className="absolute inset-x-8 top-12 pointer-events-none">
                  <div className="laser-scan h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_12px_rgba(45,212,191,1)]" />
                </div>

                {/* Live QR Verified Pill */}
                <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-950/85 backdrop-blur-md border border-teal-400/40 text-teal-200 text-xs font-black shadow-md">
                  <QrCode className="w-3.5 h-3.5 text-teal-300" />
                  <span>BATCH #GG-NASHIK-9842</span>
                </div>
              </div>

              {/* Right Side: Copy & Journey Pipeline Tracker */}
              <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[10.5px] font-black tracking-wider uppercase mb-3 border border-teal-400/30">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
                    <span>ONE DIGITAL ID PER PACKET</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-1">
                    Pure Through Traceability
                  </h3>
                  <p className="text-base sm:text-lg font-bold text-teal-300 mb-3">
                    From Farm to Your Home — Total Transparency
                  </p>

                  <p className="text-xs sm:text-sm text-teal-100/80 font-medium leading-relaxed mb-6 max-w-xl">
                    प्रत्येक उत्पादनाचा संपूर्ण प्रवास आता पारदर्शक. QR स्कॅन करा आणि जाणून घ्या – ते कुठे पिकवले, कधी काढले, कोल्ड-चेन तापमान किती होते आणि प्रयोगशाळेचा रिपोर्ट काय आहे.
                  </p>
                </div>

                {/* Interactive 7-Step Pipeline Nodes */}
                <div className="p-4 rounded-2xl bg-black/45 backdrop-blur-md border border-teal-500/30 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-teal-200 pb-2 border-b border-teal-500/20">
                    <span>Live Verification Pipeline</span>
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider bg-emerald-500/20 px-2 py-0.5 rounded-full font-black">
                      Active Telemetry
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center text-[10px]">
                    <div className="p-1.5 rounded-xl bg-teal-950/60 border border-teal-500/20">
                      <span className="block font-black text-teal-300">Farm</span>
                      <span className="text-[8.5px] text-neutral-400">Harvest</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-teal-950/60 border border-teal-500/20">
                      <span className="block font-black text-teal-300">04:30 AM</span>
                      <span className="text-[8.5px] text-neutral-400">Picked</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-teal-950/60 border border-teal-500/20">
                      <span className="block font-black text-teal-300">Hub</span>
                      <span className="text-[8.5px] text-neutral-400">Intake</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-teal-950/60 border border-teal-500/20">
                      <span className="block font-black text-teal-300">Grade A</span>
                      <span className="text-[8.5px] text-neutral-400">Sort</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-teal-950/60 border border-teal-500/20">
                      <span className="block font-black text-teal-300">Eco-Pack</span>
                      <span className="text-[8.5px] text-neutral-400">Sealed</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-teal-950/60 border border-teal-500/20">
                      <span className="block font-black text-teal-300">4.2°C</span>
                      <span className="text-[8.5px] text-neutral-400">Cold Van</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-emerald-950/80 border border-emerald-400/40">
                      <span className="block font-black text-emerald-300">Your Door</span>
                      <span className="text-[8.5px] text-emerald-400">Delivered</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              CARD 4: Comparison Table: Why GREENGROCC is Better — High-Contrast Pro Layout
             ======================================================== */}
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 sm:p-10 shadow-xl">
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-black uppercase tracking-wider mb-2">
                TRANSPARENT COMPARISON
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                Why <span className="text-emerald-600">GREENGROCC</span> is Better?
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-gray-500 font-medium max-w-lg mx-auto">
                Compare traditional quick-commerce apps with our direct-from-farm model.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
              {/* Others Column (Muted Traditional) */}
              <div className="rounded-3xl border border-rose-200/80 bg-gradient-to-b from-rose-50/40 to-white p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between border-b border-rose-200/70 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                      ✕
                    </div>
                    <div>
                      <h4 className="font-black text-base text-gray-900">Conventional Apps</h4>
                      <p className="text-[11px] text-gray-500 font-medium">Standard Marketplaces</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-rose-700 uppercase bg-rose-100 px-2.5 py-1 rounded-full">
                    Compromised
                  </span>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-gray-700">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      ✕
                    </div>
                    <div>
                      <strong className="text-gray-900 block">Mixed Wholesale Sourcing</strong>
                      <span className="text-[11px] text-gray-500">Produce sits in APMC mandis for days before reaching dark stores.</span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      ✕
                    </div>
                    <div>
                      <strong className="text-gray-900 block">Zero Farmer Connection</strong>
                      <span className="text-[11px] text-gray-500">Multiple commission agents; farmers get meager bottom rates.</span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      ✕
                    </div>
                    <div>
                      <strong className="text-gray-900 block">No Batch Traceability</strong>
                      <span className="text-[11px] text-gray-500">Impossible to know harvest timestamp, plot location, or soil quality.</span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      ✕
                    </div>
                    <div>
                      <strong className="text-gray-900 block">Chemical Preservatives & Gas</strong>
                      <span className="text-[11px] text-gray-500">Carbide gas ripening and wax sprays used to extend artificial shelf life.</span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      ✕
                    </div>
                    <div>
                      <strong className="text-gray-900 block">Speed Over Nutrition</strong>
                      <span className="text-[11px] text-gray-500">Focus on 10-minute delivery speed rather than food purity and vitamins.</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* GreenGrocc Column (The Clean Standard) */}
              <div className="rounded-3xl border-2 border-emerald-500 bg-gradient-to-b from-emerald-50/80 via-white to-emerald-50/30 p-5 sm:p-7 space-y-4 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-bl-2xl shadow-sm">
                  Recommended Clean Living
                </div>

                <div className="flex items-center justify-between border-b border-emerald-200 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      ✓
                    </div>
                    <div>
                      <h4 className="font-black text-base text-emerald-950">GREENGROCC</h4>
                      <p className="text-[11px] text-emerald-700 font-bold">100% Farm-To-Kitchen Standard</p>
                    </div>
                  </div>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-emerald-950 font-medium">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-xs">
                      ✓
                    </div>
                    <div>
                      <strong className="text-emerald-950 block">Direct Farm Harvest Sourcing</strong>
                      <span className="text-[11px] text-emerald-800/80">Hand-picked fresh daily at 04:30 AM from verified partner farms.</span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-xs">
                      ✓
                    </div>
                    <div>
                      <strong className="text-emerald-950 block">Farmers First Living Wages</strong>
                      <span className="text-[11px] text-emerald-800/80">28%+ above mandi rates paid directly into farmers' accounts within 48 hours.</span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-xs">
                      ✓
                    </div>
                    <div>
                      <strong className="text-emerald-950 block">100% One-ID QR Traceability</strong>
                      <span className="text-[11px] text-emerald-800/80">Scan any packet to view farmer photo, harvest time, and cold chain log.</span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-xs">
                      ✓
                    </div>
                    <div>
                      <strong className="text-emerald-950 block">24-Point Lab Certified Safety</strong>
                      <span className="text-[11px] text-emerald-800/80">Zero chemical ripeners, zero wax sprays, and 0.00% pesticide guarantee.</span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-xs">
                      ✓
                    </div>
                    <div>
                      <strong className="text-emerald-950 block">Continuous 4.2°C Cold Chain</strong>
                      <span className="text-[11px] text-emerald-800/80">Pre-cooled at farm gate and maintained cold to retain maximum vitamins.</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* ========================================================
              CARD 5: Bottom Banner: More Than Just Groceries — With Vegetable Basket Photo
             ======================================================== */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#031d11] via-[#093520] to-[#041a10] text-white shadow-2xl border border-emerald-500/25">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-center">
              {/* Left Side: Call to Action */}
              <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-3 border border-emerald-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  <span>More Than Just Groceries</span>
                </span>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-2">
                  हे आहे आरोग्यदायी भविष्य !
                </h3>

                <p className="text-xs sm:text-sm text-emerald-100/85 font-medium leading-relaxed mb-6 max-w-md">
                  Pure, tested, chemical-free farm harvest delivered with pride and care. Order your healthy weekly fresh basket today.
                </p>

                <Link
                  to="/product"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-[#021810] text-xs sm:text-sm font-black shadow-lg shadow-emerald-950/50 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Shop Fresh Produce</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </div>

              {/* Right Side: Generated Fresh Vegetable Basket Photo */}
              <div className="lg:col-span-6 relative h-64 sm:h-80 lg:h-96 overflow-hidden">
                <img
                  src="/assets/features/vegetable_basket_sunlight.jpg"
                  alt="Farm Fresh Vegetables in Rustic Wicker Basket"
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#031d11] via-transparent to-transparent lg:hidden" />
                <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-[#031d11] via-[#031d11]/30 to-transparent" />
              </div>
            </div>

            {/* Bottom 4 Trust Micro-Pills */}
            <div className="p-4 sm:p-5 bg-black/40 backdrop-blur-md border-t border-emerald-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs font-bold text-emerald-200">
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
                <span>Freshness Guaranteed</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
                <span>Organic Choices</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
                <span>Farmer Empowerment</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[2.5]" />
                <span>Better Tomorrow</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
