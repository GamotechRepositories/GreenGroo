import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  X,
  ArrowRight,
  User,
  Wheat,
  Boxes,
  Package,
  Truck,
  Home as HomeIcon,
} from "lucide-react";

export default function TrustFeatureBanners() {
  const [showQrModal, setShowQrModal] = useState(false);

  return (
    <>
      <section className="w-full py-4 sm:py-6 bg-transparent">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1 lg:grid lg:grid-cols-3 lg:gap-5">
            {/* ========================================================
                CARD 1: 100% Organic
               ======================================================== */}
            <div className="flex-shrink-0 w-[320px] sm:w-[380px] lg:w-auto min-h-[300px] sm:min-h-[320px] relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#1b5020] via-[#24632a] to-[#17441c] text-white p-6 shadow-sm border border-emerald-900/30">
              {/* Plant in Soil Imagery */}
              <div className="absolute right-0 top-0 bottom-0 w-[46%] overflow-hidden pointer-events-none">
                <img
                  src="/assets/features/organic_soil_sprout.jpg"
                  alt="100% Organic Sprout"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#1b5020] via-[#1b5020]/50 to-transparent" />
              </div>

              {/* Text & Checklist */}
              <div className="relative z-10 max-w-[58%] flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-2xl sm:text-[26px] font-black tracking-tight leading-tight text-white">
                    100% Organic
                  </h3>
                  <p className="text-xs sm:text-[13px] text-emerald-100/90 font-medium mt-1 mb-4 leading-snug">
                    Guaranteed Pure & Natural
                  </p>

                  <ul className="space-y-2 mb-6 text-xs sm:text-[13px] text-white font-medium">
                    <li className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/25 text-white shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span>Chemical-Free Farming</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/25 text-white shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span>Soil & Water Tested</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-white/25 text-white shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span>Naturally Grown Produce</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-white text-[#17441c] text-xs font-extrabold shadow-sm hover:bg-neutral-100 active:scale-[0.98] transition-all"
                  >
                    <span>Know More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* ========================================================
                CARD 2: Pure Through Traceability
               ======================================================== */}
            <div className="flex-shrink-0 w-[320px] sm:w-[380px] lg:w-auto min-h-[300px] sm:min-h-[320px] relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a353a] via-[#0f444a] to-[#062428] text-white p-6 shadow-sm border border-teal-900/40">
              {/* Phone Mockup Imagery with QR Code */}
              <div className="absolute right-3 top-4 bottom-16 w-[42%] overflow-hidden flex items-center justify-center pointer-events-none">
                <img
                  src="/assets/features/traceability_phone_qr.jpg"
                  alt="Traceability QR Phone Mockup"
                  className="w-full h-full object-contain object-center drop-shadow-xl"
                />
              </div>

              {/* Title & Track Now Button */}
              <div className="relative z-10 max-w-[58%]">
                <h3 className="text-2xl sm:text-[26px] font-black tracking-tight leading-tight text-white">
                  Pure Through<br />Traceability
                </h3>
                <p className="text-xs sm:text-[13px] text-teal-100/90 font-medium mt-1.5 mb-4 leading-snug">
                  Complete Food Journey on Your Mobile
                </p>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/50 text-emerald-100 hover:text-white text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Track Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom Supply Chain Timeline Pipeline */}
              <div className="relative z-10 mt-6 pt-3 border-t border-teal-500/25">
                <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-teal-100">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-5 h-5 rounded-full bg-teal-400/20 flex items-center justify-center text-teal-300">
                      <User className="w-3 h-3" />
                    </div>
                    <span className="font-semibold mt-0.5">Farmer</span>
                  </div>
                  <div className="h-[1px] flex-1 bg-teal-400/30 mx-1 mb-2.5" />
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-5 h-5 rounded-full bg-teal-400/20 flex items-center justify-center text-teal-300">
                      <Wheat className="w-3 h-3" />
                    </div>
                    <span className="font-semibold mt-0.5">Harvest</span>
                  </div>
                  <div className="h-[1px] flex-1 bg-teal-400/30 mx-1 mb-2.5" />
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-5 h-5 rounded-full bg-teal-400/20 flex items-center justify-center text-teal-300">
                      <Boxes className="w-3 h-3" />
                    </div>
                    <span className="font-semibold mt-0.5">Collection</span>
                  </div>
                  <div className="h-[1px] flex-1 bg-teal-400/30 mx-1 mb-2.5" />
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-5 h-5 rounded-full bg-teal-400/20 flex items-center justify-center text-teal-300">
                      <Package className="w-3 h-3" />
                    </div>
                    <span className="font-semibold mt-0.5">Packing</span>
                  </div>
                  <div className="h-[1px] flex-1 bg-teal-400/30 mx-1 mb-2.5" />
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-5 h-5 rounded-full bg-teal-400/20 flex items-center justify-center text-teal-300">
                      <Truck className="w-3 h-3" />
                    </div>
                    <span className="font-semibold mt-0.5">Dispatch</span>
                  </div>
                  <div className="h-[1px] flex-1 bg-teal-400/30 mx-1 mb-2.5" />
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-5 h-5 rounded-full bg-teal-400/20 flex items-center justify-center text-teal-300">
                      <HomeIcon className="w-3 h-3" />
                    </div>
                    <span className="font-semibold mt-0.5">Delivery</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================
                CARD 3: Lab Tested For Your Safety
               ======================================================== */}
            <div className="flex-shrink-0 w-[320px] sm:w-[380px] lg:w-auto min-h-[300px] sm:min-h-[320px] relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#e8ad2c] via-[#f1bd41] to-[#d69818] text-[#123114] p-6 shadow-sm border border-amber-600/30">
              {/* Microscope Scientist Imagery */}
              <div className="absolute right-0 top-0 bottom-0 w-[46%] overflow-hidden pointer-events-none">
                <img
                  src="/assets/features/lab_safety_microscope.jpg"
                  alt="Laboratory Scientist with Microscope"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#e8ad2c] via-[#e8ad2c]/50 to-transparent" />
              </div>

              {/* Text & Checklist */}
              <div className="relative z-10 max-w-[58%] flex flex-col justify-between h-full">
                <div>
                  <h3 className="text-2xl sm:text-[26px] font-black tracking-tight leading-tight text-[#143314]">
                    Lab Tested<br />For Your Safety
                  </h3>
                  <p className="text-xs sm:text-[13px] text-[#224722] font-semibold mt-1 mb-4 leading-snug">
                    Tested in Certified Laboratories
                  </p>

                  <ul className="space-y-2 mb-6 text-xs sm:text-[13px] text-[#173818] font-bold">
                    <li className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#14532d]/20 text-[#14532d] shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span>Zero Pesticide Residue</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#14532d]/20 text-[#14532d] shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span>Pure Water & Soil Check</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#14532d]/20 text-[#14532d] shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span>Microbial Safety Tested</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#14532d]/20 text-[#14532d] shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span>Quality Certified Reports</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#14532d] text-white text-xs font-extrabold shadow-sm hover:bg-[#0c391d] active:scale-[0.98] transition-all"
                  >
                    <span>View Lab Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Traceability Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 sm:p-6 overflow-hidden border border-gray-200">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-3.5 right-3.5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-[#14532d]">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-gray-900">
                  Farm-to-Fork Traceability
                </h4>
                <p className="text-xs text-[#14532d] font-medium">
                  Verified Product Origin & Journey
                </p>
              </div>
            </div>

            <div className="my-5 p-4 rounded-xl bg-gray-50 border border-gray-150 space-y-2.5">
              <div className="flex items-start gap-2 text-xs text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-[#14532d] shrink-0 mt-0.5" />
                <span>
                  <strong>100% Farm Sourced:</strong> Direct harvesting and packing data from local farmers.
                </span>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-700">
                <ShieldCheck className="w-4 h-4 text-[#14532d] shrink-0 mt-0.5" />
                <span>
                  <strong>Certified Safe:</strong> Pesticide-free, clean soil, and organic quality testing.
                </span>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-[#14532d] shrink-0 mt-0.5" />
                <span>
                  <strong>Batch Traceability:</strong> Scan the QR code on any product packet to view full harvest history.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#14532d] hover:bg-[#0c381d] text-white text-xs font-bold transition-colors duration-150 cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
