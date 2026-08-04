import { useState, useEffect, useCallback } from "react";
import { getHeroBanners } from "../../api/api";

const AUTO_PLAY_MS = 4000;

function Hero() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data } = await getHeroBanners();
        const banners = (data?.data || [])
          .filter((b) => b.isActive !== false && b.imageUrl?.trim())
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((b) => ({
            id: b._id,
            src: b.imageUrl,
            alt: b.alt || "BulkMobileMart hero banner",
          }));
        setSlides(banners);
        setCurrent(0);
      } catch {
        setSlides([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  const goTo = useCallback(
    (index) => {
      if (slides.length === 0) return;
      setCurrent((index + slides.length) % slides.length);
    },
    [slides.length]
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, AUTO_PLAY_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (loading) {
    return (
      <section className="relative w-full bg-black py-20 text-center text-neutral-400">
        Loading banners...
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="relative w-full bg-black py-20 text-center text-neutral-400">
        No hero banners yet.
      </section>
    );
  }

  return (
    <section
      className="relative w-full bg-black"
      aria-label="Promotional banners"
    >
      <div className="relative w-full">
        {slides.map((slide, index) => (
          <img
            key={slide.id}
            src={slide.src}
            alt={slide.alt}
            className={`w-full h-auto max-w-full block transition-opacity duration-1000 ease-in-out ${
              index === current
                ? "opacity-100 relative z-10"
                : "opacity-0 absolute top-0 left-0 pointer-events-none"
            }`}
            loading={index === 0 ? "eager" : "lazy"}
            draggable={false}
          />
        ))}

        {slides.length > 1 && (
          <>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === current ? "true" : undefined}
                  onClick={() => goTo(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === current
                      ? "w-8 bg-white"
                      : "w-2.5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default Hero;
