import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ProductForm from "../components/products/ProductForm";
import LoadingState from "../components/ui/LoadingState";
import { getProductById, updateProduct } from "../api/farmerApi";

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
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Edit Product</h1>
          <p className="mt-1 text-sm text-[#6B7280]">{product.name}</p>
        </div>
        <Link to={`/farmer/products/${id}`} className="text-sm font-semibold text-[#2E7D32]">
          View details
        </Link>
      </div>
      <ProductForm
        defaultValues={{
          ...product,
          imageUrl: product.images?.[0] || "",
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
