import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ProductForm from "../components/products/ProductForm";
import { createProduct } from "../api/farmerApi";

import { EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE } from "../utils/excelStyles";

function ProductAddPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Add Product</h1>
        <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>Create a new listing for your farm produce.</p>
      </div>
      <ProductForm
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
