import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import ProductManageForm from "../../components/products/ProductManageForm";
import {
  createManagerFarmerProduct,
  getManagerFarmers,
  getManagerFarmerById,
  getManagerFarmerCrops,
} from "../../api/farmerApi";
import LoadingState from "../../components/ui/LoadingState";
import { EXCEL_PAGE_SUB, EXCEL_PANEL, FORM_INPUT } from "../../utils/excelStyles";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function ManagerProductAddPage() {
  const { farmerId: farmerIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lockedFarmerId = farmerIdParam || searchParams.get("farmerId") || "";

  const [farmers, setFarmers] = useState([]);
  const [farmerId, setFarmerId] = useState(lockedFarmerId);
  const [farmerName, setFarmerName] = useState("");
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
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
    ? `/farmer/manager/farmers/${lockedFarmerId}`
    : "/farmer/manager/products";

  if (loading) return <LoadingState rows={8} />;

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 space-y-2 sm:space-y-4">
      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
        {lockedFarmerId ? (
          <>
            <Link to="/farmer/manager/farmers" className="hover:text-[#217346]">
              Farmers
            </Link>
            <span>›</span>
            <Link to={backTo} className="hover:text-[#217346]">
              {farmerName || "Farmer"}
            </Link>
          </>
        ) : (
          <Link to="/farmer/manager/products" className="hover:text-[#217346]">
            All Products
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
              <option key={f.id} value={f.id}>
                {f.name} {f.mobile ? `· ${f.mobile}` : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {farmerId && crops.length === 0 ? (
        <p className="text-[11px] text-[#B45309] sm:text-xs">
          Add a crop for this farmer first, then create a product.{" "}
          <Link
            to={`/farmer/manager/farmers/${encodeURIComponent(farmerId)}/crops/add`}
            className="font-semibold text-[#217346] hover:underline"
          >
            Add Crop
          </Link>
        </p>
      ) : null}

      {farmerId ? (
        <div className={`${EXCEL_PANEL} p-2 sm:p-5`}>
          <ProductManageForm
            key={farmerId}
            crops={crops}
            submitting={submitting}
            draftLabel="Save Draft"
            publishLabel="Save & Go Live"
            onSubmit={async (values, publish) => {
              setSubmitting(true);
              try {
                await createManagerFarmerProduct(farmerId, { ...values, publish });
                toast.success(publish ? "Product is live" : "Draft saved");
                navigate(backTo);
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
