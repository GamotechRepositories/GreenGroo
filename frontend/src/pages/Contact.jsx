import { useState } from "react";
import {
  CONTACT_ADDRESS,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
} from "../config/contact";

function Contact() {
  const [form, setForm] = useState({
    name: "",
    business: "",
    phone: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(
      "Thank you! Our sales team will contact you shortly with a bulk quote."
    );
    setForm({ name: "", business: "", phone: "", email: "", message: "" });
  };

  const inputClass =
    "w-full rounded-lg border border-border-light bg-white px-4 py-3 text-text-primary placeholder:text-text-secondary/60 focus:border-primary focus:outline-none";

  return (
    <div className="info-page">
      <section className="page-hero-section px-3 sm:px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
          <div>
            <h1 className="page-title">Contact Us</h1>
            <p className="text-text-secondary mb-8 leading-relaxed">
              Tell us the brands, models, and quantity you need. We respond to
              bulk enquiries within one business day.
            </p>

            <div className="space-y-6 text-text-secondary">
              <div>
                <h3 className="text-text-primary font-semibold mb-1">Phone / WhatsApp</h3>
                <a href={CONTACT_PHONE_TEL} className="text-primary hover:underline">
                  {CONTACT_PHONE_DISPLAY}
                </a>
              </div>
              <div>
                <h3 className="text-text-primary font-semibold mb-1">Email</h3>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-primary hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
              <div>
                <h3 className="text-text-primary font-semibold mb-1">Office Hours</h3>
                <p>Mon – Sat · 10:00 AM – 7:00 PM IST</p>
              </div>
              <div>
                <h3 className="text-text-primary font-semibold mb-1">Address</h3>
                <p className="leading-relaxed">{CONTACT_ADDRESS}</p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border-light bg-white p-5 sm:p-8 space-y-4 sm:space-y-5 shadow-sm"
          >
            <h2 className="text-xl font-bold text-text-primary mb-2">Request Bulk Quote</h2>
            <input
              type="text"
              name="name"
              placeholder="Your name *"
              required
              value={form.name}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="business"
              placeholder="Business / shop name"
              value={form.business}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone / WhatsApp *"
              required
              value={form.phone}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className={inputClass}
            />
            <textarea
              name="message"
              rows={4}
              placeholder="Brands, models, quantity (e.g. 50x Redmi Note, 20x Samsung A15) *"
              required
              value={form.message}
              onChange={handleChange}
              className={`${inputClass} resize-none`}
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-primary text-white py-3 font-semibold hover:brightness-110 transition"
            >
              Send Enquiry
            </button>
          </form>
        </div>
      </section>

      <section className="py-8 sm:py-12 px-3 sm:px-4 text-center border-t border-border-light pb-16">
        <p className="text-text-secondary max-w-xl mx-auto">
          Prefer WhatsApp? Message us at{" "}
          <a href={CONTACT_PHONE_TEL} className="text-primary hover:underline">
            {CONTACT_PHONE_DISPLAY}
          </a>{" "}
          for fastest bulk pricing.
        </p>
      </section>
    </div>
  );
}

export default Contact;
