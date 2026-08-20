import React from "react";
import SuggestedForYouSection from "../../../components/home/SuggestedForYouSection";

export function Ready2CookProductSection({ title = "Trending Prepped Veggies", products }) {
  return (
    <SuggestedForYouSection
      title={title}
      subtitle="100% Pre-Washed & Zero Preservatives"
      customProducts={products}
    />
  );
}

export default Ready2CookProductSection;

