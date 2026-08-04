import FeaturedProductsPage from "./FeaturedProductsPage";

function JustArrivedPage() {
  return (
    <FeaturedProductsPage
      title="Just Arrived"
      filterType="justArrived"
      emptyMessage="No just arrived products yet."
    />
  );
}

export default JustArrivedPage;
