import { useEffect, useState } from "react";

const FEATURES = [
  {
    title: "Best Wholesale Prices",
    mobileLine1: "Lowest wholesale rates",
    mobileLine2: "on all accessories",
    description: "Get the most competitive prices on all mobile accessories.",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
    accent: "bg-orange-500",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 8.25H9m6 3H9m11.5-3v7.5a2.26 2.26 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-7.5M19.5 8.25V6A2.25 2.25 0 0017.25 3.75h-7.5A2.25 2.25 0 007.5 6v2.25"
      />
    ),
  },
  {
    title: "100% Original Products",
    mobileLine1: "Genuine products only",
    mobileLine2: "Quality you can trust",
    description: "We deal only in genuine and high-quality original products.",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    accent: "bg-emerald-500",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    ),
  },
  {
    title: "Bulk Orders, Bigger Savings",
    mobileLine1: "Buy more, save more",
    mobileLine2: "Extra bulk discounts",
    description: "More you buy, more you save. Special discounts on bulk orders.",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    accent: "bg-amber-500",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
      />
    ),
  },
  {
    title: "Fast & Safe Delivery",
    mobileLine1: "Pan India delivery",
    mobileLine2: "Safe & on-time shipping",
    description: "Pan India delivery with secure packaging and on-time service.",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    accent: "bg-sky-500",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m13.5 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
      />
    ),
  },
  {
    title: "Dedicated Support",
    mobileLine1: "Always here to help",
    mobileLine2: "Quick expert support",
    description: "Our support team is always ready to assist you anytime.",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    accent: "bg-rose-500",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.697c0-1.355-.822-2.578-2.078-3.106C15.322 3.036 12.675 2.75 10 2.75S4.678 3.036 3.422 3.591C2.166 4.119 1.344 5.342 1.344 6.697v4.286c0 1.136.847 2.1 1.98 2.193.34.027.68.052 1.02.072v3.091l3-3c1.354 0 2.694.055 4.02.163a2.115 2.115 0 00.825.242 48.507 48.507 0 005.996-.001"
      />
    ),
  },
];

function FeatureIcon({ children, iconBg, iconColor, compact = false }) {
  const sizeClass = compact
    ? "h-11 w-11 sm:h-16 sm:w-16"
    : "h-14 w-14 sm:h-16 sm:w-16";

  const iconSizeClass = compact
    ? "h-5 w-5 sm:h-8 sm:w-8"
    : "h-7 w-7 sm:h-8 sm:w-8";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full transition-all duration-300 group-hover:scale-110 group-hover:shadow-md ${sizeClass} ${iconBg}`}
    >
      <svg
        className={`${iconSizeClass} ${iconColor}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden="true"
      >
        {children}
      </svg>
    </div>
  );
}

function FeatureCard({ feature, index }) {
  return (
    <article
      className="why-choose-card group flex flex-col gap-2 rounded-2xl border border-border-light bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-xl sm:flex-row sm:gap-5 sm:p-5"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <FeatureIcon iconBg={feature.iconBg} iconColor={feature.iconColor} compact>
        {feature.icon}
      </FeatureIcon>

      <div className="min-w-0 flex-1">
        <h3 className="hidden text-base font-bold leading-snug text-text-primary transition-colors duration-300 group-hover:text-primary sm:block">
          {feature.title}
        </h3>

        <div className="sm:hidden">
          <p className="text-[11px] font-bold leading-snug text-text-primary transition-colors duration-300 group-hover:text-primary">
            {feature.mobileLine1}
          </p>
          <p className="mt-0.5 text-[10px] leading-snug text-text-secondary">
            {feature.mobileLine2}
          </p>
        </div>

        <p className="mt-1 hidden text-xs leading-relaxed text-text-secondary sm:block sm:text-sm">
          {feature.description}
        </p>

        <span
          className={`mt-2 block h-0.5 w-6 rounded-full transition-all duration-300 group-hover:w-12 sm:mt-3 sm:w-8 sm:group-hover:w-16 ${feature.accent}`}
          aria-hidden="true"
        />
      </div>
    </article>
  );
}

function WhyChooseUs() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const desktopVisible = 3;
  const mobileVisible = 2;

  const desktopSlides = [
    ...FEATURES.slice(-desktopVisible),
    ...FEATURES,
    ...FEATURES.slice(0, desktopVisible),
  ];

  const mobileSlides = [
    ...FEATURES.slice(-mobileVisible),
    ...FEATURES,
    ...FEATURES.slice(0, mobileVisible),
  ];

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsTransitioning(true);
    }, 2500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleTransitionEnd = () => {
    if (currentIndex >= FEATURES.length) {
      setIsTransitioning(false);
      setCurrentIndex(0);

      setTimeout(() => {
        setIsTransitioning(true);
      }, 50);
    }
  };

  return (
    <section className="bg-white px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary sm:text-sm">
            — Why Choose Us —
          </p>

          <h2 className="mt-3 text-2xl font-bold text-text-primary sm:text-3xl md:text-4xl">
            Why Choose <span className="text-primary">BulkMobileMart?</span>
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-base">
            We are committed to providing the best quality mobile accessories at wholesale prices
            with a seamless shopping experience.
          </p>
        </div>

        <div
          className="overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <div className="block sm:hidden">
            <div
              className={`flex ${
                isTransitioning
                  ? "transition-transform duration-700 ease-in-out"
                  : ""
              }`}
              style={{
                transform: `translateX(-${
                  (currentIndex + mobileVisible) * 50
                }%)`,
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {mobileSlides.map((feature, index) => (
                <div key={index} className="w-1/2 flex-shrink-0 px-1.5">
                  <FeatureCard feature={feature} index={index} />
                </div>
              ))}
            </div>
          </div>

          <div className="hidden sm:block">
            <div
              className={`flex ${
                isTransitioning
                  ? "transition-transform duration-700 ease-in-out"
                  : ""
              }`}
              style={{
                transform: `translateX(-${
                  (currentIndex + desktopVisible) * 33.333333
                }%)`,
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {desktopSlides.map((feature, index) => (
                <div key={index} className="w-1/3 flex-shrink-0 px-2.5">
                  <FeatureCard feature={feature} index={index} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;