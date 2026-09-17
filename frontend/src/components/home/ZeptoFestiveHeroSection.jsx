import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { resolveStoreTheme } from "../grocery/homeHeaderThemes";

export default function ZeptoFestiveHeroSection() {
  const [searchParams] = useSearchParams();
  const currentStore = searchParams.get("store")?.trim()?.toLowerCase() || "main";
  const theme = resolveStoreTheme(currentStore);

  if (currentStore === "festive" || currentStore === "mall") {
    return null; // Video hero is not shown in festive/mall store views, sliding banners handle it
  }

  const sectionBgClass = theme.bannerBg || theme.contentBg;

  return (
    <section className="bg-transparent pt-0 pb-6 transition-colors duration-300">
      {/* Stunning Video Header Card */}
      <div className="relative w-full max-w-7xl mx-auto overflow-hidden rounded-2xl sm:rounded-[32px] bg-emerald-950 group min-h-[350px] sm:min-h-[450px] md:min-h-[500px] flex items-end">
        
        {/* Background Auto-Playing Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="/10847026-hd_1920_1080_25fps.mp4"
        />

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Content Overlaid at Bottom */}
        <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-5 p-6 sm:p-10 w-full text-center">
          <div className="space-y-1 sm:space-y-2">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-xl">
              Fresh Delivered. <span className="text-emerald-400">Instantly.</span>
            </h2>
            <p className="text-xs sm:text-base md:text-lg font-medium text-white/90 max-w-lg mx-auto drop-shadow-md">
              Experience the finest quality groceries at your doorstep in 15 minutes.
            </p>
          </div>
          <Link
            to="/product"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-600 px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <span>Explore Store</span>
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
