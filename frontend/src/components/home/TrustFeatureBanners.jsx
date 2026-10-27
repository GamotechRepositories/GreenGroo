import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  QrCode,
  ShieldCheck,
  X,
  ArrowRight,
  MapPin,
  Calendar,
  Snowflake,
  Sprout,
  Truck,
  Check,
  ScanLine,
  FlaskConical,
  Droplets,
  Cog,
  FileText,
  Leaf,
  CheckCircle2,
  Clock,
} from "lucide-react";
import OptimizedImg from "../common/OptimizedImg";

export default function TrustFeatureBanners() {
  const [showQrModal, setShowQrModal] = useState(false);

  return (
    <>
      <section className="w-full py-3 sm:py-4 bg-transparent select-none">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible gap-3 sm:gap-4 pb-2 md:pb-0 snap-x snap-mandatory no-scrollbar">
            {/* ========================================================
                CARD 1: 100% Certified Organic (Compact Light UI)
               ======================================================== */}
            <div className="flex-shrink-0 w-[275px] sm:w-[310px] md:w-auto relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-100/90 bg-white text-slate-900 p-3 sm:p-3.5 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all snap-center">
              <div>
                {/* Header: Badges */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-black tracking-wide">
                    <Leaf className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                    <span>100% CERTIFIED ORGANIC</span>
                  </span>

                  {/* Jaivik Bharat Seal */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 shadow-2xs">
                      <svg className="w-3 h-3 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5l-4-4 1.41-1.41L11 13.67l6.59-6.59L19 8.5l-8 8z" />
                      </svg>
                    </div>
                    <span className="text-[6.5px] font-black text-emerald-800 tracking-wider uppercase mt-0.5 leading-none text-center">
                      JAIVIK<br />BHARAT
                    </span>
                  </div>
                </div>

                {/* Fresh Produce Banner (Compact) */}
                <div className="relative w-full h-20 sm:h-22 rounded-xl overflow-hidden border border-emerald-100 shadow-2xs my-1.5 bg-slate-50">
                  <OptimizedImg
                    src="/assets/features/organic_fresh_produce.jpg"
                    alt="100% Certified Organic Fresh Produce"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Two Stat Cards (Compact) */}
                <div className="grid grid-cols-2 gap-1.5 my-1.5">
                  <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <FlaskConical className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-black text-emerald-950 leading-tight">0.00%</span>
                      <span className="block text-[8.5px] font-medium text-slate-500 leading-tight truncate">Synthetic Pesticides</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <Sprout className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-black text-emerald-950 leading-tight">100%</span>
                      <span className="block text-[8.5px] font-medium text-slate-500 leading-tight truncate">Living Soil Tested</span>
                    </div>
                  </div>
                </div>

                {/* Checklist Rows (Compact) */}
                <div className="space-y-1 my-1.5">
                  <div className="flex items-center justify-between py-0.5 text-[10px] font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Leaf className="w-3 h-3 text-emerald-600 fill-emerald-600/30 shrink-0" />
                      <span>Non-GMO Heirloom Seeds</span>
                    </div>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                      Certified
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-0.5 text-[10px] font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Leaf className="w-3 h-3 text-emerald-600 fill-emerald-600/30 shrink-0" />
                      <span>Artificial Ripening Agents</span>
                    </div>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                      Zero Used
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom: Headline, Subtitle & Action */}
              <div className="mt-2 pt-1 border-t border-slate-100">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight">
                  Purity You Can Taste, <span className="text-emerald-600">Guaranteed.</span>
                </h3>
                <p className="mt-0.5 text-[10px] text-slate-500 font-medium leading-snug line-clamp-1 mb-2">
                  Every vegetable & fruit is grown naturally without toxic sprays.
                </p>

                <Link
                  to="/about"
                  className="inline-flex items-center justify-between w-full px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold shadow-xs transition-all active:scale-[0.98]"
                >
                  <span>Explore Organic Sourcing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* ========================================================
                CARD 2: Farm-to-Fork Passport (Compact Light UI)
               ======================================================== */}
            <div className="flex-shrink-0 w-[275px] sm:w-[310px] md:w-auto relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-100/90 bg-white text-slate-900 p-3 sm:p-3.5 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all snap-center">
              <div>
                {/* Header: Badges */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-black tracking-wide">
                    <MapPin className="w-3 h-3 text-emerald-600" />
                    <span>FARM-TO-FORK PASSPORT</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>LIVE BATCH</span>
                  </span>
                </div>

                {/* Clamshell Produce Box (Compact) */}
                <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-xl bg-emerald-50/40 border border-emerald-100/80 my-1.5">
                  <div className="relative w-12 h-12 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0 shadow-2xs border border-emerald-100 overflow-hidden">
                    <OptimizedImg
                      src="/assets/features/clamshell_qr_produce.jpg"
                      alt="Fresh produce with QR code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1 text-[10px]">
                    <div className="flex items-center gap-1 text-slate-900 font-bold truncate">
                      <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">Nashik Plot 4B (Patil Co-op)</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600 font-medium truncate">
                      <Calendar className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">Harvested: Today 04:30 AM</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600 font-medium truncate">
                      <Snowflake className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">Cold Chain: <strong className="text-emerald-700 font-bold">4.2°C Continuous</strong></span>
                    </div>
                  </div>
                </div>

                {/* Timeline Pipeline (Compact) */}
                <div className="relative my-2 px-1">
                  {/* Connecting Line */}
                  <div className="absolute top-[22px] left-[18%] right-[18%] h-0.5 bg-emerald-500 z-0" />

                  <div className="relative z-10 grid grid-cols-3 text-center">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-slate-900 mb-0.5">04:30 AM</span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xs">
                        <Sprout className="w-3 h-3" />
                      </div>
                      <span className="text-[9px] font-semibold text-slate-500 mt-0.5">Harvested</span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-slate-900 mb-0.5">05:15 AM</span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xs">
                        <Truck className="w-3 h-3" />
                      </div>
                      <span className="text-[9px] font-semibold text-slate-500 mt-0.5">Cold Hub</span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-slate-900 mb-0.5">06:00 AM</span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xs">
                        <ShieldCheck className="w-3 h-3" />
                      </div>
                      <span className="text-[9px] font-semibold text-slate-500 mt-0.5">QC Passed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Headline, Subtitle & Action */}
              <div className="mt-2 pt-1 border-t border-slate-100">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight">
                  Pure Through <span className="text-emerald-600">Traceability</span>
                </h3>
                <p className="mt-0.5 text-[10px] text-slate-500 font-medium leading-snug line-clamp-1 mb-2">
                  Scan any packet with phone camera to see farmer and harvest log.
                </p>

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="inline-flex items-center justify-between w-full px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 text-[11px] font-bold border border-emerald-200/80 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <ScanLine className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Simulate Live QR Scan</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ========================================================
                CARD 3: 24-Point Lab Tested (Compact Light UI)
               ======================================================== */}
            <div className="flex-shrink-0 w-[275px] sm:w-[310px] md:w-auto relative flex flex-col justify-between overflow-hidden rounded-2xl border border-emerald-100/90 bg-white text-slate-900 p-3 sm:p-3.5 shadow-xs hover:shadow-md hover:border-emerald-200 transition-all snap-center">
              <div>
                {/* Header: Badges */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-black tracking-wide">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>CERTIFIED LAB SAFETY</span>
                  </span>

                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[9px] font-bold">
                    ISO 17025
                  </span>
                </div>

                {/* Circular Gauge & Score Box (Compact) */}
                <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-xl bg-emerald-50/40 border border-emerald-100/80 my-1.5">
                  <div className="flex items-center gap-2">
                    <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          className="text-emerald-100 stroke-current"
                          strokeWidth="3.5"
                          fill="none"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          className="text-emerald-600 stroke-current"
                          strokeWidth="3.5"
                          strokeDasharray="87.96"
                          strokeDashoffset="1.2"
                          strokeLinecap="round"
                          fill="none"
                        />
                      </svg>
                      <span className="absolute text-[8.5px] font-black text-slate-900">99.8%</span>
                    </div>
                    <div>
                      <div className="text-[11px] font-black text-slate-900 leading-tight">Purity Index Score</div>
                      <div className="text-[9px] text-emerald-600 font-bold">Grade A+ (Safe)</div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-black">
                    <Check className="w-3 h-3 stroke-[3] text-emerald-600" />
                    <span>PASSED</span>
                  </span>
                </div>

                {/* 4 Laboratory Parameters (Compact) */}
                <div className="space-y-1 my-1.5 text-[10px]">
                  <div className="flex items-center justify-between font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <FlaskConical className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Pesticide Residue</span>
                    </div>
                    <span className="font-extrabold text-emerald-700 text-[9.5px]">0.00 ppm (Clean)</span>
                  </div>

                  <div className="flex items-center justify-between font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Heavy Metals (Lead/Arsenic)</span>
                    </div>
                    <span className="font-extrabold text-emerald-700 text-[9.5px]">Not Detected</span>
                  </div>

                  <div className="flex items-center justify-between font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Cog className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Microbial / Pathogen Safety</span>
                    </div>
                    <span className="font-extrabold text-emerald-700 text-[9.5px]">100% Certified</span>
                  </div>

                  <div className="flex items-center justify-between font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Droplets className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Water Purity & Living Soil</span>
                    </div>
                    <span className="font-extrabold text-emerald-700 text-[9.5px]">100% Certified</span>
                  </div>
                </div>
              </div>

              {/* Bottom: Headline, Subtitle & Action */}
              <div className="mt-2 pt-1 border-t border-slate-100">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight">
                  24-Point <span className="text-emerald-600">Lab Tested</span>
                </h3>
                <p className="mt-0.5 text-[10px] text-slate-500 font-medium leading-snug line-clamp-1 mb-2">
                  Strict chromatographic analysis conducted in accredited labs.
                </p>

                <Link
                  to="/about"
                  className="inline-flex items-center justify-between w-full px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 text-[11px] font-bold border border-emerald-200/80 transition-all active:scale-[0.98]"
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    <span>View Lab Certificate #GG-2026</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Traceability Modal (Light Mode Styled) */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white text-slate-900 rounded-3xl shadow-2xl p-6 overflow-hidden border border-emerald-100">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900">
                  Live Farm-to-Fork Passport
                </h4>
                <p className="text-xs text-emerald-600 font-semibold">
                  Batch #GG-NASHIK-9842 • Verified
                </p>
              </div>
            </div>

            <div className="my-4 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-3">
              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Nashik Farmers Collective:</strong>
                  <p className="text-slate-600 mt-0.5">Plot 4B, Dindori, Nashik (Suresh Patil & Co-op)</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Harvest Timestamp:</strong>
                  <p className="text-slate-600 mt-0.5">Today at 04:30 AM (Sun-ripened, hand-picked)</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900">Lab Safety Check:</strong>
                  <p className="text-slate-600 mt-0.5">0.00% Pesticides Detected • Soil Certified Pure</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-md shadow-emerald-700/20 cursor-pointer"
            >
              Close Verification
            </button>
          </div>
        </div>
      )}
    </>
  );
}
