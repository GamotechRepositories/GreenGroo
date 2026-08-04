const features = [
  {
    title: "Bulk Buying",
    titleShort: "Bulk",
    description: "Best deals for retailers, distributors & businesses.",
    descriptionShort: "Wholesale deals",
    icon: (
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7.5h-9m3-3H8.25A2.25 2.25 0 006 6.75v10.5A2.25 2.25 0 008.25 19.5h7.5A2.25 2.25 0 0018 17.25V7.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 7.5h10v9.75A2.25 2.25 0 0117.75 19.5h-7.5A2.25 2.25 0 018 17.25V7.5z" />
      </svg>
    ),
  },
  {
    title: "Trusted & Reliable",
    titleShort: "Trusted",
    description: "We ensure quality and trust in every deal.",
    descriptionShort: "Quality assured",
    icon: (
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: "Dedicated Support",
    titleShort: "Support",
    description: "24/7 customer support for your business needs.",
    descriptionShort: "24/7 help",
    icon: (
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H9a3 3 0 003-3v-1.5A3 3 0 009 12H6.75a4.5 4.5 0 00-4.5 4.5v.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 15a4.5 4.5 0 01-4.5 4.5H15a3 3 0 01-3-3v-1.5a3 3 0 013-3h2.25a4.5 4.5 0 014.5 4.5v.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v-1.5a4.5 4.5 0 00-9 0V12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v-1.5a4.5 4.5 0 019 0V12" />
      </svg>
    ),
  },
  {
    title: "Fast Delivery",
    titleShort: "Delivery",
    description: "Quick and safe delivery across India.",
    descriptionShort: "Pan-India",
    icon: (
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
];

function HeroFeatures() {
  return (
    <section className="bg-black px-3 sm:px-6 md:px-8 lg:px-12 pt-8 md:pt-10 pb-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-neutral-900 rounded-xl shadow-lg overflow-hidden flex flex-row divide-x divide-neutral-700 border border-neutral-700">
          {features.map((item) => (
            <div
              key={item.title}
              className="flex flex-1 min-w-0 flex-col items-center text-center gap-1 px-1.5 py-3 md:flex-row md:items-center md:text-left md:gap-3 md:px-5 md:py-6"
            >
              <div className="shrink-0 text-accent w-7 h-7 md:w-10 md:h-10">
                {item.icon}
              </div>
              <div className="min-w-0 w-full">
                <h3 className="font-bold text-white text-[10px] md:text-base leading-tight">
                  <span className="md:hidden">{item.titleShort}</span>
                  <span className="hidden md:inline">{item.title}</span>
                </h3>
                <p className="text-[9px] md:text-sm text-neutral-400 mt-0.5 leading-snug line-clamp-2">
                  <span className="md:hidden">{item.descriptionShort}</span>
                  <span className="hidden md:inline">{item.description}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HeroFeatures;
