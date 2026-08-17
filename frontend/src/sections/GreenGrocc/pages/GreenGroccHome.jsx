import React from "react";
import GreenGroccHero from "../components/GreenGroccHero";
import GreenGroccCategories from "../components/GreenGroccCategories";
import GreenGroccProductSection from "../components/GreenGroccProductSection";
import GreenGroccOffers from "../components/GreenGroccOffers";
import GreenGroccFeaturedVendors from "../components/GreenGroccFeaturedVendors";
import HomeAllCategoryProducts from "../../../components/grocery/HomeAllCategoryProducts";

export function GreenGroccHome() {
  return (
    <div className="space-y-4">
      <GreenGroccHero />
      <GreenGroccCategories />
      <GreenGroccOffers />
      <GreenGroccProductSection title="Fresh Farm Picks" />
      <GreenGroccFeaturedVendors />
      <HomeAllCategoryProducts limitPerCategory={20} />
    </div>
  );
}

export default GreenGroccHome;
