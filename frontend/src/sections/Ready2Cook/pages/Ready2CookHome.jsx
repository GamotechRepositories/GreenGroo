import React from "react";
import Ready2CookHero from "../components/Ready2CookHero";
import Ready2CookBanner from "../components/Ready2CookBanner";
import Ready2CookCategories from "../components/Ready2CookCategories";
import Ready2CookProductSection from "../components/Ready2CookProductSection";
import Ready2CookOffers from "../components/Ready2CookOffers";

export function Ready2CookHome() {
  return (
    <div className="space-y-4">
      <Ready2CookHero />
      <Ready2CookBanner />
      <Ready2CookCategories />
      <Ready2CookOffers />
      <Ready2CookProductSection title="Fast-Prep Ingredients & Mixes" />
    </div>
  );
}

export default Ready2CookHome;
