import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  QrCode,
  ShieldCheck,
  X,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Thermometer,
  FileCheck2,
  CheckCircle2,
  ScanLine,
  Sprout,
  Check,
  Award,
} from "lucide-react";

export default function TrustFeatureBanners() {
  const [showQrModal, setShowQrModal] = useState(false);

  return (
    <>
      <section className="w-full py-4 sm:py-6 bg-transparent select-none">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1 lg:grid lg:grid-cols-3">
            {/* ========================================================
                CARD 1: 100% Certified Organic (Space Fully Utilized)
               ======================================================== */}
            <div className="flex-shrink-0 w-[310px] sm:w-[370px] lg:w-auto relative flex flex-col justify-between overflow-hidden rounded-3xl border border-emerald-500/30 bg-[#04190e] text-white p-5 sm:p-6 shadow-xl shadow-black/30">
              {/* Full-bleed Background Image with Multi-stop Mask */}
              <div className="absolute inset-0 z-0">
                <img
                  src="/assets/features/organic_soil_sprout.jpg"
                  alt="Organic Living Soil and Seedling"
                  className="w-full h-full object-cover object-center opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#04190e] via-[#04190e]/90 to-[#04190e]/65" />
              </div>

              {/* Card Header: Floating Badges */}
              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-[11px] font-black tracking-wider shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% CERTIFIED ORGANIC</span>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-950/80 backdrop-blur-md text-[8.5px] font-black text-emerald-300 text-center leading-tight">
                  JAIVIK<br />BHARAT
                </div>
              </div>

              {/* Middle Section: Living Soil & Natural Standards Grid */}
              <div className="relative z-10 my-2 space-y-2.5">
                <div className="p-3.5 rounded-2xl bg-black/60 backdrop-blur-md border border-emerald-500/25 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Sprout className="w-4 h-4 text-emerald-400" />
                      <span>Natural Cultivation Standard</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      NPOP Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex flex-col p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/20">
                      <span className="text-emerald-400 font-black text-base">0.00%</span>
                      <span className="text-neutral-300 text-[10px] font-medium leading-tight mt-0.5">Synthetic Pesticides</span>
                    </div>
                    <div className="flex flex-col p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/20">
                      <span className="text-emerald-400 font-black text-base">100%</span>
                      <span className="text-neutral-300 text-[10px] font-medium leading-tight mt-0.5">Living Soil Tested</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Non-GMO Heirloom Seeds</span>
                      </span>
                      <span className="font-bold text-emerald-300">Certified</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Artificial Ripening Agents</span>
                      </span>
                      <span className="font-bold text-emerald-300">Zero Used</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Headline, Text & Aligned CTA */}
              <div className="relative z-10 mt-3 pt-1">
                <h3 className="text-xl sm:text-[22px] font-black text-white tracking-tight leading-tight mb-1.5">
                  Purity You Can Taste, Guaranteed.
                </h3>
                <p className="text-xs text-emerald-100/75 font-medium leading-relaxed mb-4">
                  Every vegetable and fruit is grown naturally without artificial ripeners or toxic sprays.
                </p>

                <Link
                  to="/about"
                  className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/50 transition-all active:scale-[0.98]"
                >
                  <span>Explore Organic Sourcing</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* ========================================================
                CARD 2: Live Traceability (Space Fully Utilized)
               ======================================================== */}
            <div className="flex-shrink-0 w-[310px] sm:w-[370px] lg:w-auto relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-b from-[#031d16] via-[#052b20] to-[#02130e] border border-teal-500/30 text-white p-5 sm:p-6 shadow-xl shadow-black/30">
              {/* Scanline Animation */}
              <style>{`
                @keyframes scannerLaser {
                  0% { top: 8%; opacity: 0.8; }
                  50% { top: 90%; opacity: 1; }
                  100% { top: 8%; opacity: 0.8; }
                }
                .animate-laser {
                  animation: scannerLaser 3s ease-in-out infinite;
                }
              `}</style>

              {/* Card Header: Live Passport Badge */}
              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-950/80 backdrop-blur-md border border-teal-400/40 text-teal-300 text-[11px] font-black tracking-wider shadow-sm">
                  <QrCode className="w-3.5 h-3.5 text-teal-400" />
                  <span>FARM-TO-FORK PASSPORT</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[9.5px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE BATCH</span>
                </div>
              </div>

              {/* Middle Section: Full Digital Passport Console (Space Fully Utilized) */}
              <div className="relative z-10 my-2">
                <div className="p-3.5 rounded-2xl bg-black/60 backdrop-blur-md border border-teal-500/30 space-y-2.5">
                  {/* Top row: QR box + Farmer & Farm Origin */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
                      <div className="animate-laser absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-teal-500 to-transparent shadow-[0_0_8px_rgba(20,184,166,1)] z-10 pointer-events-none" />
                      <img
                        src="/assets/features/traceability_phone_qr.jpg"
                        alt="QR Code"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    <div className="flex flex-col gap-1 min-w-0 flex-1 text-[11px]">
                      <div className="flex items-center gap-1.5 text-teal-200 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span className="truncate">Nashik Plot 4B (Patil Co-op)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                        <Clock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>Harvest: Today 04:30 AM</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                        <Thermometer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Cold Chain: 4.2°C Continuous</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Progress Pipeline Steps */}
                  <div className="pt-2 border-t border-teal-500/20">
                    <div className="grid grid-cols-3 gap-1 text-[10px] text-center">
                      <div className="bg-teal-950/60 border border-teal-500/25 rounded-lg py-1 px-1.5">
                        <span className="text-teal-400 font-bold block">04:30 AM</span>
                        <span className="text-neutral-300 text-[9px]">Harvested</span>
                      </div>
                      <div className="bg-teal-950/60 border border-teal-500/25 rounded-lg py-1 px-1.5">
                        <span className="text-teal-400 font-bold block">05:15 AM</span>
                        <span className="text-neutral-300 text-[9px]">Cold Hub</span>
                      </div>
                      <div className="bg-emerald-950/70 border border-emerald-500/35 rounded-lg py-1 px-1.5">
                        <span className="text-emerald-400 font-bold block">06:00 AM</span>
                        <span className="text-emerald-300 text-[9px]">QC Passed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Headline, Text & Aligned CTA */}
              <div className="relative z-10 mt-3 pt-1">
                <h3 className="text-xl sm:text-[22px] font-black text-white tracking-tight leading-tight mb-1.5">
                  Pure Through Traceability
                </h3>
                <p className="text-xs text-teal-100/75 font-medium leading-relaxed mb-4">
                  Scan any packet with your phone camera to see the farmer's name, farm location, and harvest log.
                </p>

                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-950/50 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <ScanLine className="w-4 h-4 text-teal-200" />
                    <span>Simulate Live QR Scan</span>
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ========================================================
                CARD 3: Lab Tested Safety (Space Fully Utilized)
               ======================================================== */}
            <div className="flex-shrink-0 w-[310px] sm:w-[370px] lg:w-auto relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-b from-[#021815] via-[#04251e] to-[#01110e] border border-emerald-400/30 text-white p-5 sm:p-6 shadow-xl shadow-black/30">
              {/* Card Header: Lab Badge */}
              <div className="relative z-10 flex items-center justify-between mb-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-[11px] font-black tracking-wider shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CERTIFIED LAB SAFETY</span>
                </div>

                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  ISO 17025
                </span>
              </div>

              {/* Middle Section: Full Laboratory Console (Space Fully Utilized) */}
              <div className="relative z-10 my-2">
                <div className="p-3.5 rounded-2xl bg-black/60 backdrop-blur-md border border-emerald-500/25 space-y-2.5">
                  {/* Gauge Header */}
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <circle
                            cx="18"
                            cy="18"
                            r="15"
                            className="text-emerald-950 stroke-current"
                            strokeWidth="3.5"
                            fill="none"
                          />
                          <circle
                            cx="18"
                            cy="18"
                            r="15"
                            className="text-emerald-400 stroke-current"
                            strokeWidth="3.5"
                            strokeDasharray="94.2"
                            strokeDashoffset="2"
                            strokeLinecap="round"
                            fill="none"
                          />
                        </svg>
                        <span className="absolute text-[10px] font-black text-white">99.8%</span>
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">Purity Index Score</div>
                        <div className="text-[10px] text-emerald-300 font-semibold">Grade A+ (Safe)</div>
                      </div>
                    </div>

                    <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[9.5px] font-black">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>PASSED</span>
                    </span>
                  </div>

                  {/* 4 Laboratory Parameter Tracks */}
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300">Pesticide Residue</span>
                      <span className="font-bold text-emerald-300">0.00 ppm (Clean)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300">Heavy Metals (Lead/Arsenic)</span>
                      <span className="font-bold text-emerald-300">Not Detected</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300">Microbial / Pathogen Safety</span>
                      <span className="font-bold text-emerald-300">100% Certified</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300">Water Purity & Living Soil</span>
                      <span className="font-bold text-emerald-300">100% Certified</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Headline, Text & Aligned CTA */}
              <div className="relative z-10 mt-3 pt-1">
                <h3 className="text-xl sm:text-[22px] font-black text-white tracking-tight leading-tight mb-1.5">
                  24-Point Lab Tested
                </h3>
                <p className="text-xs text-emerald-100/75 font-medium leading-relaxed mb-4">
                  Every batch undergoes strict chromatographic chemical analysis in accredited labs.
                </p>

                <Link
                  to="/about"
                  className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/50 transition-all active:scale-[0.98]"
                >
                  <span className="flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-emerald-200" />
                    <span>View Lab Certificate #GG-2026</span>
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Traceability Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0a2318] text-white rounded-3xl shadow-2xl p-6 overflow-hidden border border-emerald-500/30">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-white">
                  Live Farm-to-Fork Passport
                </h4>
                <p className="text-xs text-emerald-400 font-medium">
                  Batch #GG-NASHIK-9842 • Verified
                </p>
              </div>
            </div>

            <div className="my-4 p-4 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-3">
              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Nashik Farmers Collective:</strong>
                  <p className="text-neutral-300 mt-0.5">Plot 4B, Dindori, Nashik (Suresh Patil & Co-op)</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Harvest Timestamp:</strong>
                  <p className="text-neutral-300 mt-0.5">Today at 04:30 AM (Sun-ripened, hand-picked)</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Lab Safety Check:</strong>
                  <p className="text-neutral-300 mt-0.5">0.00% Pesticides Detected • Soil Certified Pure</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/50 cursor-pointer"
            >
              Close Verification
            </button>
          </div>
        </div>
      )}
    </>
  );
}
