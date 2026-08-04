import { useHotSellingProductsQuery } from "../../hooks/queries/useProductsQuery";
import HomeProductRow from "./HomeProductRow";

function HotSelling() {
  const { data: products = [], isLoading: loading } = useHotSellingProductsQuery();

  return (
    <HomeProductRow
      title="Hot Selling Products"
      viewAllTo="/hot-selling"
      products={products}
      loading={loading}
    />
  );
}

export default HotSelling;
