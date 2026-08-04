const deals = [
  {
    title: "Entry-Level Bulk",
    desc: "Redmi, Realme, Samsung A-series — ideal for retail shops & small sellers.",
    min: "Min. 20 units",
    highlight: "From ₹6,999/unit",
  },
  {
    title: "Mid-Range Packs",
    desc: "OnePlus Nord, Samsung M-series, Vivo — strong margins for resellers.",
    min: "Min. 15 units",
    highlight: "From ₹14,999/unit",
  },
  {
    title: "Premium Wholesale",
    desc: "iPhone, Samsung S/Ultra, flagship OnePlus — for premium outlets.",
    min: "Min. 10 units",
    highlight: "Custom quote",
  },
];

function BulkDeals() {
  return (
    <section className="py-12 sm:py-16 md:py-20 px-5 sm:px-6 md:px-8 bg-light-bg text-black">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-3 text-black">
          Popular Bulk Categories
        </h2>
        <p className="text-gray-600 text-center text-sm sm:text-base mb-8 sm:mb-12 max-w-2xl mx-auto px-1">
          Mix models and quantities to match your business. Prices update weekly
          — contact us for today&apos;s rate card.
        </p>

        <div className="overflow-x-auto hide-scrollbar scroll-smooth snap-x snap-mandatory scroll-px-5 md:overflow-visible md:snap-none">
          <div className="flex gap-4 pb-2 w-max md:w-full md:grid md:grid-cols-3 md:gap-6">
            {deals.map((deal) => (
              <article
                key={deal.title}
                className="shrink-0 w-[260px] sm:w-[280px] snap-start rounded-2xl bg-light-bg border border-gray-200 p-6 sm:p-8 hover:border-accent transition md:w-auto shadow-sm"
              >
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-black">{deal.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{deal.desc}</p>
                <p className="text-accent font-semibold mb-1">{deal.highlight}</p>
                <p className="text-gray-500 text-xs">{deal.min}</p>
              </article>
            ))}
            <div className="shrink-0 w-2 md:hidden" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default BulkDeals;
