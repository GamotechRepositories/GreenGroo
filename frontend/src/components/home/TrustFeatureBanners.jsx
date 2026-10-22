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

export default function TrustFeatureBanners() {
  const [showQrModal, setShowQrModal] = useState(false);

  return (
    <>
      <section className="w-full py-5 sm:py-8 bg-transparent select-none">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-3 pt-1 lg:grid lg:grid-cols-3">
            {/* ========================================================
                CARD 1: 100% Certified Organic (Light UI)
               ======================================================== */}
            <div className="flex-shrink-0 w-[310px] sm:w-[370px] lg:w-auto relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-emerald-100/90 bg-white text-slate-900 p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_14px_40px_rgba(16,185,129,0.08)] transition-all">
              <div>
                {/* Header: Badges */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/90 text-emerald-800 text-xs font-black tracking-wide">
                    <Leaf className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                    <span>100% CERTIFIED ORGANIC</span>
                  </span>

                  {/* Jaivik Bharat Seal */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 shadow-xs">
                      <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5l-4-4 1.41-1.41L11 13.67l6.59-6.59L19 8.5l-8 8z" />
                      </svg>
                    </div>
                    <span className="text-[7.5px] font-black text-emerald-800 tracking-wider uppercase mt-0.5 leading-tight text-center">
                      JAIVIK<br />BHARAT
                    </span>
                  </div>
                </div>

                {/* Fresh Produce Image */}
                <div className="relative w-full rounded-2xl overflow-hidden aspect-[16/9] border border-emerald-100 shadow-xs my-2.5 bg-slate-50">
                  <img
                    src="/assets/features/organic_fresh_produce.jpg"
                    alt="100% Certified Organic Fresh Produce"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Two Stat Cards */}
                <div className="grid grid-cols-2 gap-2.5 my-2.5">
                  <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <FlaskConical className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-black text-emerald-950 leading-tight">0.00%</span>
                      <span className="block text-[10px] font-medium text-slate-500 leading-tight truncate">Synthetic Pesticides</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Sprout className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-black text-emerald-950 leading-tight">100%</span>
                      <span className="block text-[10px] font-medium text-slate-500 leading-tight truncate">Living Soil Tested</span>
                    </div>
                  </div>
                </div>

                {/* Checklist Rows */}
                <div className="space-y-1.5 my-2.5">
                  <div className="flex items-center justify-between py-1 text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-emerald-600 fill-emerald-600/30 shrink-0" />
                      <span>Non-GMO Heirloom Seeds</span>
                    </div>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      Certified
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 text-xs font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4 text-emerald-600 fill-emerald-600/30 shrink-0" />
                      <span>Artificial Ripening Agents</span>
                    </div>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      Zero Used
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom: Headline, Subtitle & Action */}
              <div className="mt-3 pt-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  Purity You Can Taste,<br />
                  <span className="text-emerald-600">Guaranteed.</span>
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 font-medium leading-relaxed mb-4">
                  Every vegetable and fruit is grown naturally without artificial ripeners or toxic sprays.
                </p>

                <Link
                  to="/about"
                  className="inline-flex items-center justify-between w-full px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all active:scale-[0.98]"
                >
                  <span>Explore Organic Sourcing</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* ========================================================
                CARD 2: Farm-to-Fork Passport (Light UI)
               ======================================================== */}
            <div className="flex-shrink-0 w-[310px] sm:w-[370px] lg:w-auto relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-emerald-100/90 bg-white text-slate-900 p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_14px_40px_rgba(16,185,129,0.08)] transition-all">
              <div>
                {/* Header: Badges */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/90 text-emerald-800 text-xs font-black tracking-wide">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>FARM-TO-FORK PASSPORT</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>LIVE BATCH</span>
                  </span>
                </div>

                {/* Clamshell Produce Box */}
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-emerald-50/30 border border-emerald-100/80 my-2.5">
                  <div className="relative w-20 h-20 rounded-2xl bg-white p-1 flex items-center justify-center shrink-0 shadow-xs border border-emerald-100 overflow-hidden">
                    <img
                      src="/assets/features/clamshell_qr_produce.jpg"
                      alt="Fresh produce with QR code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1 text-xs">
                    <div className="flex items-center gap-2 text-slate-900 font-bold truncate">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">Nashik Plot 4B (Patil Co-op)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 font-semibold truncate">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">Harvested: Today 04:30 AM</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 font-semibold truncate">
                      <Snowflake className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">Cold Chain: <strong className="text-emerald-600 font-black">4.2°C Continuous</strong></span>
                    </div>
                  </div>
                </div>

                {/* Timeline Pipeline */}
                <div className="relative my-4 px-2">
                  {/* Connecting Line */}
                  <div className="absolute top-[32px] left-[18%] right-[18%] h-0.5 bg-emerald-500 z-0" />

                  <div className="relative z-10 grid grid-cols-3 text-center">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-black text-slate-900 mb-1">04:30 AM</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                        <Sprout className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 mt-1">Harvested</span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-black text-slate-900 mb-1">05:15 AM</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                        <Truck className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 mt-1">Cold Hub</span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-black text-slate-900 mb-1">06:00 AM</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 mt-1">QC Passed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Headline, Subtitle & Action */}
              <div className="mt-3 pt-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  Pure Through<br />
                  <span className="text-emerald-600">Traceability</span>
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 font-medium leading-relaxed mb-4">
                  Scan any packet with your phone camera to see the farmer's name, farm location, and harvest log.
                </p>

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="inline-flex items-center justify-between w-full px-5 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 text-xs sm:text-sm font-bold border border-emerald-200/80 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ScanLine className="w-4 h-4 text-emerald-700" />
                    <span>Simulate Live QR Scan</span>
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ========================================================
                CARD 3: 24-Point Lab Tested (Light UI)
               ======================================================== */}
            <div className="flex-shrink-0 w-[310px] sm:w-[370px] lg:w-auto relative flex flex-col justify-between overflow-hidden rounded-[32px] border border-emerald-100/90 bg-white text-slate-900 p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_14px_40px_rgba(16,185,129,0.08)] transition-all">
              <div>
                {/* Header: Badges */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/90 text-emerald-800 text-xs font-black tracking-wide">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>CERTIFIED LAB SAFETY</span>
                  </span>

                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    ISO 17025
                  </span>
                </div>

                {/* Circular Gauge & Score Box */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/30 border border-emerald-100/80 my-2.5">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
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
                      <span className="absolute text-xs font-black text-slate-900">99.8%</span>
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 leading-tight">Purity Index Score</div>
                      <div className="text-xs text-emerald-600 font-bold mt-0.5">Grade A+ (Safe)</div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-black">
                    <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" />
                    <span>PASSED</span>
                  </span>
                </div>

                {/* 4 Laboratory Parameters */}
                <div className="space-y-2.5 my-3 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Pesticide Residue</span>
                    </div>
                    <span className="font-extrabold text-emerald-700">0.00 ppm (Clean)</span>
                  </div>

                  <div className="flex items-center justify-between font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Heavy Metals (Lead/Arsenic)</span>
                    </div>
                    <span className="font-extrabold text-emerald-700">Not Detected</span>
                  </div>

                  <div className="flex items-center justify-between font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <Cog className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Microbial / Pathogen Safety</span>
                    </div>
                    <span className="font-extrabold text-emerald-700">100% Certified</span>
                  </div>

                  <div className="flex items-center justify-between font-semibold text-slate-700">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Water Purity & Living Soil</span>
                    </div>
                    <span className="font-extrabold text-emerald-700">100% Certified</span>
                  </div>
                </div>
              </div>

              {/* Bottom: Headline, Subtitle & Action */}
              <div className="mt-3 pt-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  24-Point <span className="text-emerald-600">Lab Tested</span>
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 font-medium leading-relaxed mb-4">
                  Every batch undergoes strict chromatographic chemical analysis in accredited labs.
                </p>

                <Link
                  to="/about"
                  className="inline-flex items-center justify-between w-full px-5 py-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 text-xs sm:text-sm font-bold border border-emerald-200/80 transition-all active:scale-[0.98]"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>View Lab Certificate #GG-2026</span>
                  </span>
                  <ArrowRight className="w-4 h-4" />
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
