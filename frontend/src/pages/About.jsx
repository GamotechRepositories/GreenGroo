function About() {
  return (
    <div className="info-page legal-page">
      <section className="page-hero-section px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="page-title">About BulkMobileMart</h1>
          <p className="text-text-secondary text-lg max-w-3xl leading-relaxed">
            BulkMobileMart was built for businesses that sell mobiles — not
            end-customers shopping one phone at a time. We connect retailers,
            online marketplace sellers, and regional distributors with genuine
            wholesale stock at prices that protect your margins.
          </p>
        </div>
      </section>

      <section className="legal-content px-3 sm:px-4 pb-10 sm:pb-12 border-b border-border-light">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10">
          <div className="rounded-2xl border border-border-light bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-text-primary mb-3">Our Mission</h2>
            <p className="text-text-secondary leading-relaxed">
              Make bulk smartphone sourcing simple, transparent, and reliable for
              every serious seller in India — with honest pricing, proper
              documentation, and support you can reach on a phone call.
            </p>
          </div>
          <div className="rounded-2xl border border-border-light bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-text-primary mb-3">Who We Serve</h2>
            <ul className="text-text-secondary space-y-2">
              <li>· Mobile retail shops & multi-brand stores</li>
              <li>· Amazon / Flipkart / Meesho resellers</li>
              <li>· Corporate gifting & bulk procurement</li>
              <li>· Regional distributors & sub-dealers</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="px-3 sm:px-4 pb-16 pt-6 sm:pt-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-text-primary mb-6">What We Offer</h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-text-secondary">
            {[
              "Latest smartphones — all major brands",
              "Mix-and-match bulk orders",
              "GST-compliant invoices",
              "IMEI-verified genuine units",
              "Warehouse pickup & courier delivery",
              "Repeat-order loyalty pricing",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 rounded-lg border border-border-light bg-neutral-50 px-4 py-3"
              >
                <span className="text-primary">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

export default About;
