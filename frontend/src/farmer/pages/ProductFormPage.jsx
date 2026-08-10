import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { farmerApi } from "../api/farmerApi";
import { VERIFICATION_STATUS } from "../utils/constants";
import PageHeader from "../components/ui/PageHeader";
import ProductForm from "../components/products/ProductForm";
import LoadingState from "../components/ui/LoadingState";

export default function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const verificationStatus = useSelector((s) => s.farmer.verificationStatus);
  const canSell = verificationStatus === VERIFICATION_STATUS.VERIFIED;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const { data } = await farmerApi.getProduct(id);
        setProduct(data);
      } catch (e) {
        toast.error(e.message);
        navigate("/farmer/products");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, navigate]);

  if (!canSell) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        You must be verified to add or edit products.{" "}
        <Link to="/farmer/documents" className="font-medium underline">
          Complete documents
        </Link>
      </div>
    );
  }

  if (loading) return <LoadingState />;

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await farmerApi.updateProduct(id, values);
        toast.success("Product updated");
        navigate(`/farmer/products/${id}`);
      } else {
        const { data } = await farmerApi.createProduct(values);
        toast.success("Product created");
        navigate(`/farmer/products/${data.id}`);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Product" : "Add Product"}
        breadcrumb={
          <Link to="/farmer/products" className="hover:text-[#2E7D32]">
            Products
          </Link>
        }
      />
      <div className="rounded-xl border border-[#E5E7EB] bg-white p-4 sm:p-6">
        <ProductForm
          initialValues={product}
          onSubmit={onSubmit}
          submitting={submitting}
          submitLabel={isEdit ? "Update Product" : "Create Product"}
        />
      </div>
    </div>
  );
}
