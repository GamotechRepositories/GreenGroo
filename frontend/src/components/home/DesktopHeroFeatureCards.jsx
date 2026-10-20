import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, QrCode, CheckCircle2, ShieldCheck, X } from "lucide-react";

export default function DesktopHeroFeatureCards() {
  const [showQrModal, setShowQrModal] = useState(false);

  const cards = [
    {
      id: "farmer",
      image: "/assets/features/meet-farmer.jpg",
      title: "Meet Your Farmer",
      subtitle: "Know Who Grows Your Food",
      description: "Discover the authentic story and care behind every fresh harvest.",
      btnText: "Farmer Profile",
      link: "/about",
    },
    {
      id: "scan",
      image: "/assets/features/scan-qr.jpg",
      title: "Scan & Know",
      subtitle: "Farm-to-Fork Traceability",
      description: "Scan the QR code to verify harvest date, packaging, and quality.",
      btnText: "Scan QR Code",
      onClick: () => setShowQrModal(true),
    },
    {
      id: "track",
      image: "/assets/features/track-order.jpg",
      title: "Track Your Order",
      subtitle: "Live Delivery Journey",
      description: "Follow your order step-by-step from local farms straight to your door.",
      btnText: "Track My Order",
      link: "/orders",
    },
  ];

  return (
    <>
      <section className="w-full my-2 sm:my-3.5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3.5 lg:gap-4">
          {cards.map((card) => {
            const Content = (
              <div className="relative flex items-center bg-white border border-gray-200 hover:border-emerald-600 rounded-xl p-2.5 sm:p-3 lg:p-3.5 transition-colors duration-150 cursor-pointer shadow-xs">
                {/* Left Side: Photo */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 shrink-0 rounded-lg overflow-hidden border border-gray-150 bg-gray-50">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Right Side: Text & Action Button */}
                <div className="flex-1 min-w-0 pl-3 sm:pl-3.5 lg:pl-4 flex flex-col justify-between self-stretch py-0.5">
                  <div>
                    <div className="flex flex-col">
                      <h3 className="text-[13.5px] sm:text-[14px] lg:text-[15px] font-bold text-gray-900 tracking-tight leading-tight">
                        {card.title}
                      </h3>
                      <span className="text-[11px] sm:text-[12px] font-semibold text-emerald-700 mt-0.5 leading-tight">
                        {card.subtitle}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-[11.5px] lg:text-[12px] text-gray-500 mt-1 sm:mt-1.5 leading-snug line-clamp-2">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-2 sm:mt-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-[#0C831F] hover:bg-[#0A6C19] text-white text-[11px] sm:text-[11.5px] font-semibold transition-colors duration-150">
                      <span>{card.btnText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );

            if (card.link) {
              return (
                <Link key={card.id} to={card.link} className="block no-underline">
                  {Content}
                </Link>
              );
            }

            return (
              <div key={card.id} onClick={card.onClick} role="button" tabIndex={0} className="w-full">
                {Content}
              </div>
            );
          })}
        </div>
      </section>

      {/* Traceability & QR Scanner Preview Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl p-5 sm:p-6 overflow-hidden border border-gray-200">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-3.5 right-3.5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-[#0C831F]">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-gray-900">Farm-to-Fork Traceability</h4>
                <p className="text-xs text-emerald-700 font-medium">Authentic Product Information & Verification</p>
              </div>
            </div>

            <div className="my-5 p-4 rounded-lg bg-gray-50 border border-gray-150 space-y-2.5">
              <div className="flex items-start gap-2 text-xs text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-[#0C831F] shrink-0 mt-0.5" />
                <span>
                  <strong>100% Farm Sourced:</strong> Direct harvesting and packing data from local farmers.
                </span>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-700">
                <ShieldCheck className="w-4 h-4 text-[#0C831F] shrink-0 mt-0.5" />
                <span>
                  <strong>Quality Certified:</strong> Pesticide-safe, clean, and certified organic standards.
                </span>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-[#0C831F] shrink-0 mt-0.5" />
                <span>
                  <strong>Batch & Harvest Trace:</strong> Scan the QR code on your pack to view full batch details.
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 px-4 rounded-lg bg-[#0C831F] hover:bg-[#0A6C19] text-white text-xs font-semibold transition-colors duration-150"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
