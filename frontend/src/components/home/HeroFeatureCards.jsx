import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, QrCode, CheckCircle2, ShieldCheck, X, Users, MapPin, Calendar, Sparkles } from "lucide-react";

export default function HeroFeatureCards({ className = "" }) {
  const [showQrModal, setShowQrModal] = useState(false);
  const [showFarmerModal, setShowFarmerModal] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  const cards = [
    {
      id: "farmer",
      image: "/assets/features/farmer_portrait_pro.jpg",
      title: "Meet Your Farmer",
      subtitle: "शेतकऱ्यांना भेटा",
      description: "प्रत्येक उत्पादनामागील खरी कहाणी जाणून घ्या.",
      btnText: "शेतकरी प्रोफाईल",
      onClick: () => setShowFarmerModal(true),
    },
    {
      id: "scan",
      image: "/assets/features/scan-qr.jpg",
      title: "Scan & Know",
      subtitle: "उत्पादनाची खरी माहिती",
      description: "QR स्कॅन करा आणि कापणी, पॅकिंग, गुणवत्ता पहा.",
      btnText: "QR स्कॅन करा",
      onClick: () => setShowQrModal(true),
    },
    {
      id: "track",
      image: "/assets/features/track-order.jpg",
      title: "Track Your Order",
      subtitle: "ऑर्डरचा मागोवा घ्या",
      description: "शेतापासून तुमच्या घरापर्यंत संपूर्ण प्रवास पाहा.",
      btnText: "माझा ऑर्डर ट्रॅक करा",
      link: "/orders",
    },
  ];

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, offsetWidth } = scrollRef.current;
    if (offsetWidth > 0) {
      const cardWidth = offsetWidth * 0.85;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(Math.max(index, 0), cards.length - 1));
    }
  };

  const scrollToIndex = (index) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.offsetWidth * 0.85;
    scrollRef.current.scrollTo({
      left: index * cardWidth,
      behavior: "smooth",
    });
    setActiveIndex(index);
  };

  return (
    <>
      <section className={`w-full py-2 sm:py-3.5 ${className}`}>
        {/* Responsive Layout: Smooth snap carousel on mobile / 3-column grid on desktop */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="hide-scrollbar flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory -mx-3 px-3 pb-1 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:gap-3.5 lg:gap-4 md:overflow-visible md:snap-none"
        >
          {cards.map((card) => {
            const cardInner = (
              <div className="relative flex items-center bg-[#f4faf6] border border-[#d2ead7] hover:border-[#0a6c38]/60 hover:bg-[#eef8f1] rounded-2xl p-2.5 sm:p-3 lg:p-3.5 transition-all duration-200 cursor-pointer shadow-[0_2px_6px_rgba(10,108,56,0.04)] hover:shadow-md active:scale-[0.99] h-full">
                {/* Left Side: Thumbnail Photo */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 shrink-0 rounded-xl overflow-hidden border border-[#c3e3cb] bg-white shadow-xs">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Right Side: Text & Green Pill Action Button */}
                <div className="flex-1 min-w-0 pl-3 sm:pl-3.5 flex flex-col justify-between self-stretch py-0.5">
                  <div>
                    <h3 className="text-[13px] sm:text-[14.5px] lg:text-[16px] font-extrabold text-[#113821] tracking-tight leading-tight truncate">
                      {card.title}
                    </h3>
                    <p className="text-[11.5px] sm:text-[12.5px] lg:text-[13.5px] font-bold text-[#0a6c38] mt-0.5 leading-snug truncate">
                      {card.subtitle}
                    </p>
                    <p className="text-[10px] sm:text-[11px] lg:text-[11.5px] text-gray-600 mt-1 leading-snug line-clamp-2">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-2 sm:mt-2.5">
                    <span className="inline-flex items-center gap-1 px-3 py-1 sm:py-1.5 rounded-full bg-[#0a6c38] hover:bg-[#07522a] text-white text-[10px] sm:text-[11px] font-semibold transition-all duration-150 shadow-xs">
                      <span>{card.btnText}</span>
                      <ArrowRight className="w-3 h-3 shrink-0" />
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
                  className="block no-underline shrink-0 w-[85vw] max-w-[330px] snap-start md:w-auto md:max-w-none md:shrink"
                >
                  {cardInner}
                </Link>
              );
            }

            return (
              <div
                key={card.id}
                onClick={card.onClick}
                role="button"
                tabIndex={0}
                className="shrink-0 w-[85vw] max-w-[330px] snap-start md:w-auto md:max-w-none md:shrink"
              >
                {cardInner}
              </div>
            );
          })}
        </div>

        {/* Mobile Dot Indicators */}
        <div className="flex md:hidden items-center justify-center gap-1.5 mt-2">
          {cards.map((card, idx) => (
            <button
              key={card.id}
              type="button"
              onClick={() => scrollToIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === idx
                  ? "w-5 bg-[#0a6c38]"
                  : "w-1.5 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Meet Your Farmer Modal */}
      {showFarmerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-5 sm:p-6 overflow-hidden border border-[#d2ead7] animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowFarmerModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#eaf7ee] text-[#0a6c38]">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-lg text-gray-900 leading-tight">शेतकऱ्यांना भेटा (Meet Our Farmers)</h4>
                <p className="text-xs text-[#0a6c38] font-semibold">100% Direct From Local Organic Farmers</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {/* Farmer 1 */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#f7fbf8] border border-[#dceddf]">
                <img
                  src="/assets/features/farmer_portrait_pro.jpg"
                  alt="Tukaram Shinde"
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#0a6c38]/40 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-sm text-gray-900">तुकाराम शिंदे (Tukaram Shinde)</h5>
                    <span className="text-[10px] font-semibold text-[#0a6c38] bg-[#eaf7ee] px-2 py-0.5 rounded-full">सेंद्रिय शेती</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0a6c38]" />
                    <span>सातारा (Satara, Maharashtra)</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">पालक, मेथी, शेपू आणि देशी भाज्यांचे विशेषज्ञ (12 वर्षांचा अनुभव).</p>
                </div>
              </div>

              {/* Farmer 2 */}
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#f7fbf8] border border-[#dceddf]">
                <img
                  src="/assets/features/farmer_stories_video_banner.jpg"
                  alt="Ramesh Patil"
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#0a6c38]/40 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-sm text-gray-900">रमेश पाटील (Ramesh Patil)</h5>
                    <span className="text-[10px] font-semibold text-[#0a6c38] bg-[#eaf7ee] px-2 py-0.5 rounded-full">नैसर्गिक खत</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0a6c38]" />
                    <span>नाशिक (Nashik, Maharashtra)</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">टोमॅटो, वांगी, गाजर आणि कांदा (विना कीटकनाशक).</p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-150 flex items-center justify-between gap-3">
              <Link
                to="/about"
                onClick={() => setShowFarmerModal(false)}
                className="text-xs font-semibold text-[#0a6c38] hover:underline"
              >
                आमच्याबद्दल अधिक वाचा →
              </Link>
              <button
                onClick={() => setShowFarmerModal(false)}
                className="py-2 px-5 rounded-full bg-[#0a6c38] hover:bg-[#07522a] text-white text-xs font-semibold transition-colors shadow-xs"
              >
                समजले (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Traceability & QR Scanner Preview Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 sm:p-6 overflow-hidden border border-[#d2ead7] animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#eaf7ee] text-[#0a6c38]">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-gray-900 leading-tight">उत्पादनाची खरी माहिती (Scan & Know)</h4>
                <p className="text-xs text-[#0a6c38] font-semibold">Farm-to-Fork Live Verification</p>
              </div>
            </div>

            <div className="my-4 p-4 rounded-xl bg-[#f7fbf8] border border-[#dceddf] space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-[#0a6c38] shrink-0 mt-0.5" />
                <span>
                  <strong>थेट शेतातून कापणी (Harvest Record):</strong> प्रत्येक पॅकवर कापणीची नेमकी तारीख व वेळ नोंदवलेली असते.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-gray-700">
                <ShieldCheck className="w-4 h-4 text-[#0a6c38] shrink-0 mt-0.5" />
                <span>
                  <strong>लॅब चाचणी प्रमाणित (Lab Tested):</strong> 100% कीटकनाशक-मुक्त व नैसर्गिक शेतीची खात्री.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-gray-700">
                <Sparkles className="w-4 h-4 text-[#0a6c38] shrink-0 mt-0.5" />
                <span>
                  <strong>कसे वापरावे?</strong> तुमच्या डिलिव्हर झालेल्या पॅकवरील QR कोड स्कॅन करा आणि शेतकरी व शेताचा तपशील थेट पाहा!
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 px-4 rounded-full bg-[#0a6c38] hover:bg-[#07522a] text-white text-xs font-semibold transition-colors duration-150 shadow-xs"
              >
                समजले (Got it)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
