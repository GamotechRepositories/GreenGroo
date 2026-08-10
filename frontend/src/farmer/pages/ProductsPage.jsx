import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteProduct, getProducts } from "../api/farmerApi";
import { PRODUCT_STATUS } from "../utils/constants";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_SELECT,
} from "../utils/excelStyles";
import DataTable from "../components/ui/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";

function ProductsPage() {
  const { search } = useOutletContext() || {};
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ products: [], totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [busy, setBusy] = useState(false);

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

  const columns = [
    {
      key: "name",
      header: "Product",
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.images?.[0] || "/categories/grocery.webp"}
            alt=""
            className="h-8 w-8 object-cover"
          />
          <div>
            <p className="font-semibold">{row.name}</p>
            <p className="text-xs text-[#6B7280]">{row.sku}</p>
          </div>
        </div>
      ),
    },
    { key: "category", header: "Category" },
    {
      key: "price",
      header: "Price",
      render: (row) => `₹${row.sellingPrice}`,
    },
    { key: "stock", header: "Stock" },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Link to={`/farmer/products/${row.id}`} className="font-semibold text-[#217346]">
            View
          </Link>
          <Link to={`/farmer/products/${row.id}/edit`} className="font-semibold text-[#1F2937]">
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setDeleteId(row.id)}
            className="font-semibold text-[#DC2626]"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Products</h1>
          <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>{data.total} products</p>
        </div>
        <Link to="/farmer/products/add" className={EXCEL_BTN_PRIMARY}>
          + Add Product
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
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
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={EXCEL_SELECT}
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
          <option value="stock">Stock ↑</option>
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : data.products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Add your first farm product to start selling."
          action={
            <Link to="/farmer/products/add" className={EXCEL_BTN_PRIMARY}>
              Add Product
            </Link>
          }
        />
      ) : (
        <>
          <DataTable columns={columns} rows={data.products} />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className={EXCEL_BTN}
            >
              Prev
            </button>
            <span className="text-xs text-[#6B7280]">
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
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete product?"
        message="This will remove the product from your catalog."
        confirmLabel="Delete"
        danger
        loading={busy}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          setBusy(true);
          try {
            await deleteProduct(deleteId);
            toast.success("Product deleted");
            setDeleteId(null);
            load();
          } catch (err) {
            toast.error(err.message || "Delete failed");
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

export default ProductsPage;
