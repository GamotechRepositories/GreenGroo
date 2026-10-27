import { useHotSellingProductsQuery } from "../../hooks/queries/useProductsQuery";
import HomeProductRow from "./HomeProductRow";

function HotSelling({ section = null, viewAllTo = "/hot-selling" }) {
  const { data: products = [], isLoading: loading } = useHotSellingProductsQuery({}, section);

  return (
    <HomeProductRow
      title="Hot Selling Products"
      viewAllTo={viewAllTo}
      products={products}
      loading={loading}
    />
  );
}

export default HotSelling;
