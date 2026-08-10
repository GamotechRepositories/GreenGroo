import { EXCEL_PAGE_TITLE } from "../utils/excelStyles";
import ProductListTable from "../components/products/ProductListTable";

function ProductsPage() {
  return (
    <div className="space-y-2">
      <h1 className={EXCEL_PAGE_TITLE}>Products</h1>
      <ProductListTable view="summary" />
    </div>
  );
}

export default ProductsPage;
