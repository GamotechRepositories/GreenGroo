import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteProduct, getProducts, updateProduct } from "../../api/farmerApi";
import { PRODUCT_STATUS, PRODUCT_UNITS } from "../../utils/constants";
import {
  EXCEL_BTN,
  EXCEL_BTN_DANGER,
  EXCEL_BTN_PRIMARY,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
  EXCEL_SELECT,
} from "../../utils/excelStyles";
import DataTable from "../ui/DataTable";
import LoadingState from "../ui/LoadingState";
import ConfirmDialog from "../ui/ConfirmDialog";
import EmptyState from "../ui/EmptyState";

const COMPACT_SELECT = `${EXCEL_SELECT} w-full min-w-0 px-1 py-0.5 text-[10px]`;
const COMPACT_BTN = `${EXCEL_BTN} px-1 py-0.5 text-[10px] leading-none`;
const COMPACT_BTN_DANGER = `${EXCEL_BTN_DANGER} px-1 py-0.5 text-[10px] leading-none`;

function formatHarvestDate(dateStr) {
  if (!dateStr) return "—";
  const parts = String(dateStr).split("-");
  if (parts.length !== 3) return dateStr;
  const [yyyy, mm, dd] = parts;
  return `${mm}/${dd}/${yyyy}`;
}

function getGradeQty(row, index) {
  if (row.grades?.[index]?.quantity != null) return row.grades[index].quantity;
  if (index === 0) return row.gradeAQty ?? 0;
  if (index === 1) return row.gradeBQty ?? 0;
  return 0;
}

function getAvailQty(row) {
  return Number(getGradeQty(row, 0)) + Number(getGradeQty(row, 1));
}

const INVENTORY_COLUMN_KEYS = [
  "image",
  "name",
  "category",
  "unit",
  "harvestDate",
  "farmLocation",
  "organic",
  "gradeA",
  "gradeB",
  "availableQuantity",
  "availableForDelivery",
  "status",
  "actions",
];

