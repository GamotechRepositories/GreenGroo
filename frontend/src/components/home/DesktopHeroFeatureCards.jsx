import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, QrCode, CheckCircle2, ShieldCheck, X } from "lucide-react";

export default function DesktopHeroFeatureCards() {
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  const cards = [
    {
      id: "farmer",
      image: "/assets/features/meet-farmer.jpg",
      title: "Meet Your Farmer",
      subtitle: "Know Who Grows Your Food",
      description: "Discover the authentic story and care behind every fresh harvest.",
      btnText: "Farmer Profile",
      tag: "100% Direct",
      link: "/about",
    },
    {
      id: "scan",
      image: "/assets/features/scan-qr.jpg",
      title: "Scan & Know",
      subtitle: "Farm-to-Fork Traceability",
      description: "Scan QR to verify harvest date, packing & safety standards.",
      btnText: "Scan QR Code",
      tag: "Verified Safe",
      onClick: () => setShowQrModal(true),
    },
    {
      id: "track",
      image: "/assets/features/track-order.jpg",
      title: "Track Your Order",
      subtitle: "Live Delivery Journey",
      description: "Follow your order step-by-step from farms straight to your door.",
      btnText: "Track My Order",
      tag: "Live GPS",
      link: "/orders",
    },
  ];

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, offsetWidth } = scrollRef.current;
    if (offsetWidth > 0) {
      const cardWidth = offsetWidth * 0.82;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(Math.max(index, 0), cards.length - 1));
    }
  };

  const scrollToIndex = (index) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.offsetWidth * 0.82;
    scrollRef.current.scrollTo({
      left: index * cardWidth,
      behavior: "smooth",
    });
    setActiveIndex(index);
  };

  return (
    <>
      <section className="w-full my-1 sm:my-2.5 lg:my-3.5">
        {/* Horizontal Snap Scroll on Mobile / 3-Column Grid on Desktop */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="hide-scrollbar flex gap-2.5 overflow-x-auto scroll-smooth snap-x snap-mandatory -mx-3.5 px-3.5 pb-1 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-3.5 lg:gap-4 md:overflow-visible md:snap-none"
        >
          {cards.map((card) => {
            const cardContent = (
              <div className="relative flex items-stretch bg-white border border-gray-200/90 hover:border-emerald-600 rounded-xl overflow-hidden transition-all duration-150 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-sm active:scale-[0.99] h-full">
                {/* Left Side: Full-bleed Photo (No side padding) */}
                <div className="relative w-28 sm:w-36 md:w-36 lg:w-40 xl:w-44 shrink-0 overflow-hidden bg-gray-50 self-stretch">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Right Side: Text & Action Button */}
                <div className="flex-1 min-w-0 p-2.5 sm:p-3 lg:p-3.5 flex flex-col justify-between self-stretch">
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <h3 className="text-[12.5px] sm:text-[13.5px] lg:text-[15px] font-bold text-gray-900 tracking-tight leading-tight truncate">
                        {card.title}
                      </h3>
                      <span className="shrink-0 text-[9px] sm:text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100/80 px-1.5 py-0.2 rounded-full">
                        {card.tag}
                      </span>
                    </div>
                    <span className="text-[10.5px] sm:text-[11.5px] font-semibold text-emerald-700 mt-0.5 leading-tight truncate block">
                      {card.subtitle}
                    </span>
                    <p className="text-[10px] sm:text-[11px] lg:text-[12px] text-gray-500 mt-0.5 leading-snug line-clamp-1 lg:line-clamp-2">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-1 sm:mt-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0C831F] hover:bg-[#0A6C19] text-white text-[10px] sm:text-[11px] font-semibold transition-colors duration-150">
                      <span>{card.btnText}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );

            if (card.link) {
              return (
                <Link
                  key={card.id}
                  to={card.link}
                  className="block no-underline shrink-0 w-[82vw] max-w-[315px] snap-start md:w-auto md:max-w-none md:shrink"
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <div
                key={card.id}
                onClick={card.onClick}
                role="button"
                tabIndex={0}
                className="shrink-0 w-[82vw] max-w-[315px] snap-start md:w-auto md:max-w-none md:shrink"
              >
                {cardContent}
              </div>
            );
          })}
        </div>

        {/* Slide Indicator Dots (Mobile Only) */}
        <div className="flex md:hidden items-center justify-center gap-1.5 mt-1.5">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              type="button"
              onClick={() => scrollToIndex(idx)}
              className={`h-1 rounded-full transition-all duration-300 ${
                activeIndex === idx
                  ? "w-4 bg-[#0C831F]"
                  : "w-1 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
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
