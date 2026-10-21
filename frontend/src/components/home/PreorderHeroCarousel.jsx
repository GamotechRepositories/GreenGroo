import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

export const PREORDER_BANNERS = [
  {
    id: "banner-1",
    desktopImage: "/assets/payment/heroBaner.png",
    mobileImage: "/assets/payment/heroMobileBaner.png",
    alt: "शेतकऱ्यांच्या मेहनतीतून, तुमच्या कुटुंबाच्या ताटापर्यंत!",
    link: "/product",
  },
  {
    id: "banner-2",
    desktopImage: "/assets/payment/heroBaner2.png",
    mobileImage: "/assets/payment/heroBaner2.png",
    alt: "शुद्ध, ताजे आणि नैसर्गिक उत्पादन — शेतकऱ्यांच्या मेहनतीतून, तुमच्यासाठी!",
    link: "/product",
  },
];

export default function PreorderHeroCarousel({ isMobile = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Auto rotate banners every 4.5s when playing and not hovered
  useEffect(() => {
    if (!isPlaying || isHovered) return undefined;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PREORDER_BANNERS.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPlaying, isHovered]);

  const handlePrev = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentIndex(
      (prev) => (prev - 1 + PREORDER_BANNERS.length) % PREORDER_BANNERS.length
    );
  };

  const handleNext = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % PREORDER_BANNERS.length);
  };

  const togglePlayPause = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsPlaying((prev) => !prev);
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
    <div
      className="group relative w-full overflow-hidden bg-white rounded-none select-none"
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
        {PREORDER_BANNERS.map((banner, index) => {
          const imageSrc = isMobile ? banner.mobileImage : banner.desktopImage;
          return (
            <div key={banner.id} className="w-full shrink-0">
              <Link to={banner.link} className="block w-full">
                <img
                  src={imageSrc}
                  alt={banner.alt}
                  loading={index === 0 ? "eager" : "lazy"}
                  className="block w-full h-auto object-cover object-center rounded-none cursor-pointer"
                />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Bottom Left Navigation Bar: Pause/Play + Prev/Next Controls */}
      <div className="absolute bottom-2.5 left-3 sm:bottom-4 sm:left-6 lg:left-8 z-20 flex items-center">
        <div className="flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-md px-2 py-1 text-white shadow-lg border border-white/20 transition-all hover:bg-black/70">
          {/* Pause / Play Button */}
          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause auto slide" : "Play auto slide"}
            title={isPlaying ? "Pause" : "Play"}
            className="flex h-6 w-6 items-center justify-center rounded-full text-white/90 hover:text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="h-3 w-3 fill-current" />
            ) : (
              <Play className="h-3 w-3 fill-current ml-0.5" />
            )}
          </button>

          <div className="h-3.5 w-px bg-white/25 mx-0.5" aria-hidden="true" />

          {/* Left Arrow (Prev) */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous slide"
            title="Previous"
            className="flex h-6 w-6 items-center justify-center rounded-full text-white/90 hover:text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5 stroke-[2.5]" />
          </button>

          {/* Slide Counter */}
          <span className="text-[10.5px] sm:text-[11px] font-bold text-white/95 tabular-nums px-1 select-none">
            {currentIndex + 1}/{PREORDER_BANNERS.length}
          </span>

          {/* Right Arrow (Next) */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next slide"
            title="Next"
            className="flex h-6 w-6 items-center justify-center rounded-full text-white/90 hover:text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
          >
            <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Pagination Indicators (Right / Center) */}
      <div className="absolute bottom-2.5 sm:bottom-4 right-3 sm:right-6 lg:right-8 flex items-center gap-1.5 z-10">
        {PREORDER_BANNERS.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              idx === currentIndex
                ? "w-6 h-1.5 sm:h-2 bg-white shadow-sm"
                : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
