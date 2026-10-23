import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MID_BANNERS = [
  {
    id: "banner-1",
    image: "/assets/payment/image.png",
    alt: "Fresh Fruits & Vegetables - Naturally Grown. Farm Fresh. Healthier You.",
    link: "/product",
  },
  {
    id: "banner-2",
    image: "/assets/payment/image2.png",
    alt: "Farm Fresh - Fresh Fruits & Vegetables - Naturally Grown. Healthier Choices. Direct from Farms.",
    link: "/product",
  },
];

export default function HomeMidBannerSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Auto-slide every 4 seconds when not hovered
  useEffect(() => {
    if (isHovered) return undefined;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MID_BANNERS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isHovered]);

  const handlePrev = (e) => {
    if (e) e.preventDefault();
    setCurrentIndex(
      (prev) => (prev - 1 + MID_BANNERS.length) % MID_BANNERS.length
    );
  };

  const handleNext = (e) => {
    if (e) e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % MID_BANNERS.length);
  };

  // Touch Swipe Handlers for mobile
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
    <section className="px-2 py-2 sm:px-3 lg:px-0 lg:py-4">
      <div
        className="group relative w-full overflow-hidden rounded-xl sm:rounded-2xl select-none shadow-xs"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Sliding Track */}
        <div
          className="flex w-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {MID_BANNERS.map((banner, index) => (
            <div key={banner.id} className="w-full shrink-0">
              <Link to={banner.link} className="block w-full">
                <img
                  src={banner.image}
                  alt={banner.alt}
                  loading={index === 0 ? "eager" : "lazy"}
                  className="w-full h-auto object-cover block rounded-xl sm:rounded-2xl cursor-pointer hover:opacity-98 transition-opacity"
                />
              </Link>
            </div>
          ))}
        </div>

        {/* Previous Button (Desktop) */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous Banner"
          className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-white/85 hover:bg-white text-gray-800 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-gray-800" />
        </button>

        {/* Next Button (Desktop) */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next Banner"
          className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-white/85 hover:bg-white text-gray-800 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 cursor-pointer"
        >
          <ChevronRight className="w-5 h-5 text-gray-800" />
        </button>

        {/* Pagination Dots */}
        <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/25 backdrop-blur-xs px-2.5 py-1 rounded-full">
          {MID_BANNERS.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                idx === currentIndex
                  ? "w-6 h-1.5 sm:h-2 bg-white shadow-sm"
                  : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/60 hover:bg-white/90"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
