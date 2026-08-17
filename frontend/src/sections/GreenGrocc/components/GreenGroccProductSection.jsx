import React from "react";
import SuggestedForYouSection from "../../../components/home/SuggestedForYouSection";

export function GreenGroccProductSection({ title = "Farm Fresh Picks", products }) {
  return <SuggestedForYouSection title={title} customProducts={products} />;
}

export default GreenGroccProductSection;
