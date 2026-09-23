import { useEffect, useState } from "react";
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_TEL } from "../config/contact";
import api from "../api/api";

const FALLBACK_UPDATED = "June 5, 2026";

function TermsAndConditions() {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/admin-ops/policies/live", {
          params: { role: "customer" },
        });
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const match =
          list.find((row) => row.pageKey === "terms") ||
          list.find((row) => /terms/i.test(String(row.title || ""))) ||
          null;
        if (!cancelled) setPolicy(match);
      } catch {
        if (!cancelled) setPolicy(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updatedLabel = policy?.updatedAt
    ? new Date(policy.updatedAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : FALLBACK_UPDATED;

  return (
    <div className="info-page legal-page">
      <section className="page-hero-section px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="page-title">{policy?.title || "Terms & Conditions"}</h1>
          <p className="text-text-secondary">Last updated: {updatedLabel}</p>
        </div>
      </section>

      <section className="legal-content px-3 sm:px-4 pb-16 sm:pb-20">
        <div className="max-w-4xl mx-auto space-y-8 text-text-secondary leading-relaxed">
          {loading ? (
            <p>Loading terms…</p>
          ) : policy?.body ? (
            <div className="whitespace-pre-wrap">{policy.body}</div>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-3">General</h2>
                <p>
                  By using GreenGrocc, you agree to these terms. Our platform is
                  intended for businesses, retailers, and distributors purchasing mobile
                  devices in bulk — not for individual retail consumers.
                </p>
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-3">Orders & Minimum Quantity</h2>
                <p>
                  Minimum order quantity is 10 units unless otherwise stated. All orders
                  are subject to stock availability and confirmation by our sales team.
                  Prices quoted are valid for the period specified in your bulk quote.
                </p>
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-3">Payment & Invoicing</h2>
                <p>
                  Payment terms will be communicated at the time of order confirmation.
                  GST-compliant invoices are provided for all eligible business purchases.
                </p>
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-3">Delivery</h2>
                <p>
                  We ship pan-India through trusted courier partners. Delivery timelines
                  vary by location and order size. Risk of loss passes to the buyer upon
                  delivery to the specified address.
                </p>
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-3">Warranty & Returns</h2>
                <p>
                  Products are covered by manufacturer warranty where applicable. Return
                  and replacement policies for defective or damaged goods must be reported
                  within the timeframe specified at the time of purchase.
                </p>
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-3">Contact</h2>
                <p>
                  Questions about these terms? Reach us at{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
                    {CONTACT_EMAIL}
                  </a>{" "}
                  or call{" "}
                  <a href={CONTACT_PHONE_TEL} className="text-primary hover:underline">
                    {CONTACT_PHONE_DISPLAY}
                  </a>
                  .
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default TermsAndConditions;
