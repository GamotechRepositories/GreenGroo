import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X, Sparkles } from "lucide-react";
import { useSectionBanners } from "../../hooks/queries/useSectionBanners";
import OptimizedImg from "../common/OptimizedImg";

const TILE_CLASS =
  "relative block h-32 sm:h-44 md:h-52 lg:h-56 xl:h-60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group border border-[#cde8d5] bg-[#f3f9f4]";

function TileImage({ banner }) {
  return (
    <>
      <OptimizedImg
        src={banner.image}
        alt={banner.alt}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />
      {/* Subtle interactive hover highlight */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
    </>
  );
}

const ROTATE_MS = 5000;

/** One tile; rotates through its banners when the admin added more than one. */
function StoryTile({ banners, onPlay }) {
  const [index, setIndex] = useState(0);
  const count = banners.length;

  useEffect(() => {
    if (count < 2) return undefined;
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % count), ROTATE_MS);
    return () => clearInterval(timer);
  }, [count]);

  if (!count) return null;
  const banner = banners[index % count];

  const dots =
    count > 1 ? (
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {banners.map((item, i) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Show banner ${i + 1}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIndex(i);
            }}
            className={`h-1.5 rounded-full transition-all ${
              i === index % count ? "w-4 bg-white" : "w-1.5 bg-white/60"
            }`}
          />
        ))}
      </div>
    ) : null;

  if (banner.videoUrl) {
    return (
      <div
        onClick={() => onPlay(banner)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPlay(banner);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={banner.alt || "Play farmer story video"}
        className={`${TILE_CLASS} cursor-pointer`}
      >
        <TileImage banner={banner} />
        {dots}
      </div>
    );
  }

  return (
    <Link to={banner.link} aria-label={banner.alt} className={TILE_CLASS}>
      <TileImage banner={banner} />
      {dots}
    </Link>
  );
}

function StoryTiles({ banners, onPlay }) {
  const right = banners.filter((banner) => banner.category === "farmerstories");
  const left = banners.filter((banner) => banner.category !== "farmerstories");
  if (!left.length && !right.length) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 lg:gap-5">
      <StoryTile banners={left} onPlay={onPlay} />
      <StoryTile banners={right} onPlay={onPlay} />
    </div>
  );
}

/** Tiles come from admin → Banners → Preorder → Farmer Stories banners (left / right tile). */
export default function FarmProduceDualBanners({ className = "" }) {
  const banners = useSectionBanners("preorder", "stories");
  const [playing, setPlaying] = useState(null);

  if (!banners.desktop.length && !banners.mobile.length) return null;

  return (
    <>
      <section className={`w-full py-2 sm:py-3.5 px-3 sm:px-4 lg:px-0 ${className}`}>
        <div className="hidden lg:block">
          <StoryTiles banners={banners.desktop} onPlay={setPlaying} />
        </div>
        <div className="lg:hidden">
          <StoryTiles banners={banners.mobile} onPlay={setPlaying} />
        </div>
      </section>

      {/* Video Player Modal */}
      {playing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 bg-gray-900 border-b border-gray-800 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <div>
                  <h4 className="font-bold text-sm sm:text-base leading-tight">
                    {playing.title || "शेतकऱ्यांची खरी गोष्ट (Farmer Story)"}
                  </h4>
                  <p className="text-[11px] text-emerald-400">शेतापासून थेट तुमच्या स्वयंपाकघरापर्यंत</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPlaying(null)}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                aria-label="Close video"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                key={playing.videoUrl}
                src={playing.videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-900 flex items-center justify-between text-xs text-gray-300">
              <span>{playing.subtitle}</span>
              <button
                type="button"
                onClick={() => setPlaying(null)}
                className="px-3.5 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
              >
                बंद करा
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
