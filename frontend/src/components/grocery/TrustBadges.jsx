const BADGES = [
  {
    icon: "🚚",
    title: "Fast Delivery",
    desc: "Same-day in select areas",
  },
  {
    icon: "🌿",
    title: "Farm Fresh",
    desc: "Quality checked produce",
  },
  {
    icon: "💰",
    title: "Best Prices",
    desc: "Deals every day",
  },
  {
    icon: "↩️",
    title: "Easy Returns",
    desc: "Hassle-free support",
  },
];

function TrustBadges() {
  return (
    <section className="border-y border-border-light bg-white px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {BADGES.map((badge) => (
          <div
            key={badge.title}
            className="flex items-center gap-3 rounded-2xl border border-border-light bg-mobile-surface/60 p-3 transition hover:border-primary/30 hover:shadow-sm lg:p-4"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-xl lg:h-12 lg:w-12 lg:text-2xl">
              {badge.icon}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-text-primary lg:text-sm">{badge.title}</p>
              <p className="text-[10px] text-text-secondary lg:text-xs">{badge.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TrustBadges;
