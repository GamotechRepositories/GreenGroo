import React from "react";
import SuggestedForYouSection from "../../../components/home/SuggestedForYouSection";

export function SuperMallProductSection({ title = "Super Mall Mega Marketplace Deals", products }) {
  return (
    <SuggestedForYouSection
      title={title}
      subtitle="Top Brand Deals & Daily Essentials"
      customProducts={products}
    />
  );
}

export default SuperMallProductSection;

