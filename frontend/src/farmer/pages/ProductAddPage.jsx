import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ProductForm from "../components/products/ProductForm";
import { createProduct } from "../api/farmerApi";

import { EXCEL_PAGE_TITLE } from "../utils/excelStyles";

function ProductAddPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-2">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Add Product</h1>
      </div>
      <ProductForm
        mode="basic"
        submitting={submitting}
        onSubmit={async (values) => {
          setSubmitting(true);
          try {
            const product = await createProduct(values);
            toast.success("Product created");
            navigate(`/farmer/products/${product.id}`);
          } catch (err) {
            toast.error(err.message || "Failed to create product");
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </div>
  );
}

export default ProductAddPage;
