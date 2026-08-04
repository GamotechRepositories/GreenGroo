import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_TEL } from "../config/contact";

function ShippingDetails() {
  return (
    <div className="info-page legal-page">
      <section className="page-hero-section px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="page-title">Shipping Details</h1>
          <p className="text-text-secondary">Last updated: June 10, 2026</p>
        </div>
      </section>

      <section className="legal-content px-3 sm:px-4 pb-16 sm:pb-20">
        <div className="max-w-4xl mx-auto space-y-8 text-text-secondary leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">Delivery Coverage</h2>
            <p>
              BulkMobileMart ships across India through trusted courier and logistics
              partners. We deliver to most pin codes; remote or restricted areas may
              require additional time or confirmation before dispatch.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">Processing Time</h2>
            <p>
              Orders are typically processed within 1–2 business days after confirmation.
              You will receive order status updates via email and can track progress from
              your account under My Orders.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">Delivery Charges</h2>
            <p>
              Standard delivery charges apply on orders below ₹999. Orders of ₹999 and
              above qualify for free delivery on eligible products. Final shipping cost
              is shown at checkout before you place your order.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">Estimated Delivery</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Metro cities: 3–5 business days after dispatch</li>
              <li>Tier 2 & 3 cities: 5–8 business days after dispatch</li>
              <li>Bulk or high-value orders may require scheduled delivery</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">Cash on Delivery (COD)</h2>
            <p>
              COD is available on eligible orders. Payment is collected at the time of
              delivery. Please ensure someone is available at the delivery address with
              the order amount ready.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">Damaged or Missing Items</h2>
            <p>
              If your shipment arrives damaged or items are missing, contact us within
              48 hours of delivery with photos and your order number. We will assist with
              replacement or resolution as per our returns policy.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary mb-3">Contact for Shipping Help</h2>
            <p>
              For shipping queries, email{" "}
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
        </div>
      </section>
    </div>
  );
}

export default ShippingDetails;
