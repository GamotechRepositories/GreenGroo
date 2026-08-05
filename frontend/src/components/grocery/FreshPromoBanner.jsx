import { Link } from "react-router-dom";

const HERO_BG = "/herobaner.png";

function FreshPromoBanner({ className = "" }) {
  return (
    <section className={`px-4 py-3 sm:px-6 lg:h-full lg:px-0 lg:py-0 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl bg-[#e8f5e9] shadow-sm lg:h-full lg:min-h-[220px] lg:rounded-3xl lg:shadow-lg lg:shadow-primary/10 xl:min-h-[240px]">
        {/* Mobile: natural aspect ratio · Desktop: fill available width/height */}
        <img
          src={HERO_BG}
          alt=""
          className="block h-auto w-full lg:absolute lg:inset-0 lg:h-full lg:object-cover lg:object-right"
          width={2022}
          height={778}
          aria-hidden="true"
        />

        {/* Overlay — left empty area of the banner */}
        <div className="absolute inset-y-0 left-0 z-10 flex w-[56%] flex-col justify-center pl-5 pr-1 sm:w-[50%] sm:pl-7 lg:w-[52%] lg:pl-10 xl:w-[48%] xl:pl-14">
          <p className="w-fit rounded-full bg-white/90 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#07875f] shadow-sm sm:px-3 sm:py-1 sm:text-xs">
            Special Offer
          </p>

          <h2 className="mt-2 text-[15px] font-extrabold leading-snug text-text-primary sm:text-xl lg:mt-3 lg:text-3xl xl:text-4xl">
            Fresh &amp; Healthy
          </h2>

          <p className="mt-1 text-[10px] leading-snug text-text-secondary sm:text-xs lg:mt-2 lg:max-w-md lg:text-base">
            <span className="lg:hidden">Up to 30% off organic produce</span>
            <span className="hidden lg:inline">
              Up to 30% off on organic fruits &amp; vegetables. Delivered fresh to your doorstep.
            </span>
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4 lg:mt-5 lg:gap-3">
            <Link
              to="/product"
              className="inline-flex items-center justify-center rounded-full bg-[#07875f] px-4 py-2 text-[11px] font-bold text-white shadow-md shadow-[#07875f]/30 transition hover:bg-[#066b4c] active:scale-[0.98] sm:px-5 sm:text-xs lg:rounded-xl lg:px-6 lg:py-2.5 lg:text-sm"
            >
              Shop Now
            </Link>
            <Link
              to="/categories"
              className="inline-flex items-center justify-center rounded-full border border-[#07875f]/40 bg-white/90 px-3 py-2 text-[11px] font-semibold text-[#07875f] backdrop-blur-sm transition hover:border-[#07875f] hover:bg-white active:scale-[0.98] sm:px-4 sm:text-xs lg:rounded-xl lg:px-5 lg:py-2.5 lg:text-sm"
            >
              <span className="lg:hidden">Explore</span>
              <span className="hidden lg:inline">Browse Categories</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FreshPromoBanner;
