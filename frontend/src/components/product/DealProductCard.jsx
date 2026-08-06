import QuickCommerceProductCard from "./QuickCommerceProductCard";

/**
 * Desktop/grid product card — same Blinkit design as QuickCommerceProductCard.
 */
function DealProductCard(props) {
  return <QuickCommerceProductCard {...props} layout="grid" />;
}

export default DealProductCard;
