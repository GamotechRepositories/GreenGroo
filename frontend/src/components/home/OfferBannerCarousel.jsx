import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function LeafMark({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.5 4.5c-6.2.4-10.8 3.2-13.2 8.1-.7 1.4-1.1 2.9-1.2 4.4 2.2-.2 4.3-.9 6.1-2.2 4.2-3 6.6-7.2 8.3-10.3Z" />
      <path d="M5.2 17.8c2.4-4.6 6.4-7.4 11.6-8.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const DEFAULT_TRUST_POINTS = [
  { id: "natural", label: "100% Natural" },
  { id: "farmers", label: "Direct from Farmers" },
  { id: "quality", label: "Trusted Quality" },
];

const DEFAULT_FADE = "from-[#f4fbf2] via-[#f4fbf2]/80";

/** Full-width 1024×342 promo banner that rotates through `banners`. */
export default function OfferBannerCarousel({
  banners = [],
  trustPoints = DEFAULT_TRUST_POINTS,
  interval = 5000,
  className = "",
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return undefined;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % banners.length);
    }, interval);
    return () => clearInterval(timer);
  }, [banners.length, interval]);

  if (!banners.length) return null;
  const banner = banners[active % banners.length];

  return (
    <div className={`relative ${className}`}>
      <Link
        to={banner.link}
        className="relative block aspect-[1024/342] w-full overflow-hidden rounded-xl sm:rounded-2xl"
      >
        <img
          src={banner.image}
          alt={banner.alt || ""}
          loading="lazy"
          className={`absolute inset-0 h-full w-full object-cover ${banner.position || "object-center"}`}
        />
        {banner.bgColor ? (
          <div
            className="absolute inset-y-0 left-0 w-[68%]"
            style={{ background: `linear-gradient(to right, ${banner.bgColor}, ${banner.bgColor}cc, transparent)` }}
          />
        ) : (
          <div className={`absolute inset-y-0 left-0 w-[68%] bg-gradient-to-r to-transparent ${banner.fade || DEFAULT_FADE}`} />
        )}
        <div className="relative z-10 flex h-full max-w-[68%] flex-col justify-center px-3 py-3 sm:max-w-[58%] sm:px-7">
          {banner.tag ? (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#1f8a3b] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white sm:px-2.5 sm:py-1 sm:text-[10px]">
              <LeafMark className="h-3 w-3" />
              {banner.tag}
            </span>
          ) : null}
          {banner.title ? (
            <h3 className="mt-1 whitespace-pre-line text-[16px] font-extrabold leading-[1.05] text-[#145c32] sm:mt-2 sm:text-[30px] lg:text-[36px]">
              {banner.title}
            </h3>
          ) : null}
          {banner.subtitle ? (
            <p className="mt-0.5 text-[10px] font-medium text-slate-700 sm:mt-1 sm:text-[15px]">{banner.subtitle}</p>
          ) : null}
          {banner.offer ? <p className="text-[12px] font-extrabold text-slate-900 sm:text-[18px]">{banner.offer}</p> : null}
          <div className="mt-2 hidden flex-wrap gap-2 sm:flex">
            {trustPoints.map((point) => (
              <span
                key={point.id}
                className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold text-slate-700"
              >
                <span className="text-[#1f8a3b]">
                  <LeafMark className="h-3 w-3" />
                </span>
                {point.label}
              </span>
            ))}
          </div>
          <span className="mt-2 inline-flex w-fit items-center rounded-full bg-[#145c32] px-3 py-1 text-[10px] font-bold text-white sm:mt-3 sm:px-4 sm:py-2 sm:text-[13px]">
            Shop Now →
          </span>
        </div>
        <span className="absolute bottom-2 right-2 z-10 flex h-[52px] w-[52px] flex-col items-center justify-center rounded-full bg-[#1f8a3b] text-center text-[8px] font-extrabold leading-tight text-white shadow-md sm:bottom-4 sm:right-4 sm:h-[84px] sm:w-[84px] sm:text-[11px]">
          Fresh
          <br />
          Healthy
          <br />
          Trusted
        </span>
      </Link>
      {banners.length > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {banners.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === active ? "w-8 bg-[#1f8a3b]" : "w-1.5 bg-slate-300"
              }`}
              aria-label={`Go to offer banner ${index + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
