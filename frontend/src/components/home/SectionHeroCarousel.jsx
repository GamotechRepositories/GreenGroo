import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useSectionBanners } from "../../hooks/queries/useSectionBanners";

const DESKTOP_PLACEHOLDER = "aspect-[16/5]";
const MOBILE_PLACEHOLDER = "aspect-[3/2]";

/**
 * Full-width hero carousel for one store section; slides come from admin → Banners → Hero carousel.
 * Without `isMobile`, desktop slides show from `lg` up and mobile slides below it.
 */
export default function SectionHeroCarousel({ section, isMobile }) {
  const banners = useSectionBanners(section, "hero");
  const desktop = <HeroSlides slides={banners.desktop} loading={banners.isLoading} placeholder={DESKTOP_PLACEHOLDER} />;
  const mobile = <HeroSlides slides={banners.mobile} loading={banners.isLoading} placeholder={MOBILE_PLACEHOLDER} />;
  if (isMobile === undefined) {
    return (
      <>
        <div className="hidden lg:block">{desktop}</div>
        <div className="lg:hidden">{mobile}</div>
      </>
    );
  }
  return isMobile ? mobile : desktop;
}

function HeroSlides({ slides, loading, placeholder }) {
  const count = slides.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const activeIndex = count ? currentIndex % count : 0;

  // Auto rotate banners every 4.5s when not hovered
  useEffect(() => {
    if (isHovered || count < 2) return undefined;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % count);
    }, 4500);

    return () => clearInterval(interval);
  }, [isHovered, count]);

  if (!count) {
    return loading ? <div className={`w-full animate-pulse bg-emerald-50 ${placeholder}`} /> : null;
  }

  const handlePrev = () => setCurrentIndex((activeIndex - 1 + count) % count);
  const handleNext = () => setCurrentIndex((activeIndex + 1) % count);

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
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {slides.map((banner, index) => (
          <div key={banner.id} className="w-full shrink-0">
            <Link to={banner.link} className="block w-full">
              <img
                src={banner.image}
                alt={banner.alt}
                loading={index === 0 ? "eager" : "lazy"}
                className="block w-full h-auto object-cover object-center rounded-none cursor-pointer"
              />
            </Link>
          </div>
        ))}
      </div>

      {/* Pagination Indicators (Bottom Center) */}
      {count > 1 ? (
        <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/25 backdrop-blur-xs px-2.5 py-1 rounded-full">
          {slides.map((banner, idx) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                idx === activeIndex
                  ? "w-6 h-1.5 sm:h-2 bg-white shadow-sm"
                  : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/60 hover:bg-white/90"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
