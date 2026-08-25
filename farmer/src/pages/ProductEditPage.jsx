import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ProductManageForm from "../components/products/ProductManageForm";
import LoadingState from "../components/ui/LoadingState";
import { getCrops, getMyProduct, updateMyProduct } from "../api/farmerApi";
import { EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE, EXCEL_PANEL } from "../utils/excelStyles";

function ProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState(null);
  const [crops, setCrops] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [productData, cropData] = await Promise.all([getMyProduct(id), getCrops()]);
        setProduct(productData);
        setCrops(cropData);
      } catch (err) {
        toast.error(err.message || "Product not found");
        navigate("/farmer/products");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) return <LoadingState rows={8} />;
  if (!product) return null;

  const locked = product.status === "Pending Approval";

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Edit Product</h1>
          <p className={EXCEL_PAGE_SUB}>{product.productName || product.name}</p>
        </div>
        <Link to={`/farmer/products/${id}`} className="text-xs font-semibold text-[#217346]">
          View details
        </Link>
      </div>
      <div className={`${EXCEL_PANEL} p-3`}>
        <ProductManageForm
          key={product.productId || product.id}
          crops={crops}
          initialProduct={product}
          submitting={submitting}
          locked={locked}
          onSubmit={async (values, publish) => {
            setSubmitting(true);
            try {
              await updateMyProduct(id, { ...values, publish });
              toast.success(publish ? "Submitted for approval" : "Product updated");
              navigate(`/farmer/products/${id}`);
            } catch (err) {
              toast.error(err.message || "Failed to update product");
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </div>
    </div>
  );
}

export default ProductEditPage;
