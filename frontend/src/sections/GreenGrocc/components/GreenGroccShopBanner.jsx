import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";

/** Rotating shop banner; `banners` come from admin → Banners (see ShopTopSlidingBanners). */
export function GreenGroccShopBanner({
  matchOfferSizeOnMobile = false,
  banners = [],
} = {}) {
  const [searchParams] = useSearchParams();
  const currentStore = searchParams.get("store");
  const storeQuery = currentStore ? `?store=${encodeURIComponent(currentStore)}` : "";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Auto rotate banners every 4 seconds when not hovered
  useEffect(() => {
    if (isHovered || banners.length < 2) return undefined;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isHovered, banners.length]);

  const handlePrev = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setCurrentIndex(
      (prev) => (prev - 1 + banners.length) % banners.length
    );
  };

  const handleNext = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setCurrentIndex((prev) => (prev + 1) % banners.length);
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

  if (!banners.length) return null;
  const activeIndex = currentIndex % banners.length;

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
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {banners.map((banner, index) => {
          const isDefaultLink = !banner.link || banner.link === "/product";
          const targetLink = currentStore && isDefaultLink ? `/product${storeQuery}` : banner.link;
          return (
            <div key={banner.id} className="w-full shrink-0">
              <Link to={targetLink} className="block w-full">
                <img
                  src={banner.image}
                  alt={banner.alt}
                  className={`block w-full rounded-2xl object-cover transition-opacity hover:opacity-95 ${
                    matchOfferSizeOnMobile
                      ? "aspect-[1024/342] object-left lg:aspect-auto lg:h-auto lg:object-center"
                      : "h-auto object-center"
                  }`}
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
        {banners.map((banner, index) => (
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
              activeIndex === index
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
