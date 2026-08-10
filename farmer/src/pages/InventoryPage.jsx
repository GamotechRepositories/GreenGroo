import ProductListTable from "../components/products/ProductListTable";
import { EXCEL_PAGE_TITLE } from "../utils/excelStyles";

function InventoryPage() {
  return (
    <div className="space-y-4">
      <h1 className={EXCEL_PAGE_TITLE}>Inventory</h1>
      <ProductListTable
        view="inventory"
        addPath="/farmer/inventory/add"
        addLabel="+ Add Inventory"
        emptyTitle="No inventory yet"
        emptyDescription="Add your first inventory entry."
        emptyActionLabel="Add Inventory"
        inventoryViewPath={(productId) => `/farmer/inventory/${productId}`}
      />
    </div>
  );
}

export default InventoryPage;
