import { useState } from "react";
import { Link } from "react-router-dom";
import { LOGO_URL } from "./Header";
import { CONTACT_EMAIL, CONTACT_ADDRESS, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_TEL } from "../../config/contact";
import ShareWebsiteButton from "./ShareWebsiteButton";

const essentialLinks = [
  { to: "/", label: "Home" },
  { to: "/categories", label: "Categories" },
  { to: "/product", label: "Shop" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
  { to: "/support", label: "Support" },
];

const legalLinks = [
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/terms-and-conditions", label: "Terms & Conditions" },
  { to: "/shipping-details", label: "Shipping Details" },
];

function FooterToggleButton({ expanded, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-light px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
      aria-expanded={expanded}
    >
      {expanded ? "Hide footer" : "Show footer"}
      <svg
        className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

function FooterContent() {
  return (
    <>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:gap-10 lg:py-12">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={LOGO_URL} alt="GreenGrocc" className="h-10 w-auto object-contain" />
            <span className="text-lg font-extrabold text-primary">GreenGrocc</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">
            Your neighbourhood grocery store, online. Fresh fruits, vegetables, dairy, and daily
            essentials delivered fast to your doorstep.
          </p>
          <ShareWebsiteButton className="mt-4" />
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-text-primary">
            Quick Links
          </h4>
          <ul className="space-y-2.5 text-sm">
            {essentialLinks.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-text-secondary transition hover:text-primary">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-text-primary">
            Legal
          </h4>
          <ul className="space-y-2.5 text-sm">
            {legalLinks.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-text-secondary transition hover:text-primary">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-text-primary">
            Contact
          </h4>
          <ul className="space-y-2.5 text-sm text-text-secondary">
            <li className="leading-relaxed">{CONTACT_ADDRESS}</li>
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className="transition hover:text-primary">
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>
              <a href={CONTACT_PHONE_TEL} className="transition hover:text-primary">
                {CONTACT_PHONE_DISPLAY}
              </a>
            </li>
            <li className="text-text-muted">Mon – Sat: 8:00 AM – 9:00 PM</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border-light py-4 text-center text-xs text-text-muted sm:text-sm">
        © {new Date().getFullYear()} GreenGrocc. All rights reserved.
      </div>
    </>
  );
}

function Footer() {
  const [expanded, setExpanded] = useState(false);

  return (
    <footer className="mt-auto border-t border-border-light bg-white pb-20 text-text-primary lg:pb-0">
      {/* Mobile toggle */}
      <div className="mx-auto flex max-w-7xl justify-center px-4 py-4 sm:px-6 lg:hidden">
        <FooterToggleButton expanded={expanded} onClick={() => setExpanded((v) => !v)} />
      </div>

      {/* Mobile collapsible / desktop always visible */}
      <div className={`${expanded ? "block" : "hidden"} lg:block`}>
        <FooterContent />
      </div>
    </footer>
  );
}

export default Footer;
