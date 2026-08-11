import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getProductById, getProductGradeChart } from "../api/farmerApi";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import { EXCEL_BTN_PRIMARY, EXCEL_PAGE_TITLE } from "../utils/excelStyles";
import ProductGradeChart from "../components/products/ProductGradeChart";

function formatHarvestDate(dateStr) {
  if (!dateStr) return "—";
  const parts = String(dateStr).split("-");
  if (parts.length !== 3) return dateStr;
  const [yyyy, mm, dd] = parts;
  return `${mm}/${dd}/${yyyy}`;
}

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [gradeRows, setGradeRows] = useState([]);
  const [gradeSummary, setGradeSummary] = useState({
    totalRupees: 0,
    deposited: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [productData, chartData] = await Promise.all([
          getProductById(id),
          getProductGradeChart(id),
        ]);
        setProduct(productData);
        setGradeRows(chartData.rows || []);
        setGradeSummary(
          chartData.summary || { totalRupees: 0, deposited: 0, balance: 0 }
        );
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

  const imageSrc = product.imageUrl || product.images?.[0] || "/categories/grocery.webp";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
          <Link
            to="/farmer/products"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[#6B7280] hover:text-[#2E7D32]"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Back to products
          </Link>
          <span className="hidden h-4 w-px bg-[#E5E7EB] sm:block" aria-hidden="true" />
          <h1 className={`truncate ${EXCEL_PAGE_TITLE}`}>{product.name}</h1>
          <StatusBadge status={product.status} />
          {product.category ? (
            <span className="text-sm text-[#6B7280]">{product.category}</span>
          ) : null}
        </div>
        <Link
          to={`/farmer/products/${id}/edit`}
          className={`shrink-0 ${EXCEL_BTN_PRIMARY}`}
        >
          Edit Product
        </Link>
      </div>

      {/* Product Summary Header Card */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-[#D4D4D4] bg-white p-4 shadow-sm">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-[#E5E7EB] bg-[#FAFAFA]">
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/categories/grocery.webp";
            }}
          />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <span className="block font-semibold text-[#6B7280]">Harvest Date</span>
            <span className="font-medium text-[#1F2937]">{formatHarvestDate(product.harvestDate)}</span>
          </div>
          <div>
            <span className="block font-semibold text-[#6B7280]">Farm Location</span>
            <span className="font-medium text-[#1F2937]">{product.farmLocation || "—"}</span>
          </div>
          <div>
            <span className="block font-semibold text-[#6B7280]">Type</span>
            <span className="font-medium text-[#1F2937]">
              {product.produceType === "non-organic" || product.organic === false ? "Non-Organic" : "Organic"}
            </span>
          </div>
          <div>
            <span className="block font-semibold text-[#6B7280]">Available Qty</span>
            <span className="font-medium text-[#1F2937]">{product.availableQuantity ?? product.stock ?? 0} {product.unit || "Kg"}</span>
          </div>
        </div>
      </div>

      <ProductGradeChart rows={gradeRows} summary={gradeSummary} />
    </div>
  );
}

export default ProductDetailPage;
