import React from "react";
import { Link } from "react-router-dom";
import { LOGO_URL } from "./Header";
import {
  CONTACT_EMAIL,
  CONTACT_ADDRESS,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_TEL,
} from "../../config/contact";
import MaharashtraPrideBanner from "../home/MaharashtraPrideBanner";

export default function Footer() {
  return (
    <>
      {/* Banner moved above to prevent overlap with farmer's head */}
      <div className="w-full bg-[#fcfdfd] pb-12 sm:pb-16 lg:pb-32 xl:pb-40">
        <MaharashtraPrideBanner />
      </div>

      {/* Wrapper without any overflow-hidden so the farmer's head is never clipped */}
      <div className="relative w-full bg-[#fcfdfd] select-none">
        {/* Organic Curved Wave Transition (KisanKonnect-style gentle arch) */}
        <div className="w-full leading-none pointer-events-none select-none">
          <svg
            viewBox="0 0 1440 90"
            className="relative block w-full h-10 sm:h-16 lg:h-24 text-[#0a6d38] fill-current -mb-[1px]"
            preserveAspectRatio="none"
          >
            <path d="M0,45 C380,10 920,8 1440,35 L1440,90 L0,90 Z" />
          </svg>
        </div>

        {/* Main KisanKonnect-Style Green Footer */}
        <footer className="w-full bg-[#0a6d38] text-white pt-2 sm:pt-4 pb-20 lg:pb-8 relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center lg:items-end gap-8 lg:gap-10 xl:gap-14">
              {/* ========================================================
                  LEFT SIDE: Farmer with Fresh Vegetable Crate Image
                  (Positioned on the left side, head rising unclipped above the green curved wave)
                 ======================================================== */}
              <div className="shrink-0 w-full max-w-[290px] sm:max-w-[340px] lg:max-w-[420px] xl:max-w-[460px] flex justify-center lg:justify-start -mb-4 lg:-mb-8 z-20">
                <img
                  src="/assets/payment/compressed-kapil with Fresh Vegetable Crate.webp"
                  alt="GreenGrocc Farmer with Fresh Vegetable Crate"
                  className="w-full h-auto max-h-[380px] sm:max-h-[460px] lg:max-h-[520px] xl:max-h-[580px] object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.35)] mt-2 lg:-mt-24 xl:-mt-36 transition-transform hover:scale-[1.02] duration-300 pointer-events-auto"
                  loading="eager"
                />
              </div>

              {/* ========================================================
                  RIGHT SIDE: Logo Badge, Menu, Contacts, App Badges, Socials, Legal
                 ======================================================== */}
              <div className="flex-1 w-full flex flex-col justify-between py-2 sm:py-4 space-y-7 z-10">
                {/* Top Row: Brand Badge | MENU | CONTACTS */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 lg:gap-8 items-start">
                  {/* Brand / Logo Badge (White pill badge like KisanKonnect leaf badge) */}
                  <div className="sm:col-span-12 md:col-span-4 flex items-start">
                    <Link
                      to="/"
                      className="inline-flex items-center justify-center bg-white px-5 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-200 border border-white/60"
                    >
                      <img
                        src={LOGO_URL}
                        alt="GreenGrocc"
                        className="h-8 sm:h-9 w-auto object-contain"
                      />
                    </Link>
                  </div>

                  {/* MENU */}
                  <div className="sm:col-span-6 md:col-span-4">
                    <h4 className="text-xs sm:text-[13px] font-bold uppercase tracking-widest text-white mb-3 sm:mb-4">
                      MENU
                    </h4>
                    <ul className="space-y-2 text-xs sm:text-[13px] text-white/90 font-normal">
                      <li>
                        <Link to="/" className="hover:text-emerald-200 transition-colors">
                          Home
                        </Link>
                      </li>
                      <li>
                        <Link to="/about" className="hover:text-emerald-200 transition-colors">
                          About Us
                        </Link>
                      </li>
                      <li>
                        <Link to="/contact" className="hover:text-emerald-200 transition-colors">
                          Contact Us
                        </Link>
                      </li>
                      <li>
                        <Link to="/support" className="hover:text-emerald-200 transition-colors">
                          FAQs
                        </Link>
                      </li>
                      <li>
                        <Link to="/about" className="hover:text-emerald-200 transition-colors">
                          Why GreenGrocc?
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* CONTACTS */}
                  <div className="sm:col-span-6 md:col-span-4">
                    <h4 className="text-xs sm:text-[13px] font-bold uppercase tracking-widest text-white mb-3 sm:mb-4">
                      CONTACTS
                    </h4>
                    <div className="space-y-2 text-xs sm:text-[13px] text-white/90 font-normal leading-relaxed">
                      <p className="font-semibold text-white">
                        GreenGrocc Corporate Office
                      </p>
                      <p className="text-white/85 text-[11.5px] sm:text-xs leading-relaxed">
                        {CONTACT_ADDRESS}
                      </p>

                      <div className="pt-1.5 space-y-0.5">
                        <a
                          href={CONTACT_PHONE_TEL}
                          className="block text-white hover:text-emerald-200 transition-colors font-medium"
                        >
                          {CONTACT_PHONE_DISPLAY}
                        </a>
                        <a
                          href={`mailto:${CONTACT_EMAIL}`}
                          className="block text-white/90 hover:text-white transition-colors text-[11.5px] sm:text-xs truncate"
                        >
                          {CONTACT_EMAIL}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Row: DOWNLOAD THE APP with Badges & Social Icons */}
                <div className="space-y-3 pt-2">
                  <h5 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white">
                    DOWNLOAD THE APP
                  </h5>

                  <div className="flex flex-wrap items-center gap-3.5 sm:gap-5">
                    {/* App Store Badge (White Pill, Black Text, Apple icon) */}
                    <a
                      href="#"
                      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white text-black hover:bg-neutral-100 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.36-.56.65-.98 1.7-0.85 2.73.99.08 2.02-.49 2.58-1.24z" />
                      </svg>
                      <div className="text-left">
                        <div className="text-[8px] uppercase tracking-tight leading-none text-neutral-600 font-medium">
                          Download on the
                        </div>
                        <div className="text-[12px] font-bold leading-tight text-neutral-900">
                          App Store
                        </div>
                      </div>
                    </a>

                    {/* Google Play Badge (Black Pill, Google Play Icon) */}
                    <a
                      href="#"
                      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-black text-white hover:bg-neutral-900 border border-white/20 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M3.6 1.8c-.3.3-.4.8-.4 1.4v17.6c0 .6.1 1.1.4 1.4l9.4-9.4L3.6 1.8z"
                        />
                        <path
                          fill="#FBBC04"
                          d="M16.5 8.7l-3.5 4.1 3.5 4.1 4.7-2.7c1.3-.8 1.3-2 0-2.8l-4.7-2.7z"
                        />
                        <path
                          fill="#EA4335"
                          d="M13 12.8L3.6 22.2c.4.4 1.1.4 1.8 0l11.1-6.4-3.5-3z"
                        />
                        <path
                          fill="#34A853"
                          d="M13 12.8l3.5-3-11.1-6.4c-.7-.4-1.4-.4-1.8 0L13 12.8z"
                        />
                      </svg>
                      <div className="text-left">
                        <div className="text-[8px] uppercase tracking-tight leading-none text-neutral-400 font-medium">
                          Get it on
                        </div>
                        <div className="text-[12px] font-bold leading-tight text-white">
                          Google Play
                        </div>
                      </div>
                    </a>

                    {/* Pure White Social Icons in a row (Just like KisanKonnect) */}
                    <div className="flex items-center gap-4 text-white pl-1 sm:pl-2">
                      {/* Facebook */}
                      <a
                        href="#"
                        aria-label="Facebook"
                        className="hover:opacity-75 transition-opacity"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </a>

                      {/* Instagram */}
                      <a
                        href="#"
                        aria-label="Instagram"
                        className="hover:opacity-75 transition-opacity"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>

                      {/* LinkedIn */}
                      <a
                        href="#"
                        aria-label="LinkedIn"
                        className="hover:opacity-75 transition-opacity"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      </a>

                      {/* Twitter */}
                      <a
                        href="#"
                        aria-label="Twitter"
                        className="hover:opacity-75 transition-opacity"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.936 9.936 0 0024 4.59z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Legal & Copyright Bar (Single clean horizontal line like KisanKonnect) */}
                <div className="pt-5 border-t border-white/20 text-[11.5px] sm:text-xs text-white/85 flex flex-wrap items-center gap-2 sm:gap-2.5 font-normal">
                  <span>© {new Date().getFullYear()}, GreenGrocc</span>
                  <span className="text-white/60">|</span>
                  <Link to="/privacy-policy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                  <span className="text-white/60">|</span>
                  <Link to="/shipping-details" className="hover:text-white transition-colors">
                    Sitemap
                  </Link>
                  <span className="text-white/60">|</span>
                  <Link to="/terms-and-conditions" className="hover:text-white transition-colors">
                    Terms & Conditions
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
