import { CONTACT_EMAIL } from "../config/contact";

function PrivacyPolicy() {
  return (
    <div className="info-page legal-page">
      <section className="page-hero-section px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="page-title">Privacy Policy</h1>
          <p className="text-text-secondary">Last updated: June 5, 2026</p>
        </div>
      </section>

      <section className="legal-content px-3 sm:px-4 pb-16 sm:pb-20">
        <div className="max-w-4xl mx-auto space-y-8 text-text-secondary leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">Information We Collect</h2>
            <p>
              When you register, request a bulk quote, or contact us, we may collect
              your name, email, phone number, business details, and order-related
              information necessary to process your requests.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">How We Use Your Information</h2>
            <p>
              We use your data to process orders, send quotes, provide customer support,
              improve our services, and share relevant updates about bulk deals and new
              arrivals if you subscribe to our newsletter.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">Data Security</h2>
            <p>
              We implement reasonable security measures to protect your personal
              information. Passwords are encrypted and access to customer data is
              restricted to authorized personnel only.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">Sharing of Information</h2>
            <p>
              We do not sell your personal information. We may share data with trusted
              service providers (such as payment processors and courier partners) only
              as needed to fulfill your orders.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">Contact Us</h2>
            <p>
              For privacy-related questions, email us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PrivacyPolicy;