function ProductListTable({
  addPath = "/farmer/products/add",
  addLabel = "+ Add Product",
  emptyTitle = "No products yet",
  emptyDescription = "Add your first farm product to start selling.",
  emptyActionLabel = "Add Product",
  view = "full",
  onRowClick,
  selectedRowId,
  onProductDeleted,
  inventoryViewPath,
}) {
  const navigate = useNavigate();
  const { search } = useOutletContext() || {};
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ products: [], totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [rowUpdatingId, setRowUpdatingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setData(await getProducts({ q: search || "", status, sort, page, limit: 8 }));
    } catch (err) {
      toast.error(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, status, sort, page]);

  const handleStatusChange = async (productId, newStatus, currentStatus) => {
    if (newStatus === currentStatus) return;

    setRowUpdatingId(productId);
    try {
      await updateProduct(productId, { status: newStatus });
      setData((prev) => ({
        ...prev,
        products: prev.products
          .map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
          .filter((p) => !status || p.status === status),
      }));
      toast.success("Status updated");
    } catch (err) {
      toast.error(err.message || "Failed to update status");
      load();
    } finally {
      setRowUpdatingId(null);
    }
  };

  const handleUnitChange = async (productId, newUnit, currentUnit) => {
    if (newUnit === currentUnit) return;

    setRowUpdatingId(productId);
    try {
      await updateProduct(productId, { unit: newUnit });
      setData((prev) => ({
        ...prev,
        products: prev.products.map((p) => (p.id === productId ? { ...p, unit: newUnit } : p)),
      }));
      toast.success("Unit updated");
    } catch (err) {
      toast.error(err.message || "Failed to update unit");
      load();
    } finally {
      setRowUpdatingId(null);
    }
  };

  const handleDeliveryChange = async (productId, newValue, currentValue) => {
    const next = newValue === "yes";
    const current = currentValue !== false && currentValue !== "no";
    if (next === current) return;

    setRowUpdatingId(productId);
    try {
      await updateProduct(productId, { availableForDelivery: next });
      setData((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.id === productId ? { ...p, availableForDelivery: next } : p
        ),
      }));
      toast.success("Delivery setting updated");
    } catch (err) {
      toast.error(err.message || "Failed to update delivery setting");
      load();
    } finally {
      setRowUpdatingId(null);
    }
  };

  const handleInventoryView = (row) => {
    if (inventoryViewPath) {
      navigate(inventoryViewPath(row.id));
      return;
    }
    onRowClick?.(row);
  };

  const rowClickHandler =
    view === "inventory" && inventoryViewPath
      ? handleInventoryView
      : onRowClick || ((row) => navigate(`/farmer/products/${row.id}/edit`));

  const allColumns = [
    {
      key: "image",
      header: "Photo",
      width: "5%",
      render: (row) => {
        const imgSrc = row.imageUrl || row.images?.[0] || "/categories/grocery.webp";
        return (
          <img
            src={imgSrc}
            alt={row.name}
            className="h-7 w-7 rounded object-cover border border-[#E5E7EB]"
            onError={(e) => {
              e.currentTarget.src = "/categories/grocery.webp";
            }}
          />
        );
      },
    },
    {
      key: "name",
      header: "Product Name",
      width: "11%",
      wrap: true,
      render: (row) => (
        <span className="line-clamp-2 font-semibold text-[#1F2937]" title={row.name}>
          {row.name}
        </span>
      ),
    },
    { key: "category", header: "Category", width: "8%", wrap: true },
    {
      key: "unit",
      header: "Unit",
      width: "7%",
      render: (row) => (
        <select
          value={row.unit || PRODUCT_UNITS[0]}
          disabled={rowUpdatingId === row.id}
          onChange={(e) => handleUnitChange(row.id, e.target.value, row.unit)}
          className={COMPACT_SELECT}
        >
          {PRODUCT_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "harvestDate",
      header: "Harvest Date",
      width: "8%",
      render: (row) => <span className="tabular-nums">{formatHarvestDate(row.harvestDate)}</span>,
    },
    {
      key: "farmLocation",
      header: "Farm Location",
      width: "10%",
      wrap: true,
      render: (row) => (
        <span className="line-clamp-2" title={row.farmLocation || ""}>
          {row.farmLocation || "—"}
        </span>
      ),
    },
    {
      key: "organic",
      header: "Organic",
      width: "7%",
      wrap: true,
      render: (row) =>
        row.produceType === "non-organic" || row.organic === false ? "Non-Org" : "Organic",
    },
    {
      key: "gradeA",
      header: "Gr A (Kg)",
      width: "6%",
      align: "right",
      render: (row) => <span className="tabular-nums">{getGradeQty(row, 0)}</span>,
    },
    {
      key: "gradeB",
      header: "Gr B (Kg)",
      width: "6%",
      align: "right",
      render: (row) => <span className="tabular-nums">{getGradeQty(row, 1)}</span>,
    },
    {
      key: "availableQuantity",
      header: "Avail. Qty",
      width: "6%",
      align: "right",
      render: (row) => {
        const qty = view === "inventory" ? getAvailQty(row) : row.availableQuantity ?? row.stock ?? 0;
        return (
          <span className={`tabular-nums ${qty <= 0 ? "font-semibold text-[#DC2626]" : ""}`}>{qty}</span>
        );
      },
    },
    {
      key: "availableForDelivery",
      header: "Delivery",
      width: "7%",
      render: (row) => (
        <select
          value={row.availableForDelivery === false || row.availableForDelivery === "no" ? "no" : "yes"}
          disabled={rowUpdatingId === row.id}
          onChange={(e) => handleDeliveryChange(row.id, e.target.value, row.availableForDelivery)}
          className={COMPACT_SELECT}
        >
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "11%",
      render: (row) => (
        <select
          value={row.status}
          disabled={rowUpdatingId === row.id}
          onChange={(e) => handleStatusChange(row.id, e.target.value, row.status)}
          className={COMPACT_SELECT}
        >
          {PRODUCT_STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "13%",
      render: (row) => (
        <div className="flex flex-wrap gap-0.5">
          {view === "inventory" && inventoryViewPath ? (
            <Link to={inventoryViewPath(row.id)} className={COMPACT_BTN}>
              View
            </Link>
          ) : view === "inventory" ? (
            <button type="button" onClick={() => onRowClick?.(row)} className={COMPACT_BTN}>
              View
            </button>
          ) : (
            <Link to={`/farmer/products/${row.id}`} className={COMPACT_BTN}>
              View
            </Link>
          )}
          <Link
            to={
              view === "inventory"
                ? `/farmer/inventory/add?productId=${row.id}`
                : `/farmer/products/${row.id}/edit`
            }
            className={COMPACT_BTN}
          >
            Edit
          </Link>
          <button type="button" onClick={() => setDeleteId(row.id)} className={COMPACT_BTN_DANGER}>
            Del
          </button>
        </div>
      ),
    },
  ];

  const columns =
    view === "summary"
      ? allColumns.filter((col) => ["image", "name", "category", "harvestDate", "farmLocation", "actions"].includes(col.key))
      : view === "inventory"
        ? allColumns.filter((col) => INVENTORY_COLUMN_KEYS.includes(col.key))
        : allColumns;

  if (loading) return <LoadingState />;

  if (data.products.length === 0 && !status && !search) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          <Link to={addPath} className={EXCEL_BTN_PRIMARY}>
            {emptyActionLabel}
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className={EXCEL_PANEL}>
        <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className={EXCEL_SELECT}
            >
              <option value="">All statuses</option>
              {PRODUCT_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className={EXCEL_SELECT}>
              <option value="newest">Newest</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
              <option value="stock">Stock ↑</option>
            </select>
            <span className="text-[10px] text-[#6B7280]">{data.total} products</span>
          </div>
          <Link to={addPath} className={EXCEL_BTN_PRIMARY}>
            {addLabel}
          </Link>
        </div>

        {data.products.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-[#6B7280]">No products match your filters.</div>
        ) : (
          <DataTable
            columns={columns}
            rows={data.products}
            embedded
            compact
            selectedRowId={selectedRowId}
            onRowClick={rowClickHandler}
          />
        )}

        <div className="flex items-center justify-between border-t border-[#D4D4D4] bg-[#F2F2F2] px-2 py-1.5">
          <span className="text-[10px] text-[#6B7280]">
            Showing {data.products.length} of {data.total}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className={EXCEL_BTN}
            >
              Prev
            </button>
            <span className="min-w-[72px] text-center text-[10px] text-[#6B7280]">
              Page {page} / {data.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className={EXCEL_BTN}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title={view === "inventory" ? "Delete inventory?" : "Delete product?"}
        message={
          view === "inventory"
            ? "This will remove the product and its inventory from your catalog."
            : "This will remove the product from your catalog."
        }
        confirmLabel="Delete"
        danger
        loading={busy}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          setBusy(true);
          try {
            await deleteProduct(deleteId);
            toast.success(view === "inventory" ? "Inventory deleted" : "Product deleted");
            onProductDeleted?.(deleteId);
            setDeleteId(null);
            load();
          } catch (err) {
            toast.error(err.message || "Delete failed");
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}

export default ProductListTable;
