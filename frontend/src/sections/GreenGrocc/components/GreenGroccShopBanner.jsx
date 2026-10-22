import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";

export const GREENGROCC_SHOP_BANNERS = [
  {
    id: "gg-banner-18",
    image: "/assets/payment/category_banner_1.png",
    alt: "Featured Special Banner 1",
    link: "/product",
  },
  {
    id: "gg-banner-14",
    image: "/assets/payment/category_banner_2.png",
    alt: "Featured Special Banner 2",
    link: "/product",
  },
  {
    id: "gg-banner-15",
    image: "/assets/payment/category_banner_3.png",
    alt: "Featured Special Banner 3",
    link: "/product",
  },
  {
    id: "gg-banner-16",
    image: "/assets/payment/category_banner_4.png",
    alt: "Featured Special Banner 4",
    link: "/product",
  },
  {
    id: "gg-banner-17",
    image: "/assets/payment/category_banner_5.png",
    alt: "Featured Special Banner 5",
    link: "/product",
  },
];

export function GreenGroccShopBanner() {
  const [searchParams] = useSearchParams();
  const currentStore = searchParams.get("store");
  const storeQuery = currentStore ? `?store=${encodeURIComponent(currentStore)}` : "";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Auto rotate banners every 4 seconds when not hovered
  useEffect(() => {
    if (isHovered) return undefined;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % GREENGROCC_SHOP_BANNERS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isHovered]);

  const handlePrev = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setCurrentIndex(
      (prev) => (prev - 1 + GREENGROCC_SHOP_BANNERS.length) % GREENGROCC_SHOP_BANNERS.length
    );
  };

  const handleNext = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setCurrentIndex((prev) => (prev + 1) % GREENGROCC_SHOP_BANNERS.length);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <div
      className="group relative mb-3.5 w-full overflow-hidden rounded-2xl shadow-xs border border-emerald-900/10 bg-[#fbf9f4] select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sliding Track */}
      <div
        className="flex w-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {GREENGROCC_SHOP_BANNERS.map((banner, index) => {
          const targetLink = currentStore ? `/product${storeQuery}` : banner.link;
          return (
            <div key={banner.id} className="w-full shrink-0">
              <Link to={targetLink} className="block w-full">
                <img
                  src={banner.image}
                  alt={banner.alt}
                  className="w-full h-auto object-cover object-center rounded-2xl block hover:opacity-95 transition-opacity"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows (Visible on Desktop hover) */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Previous banner"
        className="hidden sm:flex absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md z-10 cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Next banner"
        className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md z-10 cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Slide Indicators / Dots */}
      <div className="absolute bottom-2 sm:bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {GREENGROCC_SHOP_BANNERS.map((banner, index) => (
          <button
            key={banner.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex(index);
            }}
            aria-label={`Go to slide ${index + 1}`}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              currentIndex === index
                ? "w-6 h-1.5 bg-emerald-600 shadow-xs"
                : "w-1.5 h-1.5 bg-white/70 hover:bg-white shadow-xs"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default GreenGroccShopBanner;
