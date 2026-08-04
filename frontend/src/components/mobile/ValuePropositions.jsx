const ITEMS = [
  {
    label: "Best Prices Guaranteed",
    icon: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 9.5c.4-.8 1.1-1.2 1.9-1.2.9 0 1.6.5 1.9 1.3.2.6.1 1.2-.4 1.7-.5.4-1 .7-1.5 1.1-.3.2-.5.5-.5.9v.2"
        />
      </>
    ),
  },
  {
    label: "Wide Range of Products",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path strokeLinecap="round" d="M8 10h8M8 14h5" />
      </>
    ),
  },
  {
    label: "Bulk Orders Bigger Savings",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 8l8-4 8 4v8l-8 4-8-4V8zM4 8l8 4m8-4l-8 4m0 0v8"
      />
    ),
  },
  {
    label: "Fast & Safe Delivery",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12h2l1.2 4.8a1 1 0 001 .8h9.6a1 1 0 001-.8L18 12h3M3 12V8a1 1 0 011-1h11v5M18 12h2.2a1 1 0 01.98.8l.72 3.2H18M7 17a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4zm8 0a1.2 1.2 0 100-2.4 1.2 1.2 0 000 2.4z"
      />
    ),
  },
];

function FeatureIcon({ children }) {
  return (
    <div className="mb-3 flex h-14 w-14 items-center justify-center text-primary sm:mb-4 sm:h-16 sm:w-16 md:h-[72px] md:w-[72px]">
      <svg
        className="h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        {children}
      </svg>
    </div>
  );
}

function ValuePropositions() {
  return (
    <section className="bg-mobile-bg px-4 py-4 sm:px-6 sm:py-5 md:px-8">
      <div className="rounded-2xl border border-border-light bg-white px-3 py-6 shadow-sm sm:px-5 sm:py-7 md:px-6">
        <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-5">
          {ITEMS.map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center px-1 text-center sm:px-2"
            >
              <FeatureIcon>{item.icon}</FeatureIcon>
              <p className="text-[10px] font-bold leading-snug text-text-primary sm:text-xs md:text-sm">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ValuePropositions;
