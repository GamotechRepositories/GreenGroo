import { Link } from "react-router-dom";

function CTASection() {
  return (
    <section className="py-10 sm:py-16 px-3 sm:px-4 bg-black text-white">
      <div className="max-w-4xl mx-auto rounded-2xl bg-neutral-900 border border-neutral-800 p-6 sm:p-10 md:p-14 text-center">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
          Ready to Stock Your Store?
        </h2>
        <p className="text-neutral-400 mb-8 max-w-xl mx-auto">
          Share your required brands, models, and quantity. Our team sends a
          custom bulk quote within 24 hours.
        </p>
        <Link
          to="/contact"
          className="inline-block rounded-lg bg-accent text-white px-8 py-3 font-bold hover:brightness-110 transition"
        >
          Contact Sales Team
        </Link>
      </div>
    </section>
  );
}

export default CTASection;
