const posts = [
  {
    title: "How to Start a Mobile Retail Business in India",
    date: "May 28, 2026",
    excerpt:
      "A practical guide for new retailers — licensing, sourcing, margins, and choosing the right wholesale partner.",
  },
  {
    title: "Bulk Smartphone Buying: 5 Mistakes to Avoid",
    date: "May 15, 2026",
    excerpt:
      "Learn how to verify IMEI, avoid grey-market stock, and negotiate better bulk pricing for your store.",
  },
  {
    title: "GST Invoices & Compliance for Mobile Distributors",
    date: "May 2, 2026",
    excerpt:
      "Why proper GST billing matters for B2B mobile trade and how BulkMobileMart keeps your records clean.",
  },
  {
    title: "Top Selling Smartphone Brands for Q2 2026",
    date: "Apr 20, 2026",
    excerpt:
      "Market trends, fast-moving models, and which brands retailers are stocking in bulk this quarter.",
  },
];

function Blog() {
  return (
    <div className="bg-black text-white">
      <section className="page-hero-section px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="page-title">Blog</h1>
          <p className="text-neutral-400 text-lg max-w-3xl leading-relaxed">
            Tips, trends, and insights for mobile retailers, distributors, and bulk
            buyers across India.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-12 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {posts.map((post) => (
            <article
              key={post.title}
              className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 md:p-8 hover:border-accent/50 transition"
            >
              <p className="text-accent text-sm font-medium mb-2">{post.date}</p>
              <h2 className="text-xl md:text-2xl font-bold mb-3">{post.title}</h2>
              <p className="text-neutral-400 leading-relaxed">{post.excerpt}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Blog;
