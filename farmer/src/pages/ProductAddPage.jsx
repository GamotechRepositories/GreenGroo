import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import ProductManageForm from "../components/products/ProductManageForm";
import { createMyProduct, getCrops } from "../api/farmerApi";
import LoadingState from "../components/ui/LoadingState";
import { EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE, EXCEL_PANEL } from "../utils/excelStyles";

function ProductAddPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const cropId = searchParams.get("cropId") || "";
  const cropName = searchParams.get("crop") || "";
  const variety = searchParams.get("variety") || "";
  const harvestDate = searchParams.get("harvestDate") || "";
  const unit = searchParams.get("unit") || "Kg";

  useEffect(() => {
    (async () => {
      try {
        setCrops(await getCrops());
      } catch (err) {
        toast.error(err.message || "Failed to load crops");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const matchedCrop = crops.find((c) => (c.cropId || c.id) === cropId) || crops.find((c) => c.cropName === cropName);

  if (loading) return <LoadingState rows={8} />;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Add Product</h1>
        <p className={EXCEL_PAGE_SUB}>
          Link this product to a crop, then save as draft or publish for approval.{" "}
          <Link to="/farmer/products" className="font-semibold text-[#217346] hover:underline">
            Back to My Products
          </Link>
        </p>
      </div>
      {crops.length === 0 ? (
        <p className="text-xs text-[#B45309]">
          Add a crop first, then create a product.{" "}
          <Link to="/farmer/crops/add" className="font-semibold text-[#217346] hover:underline">
            Add Crop
          </Link>
        </p>
      ) : null}
      <div className={`${EXCEL_PANEL} p-3`}>
        <ProductManageForm
          key={matchedCrop?.cropId || matchedCrop?.id || cropId || "new"}
          crops={crops}
          initialProduct={{
            productName: cropName,
            cropId: matchedCrop?.cropId || matchedCrop?.id || cropId,
            cropName: matchedCrop?.cropName || cropName,
            variety: variety || matchedCrop?.variety || "",
            harvestDate: harvestDate || matchedCrop?.expectedHarvestDate || "",
            unit: unit || matchedCrop?.unit || "Kg",
            farmingType: matchedCrop?.farmingType || "",
            media: { cropPhotos: matchedCrop?.photos || [] },
          }}
          submitting={submitting}
          onSubmit={async (values, publish) => {
            setSubmitting(true);
            try {
              const saved = await createMyProduct({ ...values, publish });
              toast.success(publish ? "Submitted for approval" : "Draft saved");
              navigate(`/farmer/products/${saved.productId || saved.id}`);
            } catch (err) {
              toast.error(err.message || "Failed to save product");
            } finally {
              setSubmitting(false);
            }
          }}
        />
      </div>
    </div>
  );
}

export default ProductAddPage;
