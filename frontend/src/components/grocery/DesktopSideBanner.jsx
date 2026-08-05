import { Link } from "react-router-dom";

/** Desktop-only left promo (~25%). Hidden on mobile. */
function DesktopSideBanner() {
  return (
    <Link
      to="/product?categoryName=Fruits"
      className="group relative hidden h-full min-h-[220px] min-w-0 flex-1 overflow-hidden rounded-3xl bg-[#e8f5e9] shadow-lg shadow-primary/10 lg:block xl:min-h-[240px]"
    >
      <img
        src="/onboarding-hero.png"
        alt="Fresh produce deals"
        className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 xl:p-6">
        <p className="w-fit rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#07875f]">
          Today&apos;s Deal
        </p>
        <h3 className="mt-2 text-lg font-extrabold leading-snug text-white xl:text-xl">
          Farm Fresh Picks
        </h3>
        <p className="mt-1 text-xs font-medium text-white/85 xl:text-sm">
          Extra savings on seasonal fruits &amp; veggies
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-white">
          Shop now
          <svg className="h-4 w-4 transition group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

export default DesktopSideBanner;
