import { Link } from "react-router-dom";

const brands = [
  {
    name: "smg",
    category: "Chargers & Cables",
    tagline: "Reliable. Durable. Efficient.",
  },
  {
    name: "fn gold",
    category: "Earbuds & Neckbands",
    tagline: "Premium sound. All-day comfort.",
  },
  {
    name: "mz",
    category: "Mobile Accessories",
    tagline: "Quality gear for every device.",
  },
  {
    name: "fitgear",
    category: "Smart Watches",
    tagline: "Track fitness. Stay connected.",
  },
  {
    name: "macho",
    category: "Speakers",
    tagline: "Bold sound. Live bold.",
  },
  {
    name: "struphuno",
    category: "Audio Accessories",
    tagline: "Clear audio. Every day.",
  },
];

function ShopByBrand() {
  return (
    <section className="bg-black text-white px-5 sm:px-6 md:px-8 lg:px-12 py-10 md:py-12 border-t border-neutral-900">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-8 md:mb-10">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-[1.75rem] font-bold uppercase tracking-tight mb-2">
              <span className="text-white">Shop </span>
              <span className="text-accent">By</span>
              <span className="text-white"> Brand</span>
            </h2>
            <p className="text-sm sm:text-base text-neutral-400">
              Top quality. Trusted brands. Best value.
            </p>
          </div>
          <Link
            to="/product"
            className="inline-flex items-center justify-center gap-2 self-start rounded-md border border-accent px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wide text-white hover:bg-accent/10 transition"
          >
            View All Brands
            <span className="text-accent" aria-hidden="true">
              →
            </span>
          </Link>
        </div>

        <div className="overflow-x-auto hide-scrollbar scroll-smooth snap-x snap-mandatory scroll-px-5 lg:overflow-visible lg:snap-none">
          <div className="flex gap-4 pb-2 w-max lg:w-full lg:grid lg:grid-cols-3 xl:grid-cols-6 lg:gap-5">
            {brands.map((brand) => (
              <div
                key={brand.name}
                className="shrink-0 w-[220px] sm:w-[240px] lg:w-auto snap-start flex flex-col rounded-xl border border-accent/80 bg-neutral-900 px-4 py-5 sm:px-5 sm:py-6 shadow-[0_0_12px_rgba(249,115,22,0.15)] hover:shadow-[0_0_18px_rgba(249,115,22,0.3)] transition-shadow"
              >
                <p className="text-center text-lg sm:text-xl font-bold uppercase text-white tracking-wide mb-6 sm:mb-8 min-h-[3rem] flex items-center justify-center">
                  {brand.name}
                </p>

                <div className="flex-1 flex flex-col items-center text-center">
                  <p className="text-accent font-bold text-sm sm:text-base mb-2">
                    {brand.category}
                  </p>
                  <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed mb-6">
                    {brand.tagline}
                  </p>
                </div>

                <Link
                  to="/product"
                  className="inline-flex items-center justify-center gap-2 w-full rounded-md border border-accent px-3 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-wide text-accent hover:bg-accent/10 transition"
                >
                  Explore Brand
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            ))}
            <div className="shrink-0 w-2 lg:hidden" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ShopByBrand;
