import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ProductManageForm from "../components/products/ProductManageForm";
import LoadingState from "../components/ui/LoadingState";
import { getCrops, getMyProduct, updateMyProduct } from "../api/farmerApi";
import { EXCEL_PAGE_SUB, EXCEL_PANEL } from "../utils/excelStyles";

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
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-2 sm:space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-2xl">Edit Product</h1>
          <p className={`${EXCEL_PAGE_SUB} hidden truncate sm:block`}>{product.productName || product.name}</p>
        </div>
        <Link to={`/farmer/products/${id}`} className="shrink-0 text-xs font-semibold text-[#217346] hover:underline sm:text-sm">
          View
        </Link>
      </div>
      <div className={`${EXCEL_PANEL} p-2 sm:p-5`}>
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
