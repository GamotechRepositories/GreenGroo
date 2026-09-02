import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import ProductManageForm from "../components/products/ProductManageForm";
import { createMyProduct, getCrops } from "../api/farmerApi";
import LoadingState from "../components/ui/LoadingState";
import { EXCEL_PAGE_SUB, EXCEL_PANEL } from "../utils/excelStyles";

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
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-2 sm:space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-2xl">Add Product</h1>
          <p className={`${EXCEL_PAGE_SUB} hidden sm:block`}>
            Link this product to a crop, then save as draft or publish for approval.
          </p>
        </div>
        <Link to="/farmer/products" className="shrink-0 text-xs font-semibold text-[#217346] hover:underline sm:text-sm">
          Back
        </Link>
      </div>
      {crops.length === 0 ? (
        <p className="text-[11px] text-[#B45309] sm:text-xs">
          Add a crop first, then create a product.{" "}
          <Link to="/farmer/crops/add" className="font-semibold text-[#217346] hover:underline">
            Add Crop
          </Link>
        </p>
      ) : null}
      <div className={`${EXCEL_PANEL} p-2 sm:p-5`}>
        <ProductManageForm
          key={matchedCrop?.cropId || matchedCrop?.id || cropId || "new"}
          crops={crops}
          initialProduct={{
            productName: matchedCrop?.cropName || cropName,
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
