import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getProductById, getStockHistory } from "../api/farmerApi";
import InventoryHistoryTable from "../components/inventory/InventoryHistoryTable";
import LoadingState from "../components/ui/LoadingState";
import StatusBadge from "../components/ui/StatusBadge";
import {
  EXCEL_BTN_PRIMARY,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
} from "../utils/excelStyles";

function formatHarvestDate(dateStr) {
  if (!dateStr) return "—";
  const parts = String(dateStr).split("-");
  if (parts.length !== 3) return dateStr;
  const [yyyy, mm, dd] = parts;
  return `${mm}/${dd}/${yyyy}`;
}

function getGradeQty(product, index) {
  if (product.grades?.[index]?.quantity != null) return product.grades[index].quantity;
  if (index === 0) return product.gradeAQty ?? 0;
  if (index === 1) return product.gradeBQty ?? 0;
  return 0;
}

function InventoryViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [productData, historyData] = await Promise.all([
          getProductById(id),
          getStockHistory(id),
        ]);
        setProduct(productData);
        setHistory(historyData);
      } catch (err) {
        toast.error(err.message || "Inventory not found");
        navigate("/farmer/inventory");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) return <LoadingState rows={6} />;
  if (!product) return null;

  const qty = getGradeQty(product, 0) + getGradeQty(product, 1);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <Link
            to="/farmer/inventory"
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-[#217346]"
          >
            ← Back to Inventory
          </Link>
          <h1 className={EXCEL_PAGE_TITLE}>{product.name}</h1>
          <StatusBadge status={product.status} />
        </div>
        <Link to={`/farmer/inventory/add?productId=${product.id}`} className={EXCEL_BTN_PRIMARY}>
          Edit Inventory
        </Link>
      </div>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Inventory Details</h2>
        <div className="grid gap-2 p-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Category" value={product.category} />
          <Detail label="Unit" value={product.unit} />
          <Detail label="Avail. Qty" value={`${qty}`} />
          <Detail label="Harvest Date" value={formatHarvestDate(product.harvestDate)} />
          <Detail label="Farm Location" value={product.farmLocation || "—"} />
          <Detail
            label="Organic"
            value={
              product.produceType === "non-organic" || product.organic === false
                ? "Non-Organic"
                : "Organic"
            }
          />
          <Detail label="Gr A (Kg)" value={getGradeQty(product, 0)} />
          <Detail label="Gr B (Kg)" value={getGradeQty(product, 1)} />
          <Detail
            label="Delivery"
            value={product.availableForDelivery === false ? "No" : "Yes"}
          />
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Inventory History – Farmer</h2>
        <InventoryHistoryTable
          rows={history}
          emptyMessage={`No inventory history for ${product.name}.`}
        />
      </section>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="border border-[#D4D4D4] bg-[#FAFAFA] px-2 py-1.5">
      <p className="text-[10px] font-semibold text-[#6B7280]">{label}</p>
      <p className="mt-0.5 font-medium text-[#1F2937]">{value}</p>
    </div>
  );
}

export default InventoryViewPage;
