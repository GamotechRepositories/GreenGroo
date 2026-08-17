import React from "react";
import SuggestedForYouSection from "../../../components/home/SuggestedForYouSection";
import { SUPERMALL_PRODUCTS } from "../data/products";

export function SuperMallProductSection({ title = "Super Mall Mega Marketplace Deals", products }) {
  return (
    <SuggestedForYouSection
      title={title}
      subtitle="Top Brand Deals & Daily Essentials"
      customProducts={products || SUPERMALL_PRODUCTS}
    />
  );
}

export default SuperMallProductSection;
