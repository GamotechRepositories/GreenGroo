import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getOfferBanners } from "../../api/api";

const AUTO_PLAY_MS = 5000;
const DESKTOP_BREAKPOINT = 1024;
const SWIPE_THRESHOLD = 48;

const FALLBACK_BANNER = {
  id: "fallback",
  imageUrl:
    "https://res.cloudinary.com/dsafvwkrf/image/upload/v1781347425/Untitled_design_9_lqyd8e.png",
  title: "Bulk Mobile Accessories at",
  titleHighlight: "Wholesale Prices",
  subtitle:
    "MOQ 10 pieces · Pan-India delivery · Best deals for retailers & distributors",
  linkUrl: "",
  alt: "Mobile accessories wholesale",
};

function mapBanners(list) {
  return (list || [])
    .filter((banner) => banner.isActive !== false && banner.imageUrl?.trim())
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((banner) => ({
      id: banner._id,
      imageUrl: banner.imageUrl,
      title: banner.title || "",
      titleHighlight: banner.titleHighlight || "",
      subtitle: banner.subtitle || "",
      linkUrl: banner.linkUrl || "",
      alt: banner.alt || "Mobile accessories wholesale",
    }));
}

function OfferBannerSlide({ banner }) {
  const hasText = Boolean(banner.title || banner.titleHighlight || banner.subtitle);

  const content = (
    <>
      <img
        src={banner.imageUrl}
        alt={banner.alt}
        className="h-[200px] w-full object-cover object-center sm:h-[240px] md:h-[300px] lg:h-[340px]"
        loading="lazy"
        draggable={false}
      />
      {hasText ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/10" />
          <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-8 md:px-10 lg:px-12">
            {banner.title || banner.titleHighlight ? (
              <p className="max-w-md text-lg font-bold leading-snug text-white sm:text-xl md:text-2xl lg:text-3xl">
                {banner.title}{" "}
                <span className="text-primary">{banner.titleHighlight}</span>
              </p>
            ) : null}
            {banner.subtitle ? (
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-white/90 sm:text-sm md:text-base">
                {banner.subtitle}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </>
  );

  const wrapperClass = "relative h-full w-full shrink-0 overflow-hidden rounded-2xl md:rounded-3xl";

  if (banner.linkUrl) {
    const isExternal = /^https?:\/\//i.test(banner.linkUrl);
    if (isExternal) {
      return (
        <a
          href={banner.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${wrapperClass} block`}
        >
          {content}
        </a>
      );
    }
    return (
      <Link to={banner.linkUrl} className={`${wrapperClass} block`}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}

function SliderArrow({ direction, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65 sm:inline-flex ${
        direction === "prev" ? "left-3" : "right-3"
      }`}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {direction === "prev" ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
}

function PromoBanner() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [device, setDevice] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches
      ? "desktop"
      : "mobile"
  );

  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const handleChange = (event) => {
      setDevice(event.matches ? "desktop" : "mobile");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      try {
        const { data } = await getOfferBanners(device);
        let banners = mapBanners(data?.data);

        if (banners.length === 0 && device === "mobile") {
          const fallback = await getOfferBanners("desktop");
          banners = mapBanners(fallback.data?.data);
        }

        setSlides(banners.length > 0 ? banners : [FALLBACK_BANNER]);
        setCurrent(0);
      } catch {
        setSlides([FALLBACK_BANNER]);
        setCurrent(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [device]);

  const goTo = useCallback(
    (index) => {
      if (slides.length === 0) return;
      setCurrent((index + slides.length) % slides.length);
    },
    [slides.length]
  );

  const goNext = useCallback(() => {
    goTo(current + 1);
  }, [current, goTo]);

  const goPrev = useCallback(() => {
    goTo(current - 1);
  }, [current, goTo]);

  useEffect(() => {
    if (slides.length <= 1 || isPaused) return undefined;
    const timer = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, AUTO_PLAY_MS);
    return () => window.clearInterval(timer);
  }, [slides.length, isPaused]);

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX ?? 0;
    touchDeltaX.current = 0;
    setIsPaused(true);
  };

  const handleTouchMove = (event) => {
    const currentX = event.touches[0]?.clientX ?? 0;
    touchDeltaX.current = currentX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (touchDeltaX.current > SWIPE_THRESHOLD) {
      goPrev();
    } else if (touchDeltaX.current < -SWIPE_THRESHOLD) {
      goNext();
    }
    touchDeltaX.current = 0;
    window.setTimeout(() => setIsPaused(false), 1200);
  };

  if (loading) {
    return (
      <section className="bg-white px-4 py-4 sm:px-6 md:px-8">
        <div className="h-[200px] animate-pulse rounded-2xl bg-neutral-100 sm:h-[240px] md:h-[300px]" />
      </section>
    );
  }

  const hasMultiple = slides.length > 1;

  return (
    <section className="bg-white px-4 py-4 sm:px-6 md:px-8">
      <div
        className="relative overflow-hidden rounded-2xl md:rounded-3xl"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={hasMultiple ? handleTouchStart : undefined}
        onTouchMove={hasMultiple ? handleTouchMove : undefined}
        onTouchEnd={hasMultiple ? handleTouchEnd : undefined}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translate3d(-${current * 100}%, 0, 0)` }}
        >
          {slides.map((slide) => (
            <div key={slide.id} className="w-full shrink-0">
              <OfferBannerSlide banner={slide} />
            </div>
          ))}
        </div>

        {hasMultiple ? (
          <>
            <SliderArrow direction="prev" onClick={goPrev} label="Previous offer banner" />
            <SliderArrow direction="next" onClick={goNext} label="Next offer banner" />
          </>
        ) : null}
      </div>

      {hasMultiple ? (
        <div className="mt-3 flex justify-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goTo(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === current ? "w-6 bg-primary" : "w-2 bg-neutral-300 hover:bg-neutral-400"
              }`}
              aria-label={`Show offer banner ${index + 1}`}
              aria-current={index === current ? "true" : undefined}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default PromoBanner;
