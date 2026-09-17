import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const SLIDING_BANNERS = [
  { id: 1, image: "/assets/payment/hero2.png", link: "/product" },
  { id: 2, image: "/assets/payment/hero1.png", link: "/product" },
  { id: 3, image: "/assets/payment/hero3.png", link: "/product" },
];

export default function HomeSlidingBanners() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Auto slide every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDING_BANNERS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 40) {
      setCurrentIndex((prev) => (prev + 1) % SLIDING_BANNERS.length);
    } else if (diff < -40) {
      setCurrentIndex((prev) => (prev - 1 + SLIDING_BANNERS.length) % SLIDING_BANNERS.length);
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <section className="bg-white">
      {/* Full-width carousel container showing original height/width proportions */}
      <div 
        className="relative overflow-hidden w-full rounded-2xl sm:rounded-3xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {SLIDING_BANNERS.map((banner) => (
            <div key={banner.id} className="w-full shrink-0">
              <Link to={banner.link} className="block w-full">
                <img
                  src={banner.image}
                  alt={`Hero Banner ${banner.id}`}
                  className="w-full h-[300px] object-contain bg-gray-100 cursor-pointer lg:h-auto"
                />
              </Link>
            </div>
          ))}
        </div>
        
        {/* Navigation Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {SLIDING_BANNERS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-6 bg-white shadow-sm" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
