import { useSearchParams, Link } from "react-router-dom";
import { resolveStoreTheme } from "../grocery/homeHeaderThemes";
import { sectionToStoreKey } from "../../utils/storeSection";

const PREORDER_MOBILE_HERO = "/assets/payment/preorderHeroMobileBanner.png";

export default function ZeptoFestiveHeroSection() {
  const [searchParams] = useSearchParams();
  const currentStore = sectionToStoreKey(searchParams.get("store"));
  const theme = resolveStoreTheme(currentStore);

  if (currentStore === "festive" || currentStore === "mall") {
    return null; // Image heroes live in FestiveStoreSection for those stores
  }

  return (
    <>
      {/* Mobile — full-width image hero (matches Ready2Cook / InstantOrder) */}
      <section className="px-4 pt-2 pb-2 sm:px-6 lg:hidden">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-[1.35rem]">
          <img
            src={PREORDER_MOBILE_HERO}
            alt="PreOrder — fresh farm produce delivered to your door"
            className="block h-auto w-full object-cover object-center"
          />
        </div>
      </section>

      {/* Desktop — video hero */}
      <section
        className={`hidden bg-transparent pb-6 pt-0 transition-colors duration-300 lg:block ${
          theme.bannerBg || theme.contentBg || ""
        }`}
      >
        <div className="relative mx-auto flex min-h-[450px] w-full max-w-7xl items-end overflow-hidden rounded-[32px] bg-emerald-950 group md:min-h-[500px]">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            src="/10847026-hd_1920_1080_25fps.mp4"
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="relative z-10 flex w-full flex-col items-center gap-5 p-10 text-center">
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tight text-white drop-shadow-xl md:text-5xl">
                Fresh Delivered. <span className="text-emerald-400">Instantly.</span>
              </h2>
              <p className="mx-auto max-w-lg text-base font-medium text-white/90 drop-shadow-md md:text-lg">
                Experience the finest quality groceries at your doorstep in 15 minutes.
              </p>
            </div>
            <Link
              to="/product"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 py-3 text-base font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-emerald-600 active:scale-95"
            >
              <span>Explore Store</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
