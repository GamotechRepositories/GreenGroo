import FeaturedProductsPage from "./FeaturedProductsPage";

function HotSellingPage() {
  return (
    <FeaturedProductsPage
      title="Hot Selling Products"
      filterType="hotSelling"
      emptyMessage="No hot selling products yet."
    />
  );
}

export default HotSellingPage;
