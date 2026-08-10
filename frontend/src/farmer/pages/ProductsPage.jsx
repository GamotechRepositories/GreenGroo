import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteProduct, getProducts } from "../api/farmerApi";
import { PRODUCT_STATUS } from "../utils/constants";
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
            className="h-10 w-10 rounded-lg object-cover"
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
          <Link to={`/farmer/products/${row.id}`} className="font-semibold text-[#2E7D32]">
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Products</h1>
          <p className="mt-1 text-sm text-[#6B7280]">{data.total} products</p>
        </div>
        <Link
          to="/farmer/products/add"
          className="rounded-xl bg-[#2E7D32] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#256628]"
        >
          + Add Product
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm"
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
          className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm"
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
            <Link
              to="/farmer/products/add"
              className="rounded-xl bg-[#2E7D32] px-4 py-2 text-sm font-bold text-white"
            >
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
              className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-sm text-[#6B7280]">
              Page {page} / {data.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm disabled:opacity-40"
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
