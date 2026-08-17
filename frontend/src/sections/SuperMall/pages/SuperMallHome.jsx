import React from "react";
import SuperMallHero from "../components/SuperMallHero";
import SuperMallBanner from "../components/SuperMallBanner";
import SuperMallCategories from "../components/SuperMallCategories";
import SuperMallOffers from "../components/SuperMallOffers";
import SuperMallProductSection from "../components/SuperMallProductSection";
import SuperMallBrands from "../components/SuperMallBrands";

export function SuperMallHome() {
  return (
    <div className="space-y-4">
      <SuperMallHero />
      <SuperMallBanner />
      <SuperMallCategories />
      <SuperMallOffers />
      <SuperMallBrands />
      <SuperMallProductSection title="Super Mall Marketplace Deals" />
    </div>
  );
}

export default SuperMallHome;
