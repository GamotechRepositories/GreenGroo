import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import ProductManageForm from "../../components/products/ProductManageForm";
import {
  createManagerFarmerProduct,
  getManagerFarmers,
  getManagerFarmerById,
  getManagerFarmerCrops,
  getVendorProductsCatalog,
} from "../../api/farmerApi";
import LoadingState from "../../components/ui/LoadingState";
import { managerProductPath } from "../../utils/cropLinks";
import { EXCEL_PAGE_SUB, EXCEL_PANEL, FORM_INPUT } from "../../utils/excelStyles";

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.farmers)) return value.farmers;
  if (Array.isArray(value?.crops)) return value.crops;
  if (Array.isArray(value?.products)) return value.products;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function farmerSelectId(farmer) {
  return farmer?.id || farmer?.farmerId || "";
}

function uniqueVendorProducts(products) {
  const seen = new Set();
  const list = [];
  for (const item of products) {
    const productName = String(item?.productName || item?.name || "").trim();
    if (!productName) continue;
    const variety = String(item.variety || item.varietyName || "").trim();
    const key = `${productName.toLowerCase()}:::${variety.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    list.push({
      id: item.productId || item.id,
      productName,
      variety,
      unit: item.unit || "Kg",
      image: item.image || item.productImage || "",
    });
  }
  return list.sort((a, b) => a.productName.localeCompare(b.productName) || a.variety.localeCompare(b.variety));
}

function ManagerProductAddPage() {
  const { farmerId: farmerIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lockedFarmerId = farmerIdParam || searchParams.get("farmerId") || "";
  const cropId = searchParams.get("cropId") || "";
  const cropName = searchParams.get("crop") || "";
  const variety = searchParams.get("variety") || "";
  const harvestDate = searchParams.get("harvestDate") || "";
  const unit = searchParams.get("unit") || "Kg";

  const [farmers, setFarmers] = useState([]);
  const [farmerId, setFarmerId] = useState(lockedFarmerId);
  const [farmerName, setFarmerName] = useState("");
  const [crops, setCrops] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const productCatalog = await getVendorProductsCatalog().catch(() => []);
        if (!cancelled) {
          setCatalogProducts(uniqueVendorProducts(asArray(productCatalog)));
        }
        if (!lockedFarmerId) {
          const list = await getManagerFarmers({ lite: true });
          if (!cancelled) setFarmers(asArray(list));
        }
        if (farmerId) {
          const [farmer, cropList] = await Promise.all([
            getManagerFarmerById(farmerId).catch(() => null),
            getManagerFarmerCrops(farmerId).catch(() => []),
          ]);
          if (!cancelled) {
            setFarmerName(farmer?.name || "");
            setCrops(asArray(cropList));
          }
        } else if (!cancelled) {
          setFarmerName("");
          setCrops([]);
        }
      } catch (err) {
        toast.error(err.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmerId, lockedFarmerId]);

  const backTo = lockedFarmerId
    ? `/manager/farmers/${lockedFarmerId}`
    : "/manager/products";

  const matchedCrop =
    crops.find((c) => (c.cropId || c.id) === cropId) || crops.find((c) => c.cropName === cropName) || null;

  if (loading) return <LoadingState rows={8} />;

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-2 sm:space-y-4">
      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
        {lockedFarmerId ? (
          <>
            <Link to="/manager/farmers" className="hover:text-[#217346]">
              Farmers
            </Link>
            <span>›</span>
            <Link to={backTo} className="hover:text-[#217346]">
              {farmerName || "Farmer"}
            </Link>
          </>
        ) : (
          <Link to="/manager/products" className="hover:text-[#217346]">
            My Products
          </Link>
        )}
        <span>›</span>
        <span className="font-semibold text-[#1F2937]">Add Product</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-2xl">Add Product</h1>
          <p className={`${EXCEL_PAGE_SUB} hidden sm:block`}>
            {farmerName ? `Add a product for ${farmerName}.` : "Select a farmer, then add a product."}
          </p>
        </div>
        <Link to={backTo} className="shrink-0 text-xs font-semibold text-[#217346] hover:underline sm:text-sm">
          Back
        </Link>
      </div>

      {!lockedFarmerId ? (
        <div className={`${EXCEL_PANEL} p-3 sm:p-4`}>
          <label className="mb-1 block text-[11px] font-semibold text-slate-600">Farmer *</label>
          <select
            className={FORM_INPUT}
            value={farmerId}
            onChange={(e) => setFarmerId(e.target.value)}
          >
            <option value="">Select farmer</option>
            {farmers.map((f) => (
              <option key={farmerSelectId(f)} value={farmerSelectId(f)}>
                {f.name} {f.mobile ? `· ${f.mobile}` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {farmerId ? (
        <div className={`${EXCEL_PANEL} p-2 sm:p-5`}>
          <ProductManageForm
            key={`${farmerId}-${matchedCrop?.cropId || matchedCrop?.id || cropId || "new"}`}
            crops={crops}
            catalogProducts={catalogProducts}
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
            draftLabel="Save Draft"
            publishLabel="Save & Go Live"
            onSubmit={async (values, publish) => {
              if (!farmerId) {
                toast.error("Select a farmer first");
                return;
              }
              setSubmitting(true);
              try {
                const saved = await createManagerFarmerProduct(farmerId, { ...values, publish });
                toast.success(publish ? "Product is live" : "Draft saved");
                navigate(managerProductPath(farmerId, saved.productId || saved.id));
              } catch (err) {
                toast.error(err.message || "Failed to save product");
              } finally {
                setSubmitting(false);
              }
            }}
          />
        </div>
      ) : (
        <p className="text-xs text-[#6B7280]">Select a farmer to continue.</p>
      )}
    </div>
  );
}

export default ManagerProductAddPage;
