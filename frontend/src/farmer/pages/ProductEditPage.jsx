import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ProductForm from "../components/products/ProductForm";
import LoadingState from "../components/ui/LoadingState";
import { getProductById, updateProduct } from "../api/farmerApi";

import { EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE } from "../utils/excelStyles";

function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setProduct(await getProductById(id));
      } catch (err) {
        toast.error(err.message || "Product not found");
        navigate("/farmer/products");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) return <LoadingState />;
  if (!product) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Edit Product</h1>
          <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>{product.name}</p>
        </div>
        <Link to={`/farmer/products/${id}`} className="text-xs font-semibold text-[#217346]">
          View details
        </Link>
      </div>
      <ProductForm
        defaultValues={{
          ...product,
          imageUrl: product.images?.[0] || "",
          availableQuantity: product.availableQuantity ?? product.stock,
          produceType: product.produceType ?? (product.organic ? "organic" : "non-organic"),
          availableForDelivery: product.availableForDelivery === false ? "no" : "yes",
          gradeAQty: product.gradeAQty ?? 0,
          gradeBQty: product.gradeBQty ?? 0,
          grades: product.grades?.length
            ? product.grades
            : [
                { label: "Grade A", quantity: product.gradeAQty ?? 0 },
                { label: "Grade B", quantity: product.gradeBQty ?? 0 },
              ],
          farmLocation: product.farmLocation ?? "",
        }}
        submitting={submitting}
        onSubmit={async (values) => {
          setSubmitting(true);
          try {
            await updateProduct(id, values);
            toast.success("Product updated");
            navigate(`/farmer/products/${id}`);
          } catch (err) {
            toast.error(err.message || "Update failed");
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </div>
  );
}

export default ProductEditPage;
