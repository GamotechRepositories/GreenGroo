import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const INSTANT_ORDER_BANNERS = [
  {
    id: "instant-order-banner-1",
    desktopImage: "/assets/payment/instant order.webp",
    mobileImage: "/assets/payment/instant%20order%20mobile%20banner%201.png",
    alt: "Instant Order — Fresh Farm Produce Delivered to Your Doorstep On Time & Always Fresh",
    link: "/product?store=mall",
  },
  {
    id: "instant-order-banner-2",
    desktopImage: "/assets/payment/instant order 2.webp",
    mobileImage: "/assets/payment/instant%20order%20mobile%20banner%202.png",
    alt: "Stock up on Daily Essentials — Fresh Farm Goodness & Exotic Fruits & Vegetables",
    link: "/product?store=mall",
  },
];

export default function InstantOrderHeroCarousel({ isMobile = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Auto rotate banners every 4.5s when not hovered
  useEffect(() => {
    if (isHovered) return undefined;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % INSTANT_ORDER_BANNERS.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isHovered]);

  const handlePrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + INSTANT_ORDER_BANNERS.length) % INSTANT_ORDER_BANNERS.length
    );
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % INSTANT_ORDER_BANNERS.length);
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
        {INSTANT_ORDER_BANNERS.map((banner, index) => {
          const imageSrc = isMobile ? banner.mobileImage : banner.desktopImage;
          return (
            <div key={banner.id} className="w-full shrink-0">
              <Link to={banner.link} className="block w-full">
                <picture className="block w-full">
                  <source media="(max-width: 1023px)" srcSet={banner.mobileImage} />
                  <source media="(min-width: 1024px)" srcSet={banner.desktopImage} />
                  <img
                    src={imageSrc}
                    alt={banner.alt}
                    loading={index === 0 ? "eager" : "lazy"}
                    className="block w-full h-auto object-cover object-center rounded-none cursor-pointer"
                  />
                </picture>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Pagination Dot Indicators (Bottom Center) */}
      <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {INSTANT_ORDER_BANNERS.map((banner, index) => (
          <button
            key={banner.id}
            type="button"
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              currentIndex === index
                ? "w-6 h-1.5 bg-emerald-400 shadow-sm"
                : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
