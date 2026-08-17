import React from "react";
import SuggestedForYouSection from "../../../components/home/SuggestedForYouSection";
import { READY2COOK_PRODUCTS } from "../data/products";

export function Ready2CookProductSection({ title = "Trending Prepped Veggies", products }) {
  return (
    <SuggestedForYouSection
      title={title}
      subtitle="100% Pre-Washed & Zero Preservatives"
      customProducts={products || READY2COOK_PRODUCTS}
    />
  );
}

export default Ready2CookProductSection;
