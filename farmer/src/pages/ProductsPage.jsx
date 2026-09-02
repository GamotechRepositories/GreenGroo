import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteMyProduct, getMyProducts } from "../api/farmerApi";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import { formatProductPrice } from "../utils/productActions";
import { formatCropDate, formatProductBusinessId } from "../utils/cropLinks";
import {
  EXCEL_BTN,
  EXCEL_BTN_DANGER,
  EXCEL_BTN_PRIMARY,
  EXCEL_CELL,
  EXCEL_HEAD,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_TABLE,
  EXCEL_WRAP,
} from "../utils/excelStyles";

const ACTION =
  "inline-flex h-7 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-1 text-[10px] font-semibold text-slate-700 whitespace-nowrap hover:bg-slate-50";
const ACTION_DANGER =
  "inline-flex h-7 w-full items-center justify-center rounded-md border border-red-100 bg-white px-1 text-[10px] font-semibold text-red-600 whitespace-nowrap hover:bg-red-50";
const DESKTOP_BTN =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-700 whitespace-nowrap hover:bg-slate-50";
const DESKTOP_BTN_DANGER =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-white px-2.5 text-[11px] font-semibold text-red-600 whitespace-nowrap hover:bg-red-50";
const ACTION_COL = "w-[210px] min-w-[210px]";

function productKey(product) {
  return product.productId || product.id;
}

function productPhoto(product) {
  return product.media?.mainPhoto || product.image || "";
}

function ProductIdLabel({ product, className = "" }) {
  const id = formatProductBusinessId(product);
  return (
    <p className={`font-mono font-semibold tracking-wide text-emerald-700 ${className}`} title={id}>
      {id}
    </p>
  );
}

function ProductPhoto({ src, name, className }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <div className={`flex items-center justify-center bg-emerald-50 text-emerald-800 ${className}`}>
        <span className="text-sm font-bold">{String(name || "P").slice(0, 1).toUpperCase()}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={name || "Product"}
      className={`object-cover ${className}`}
      onError={() => setBroken(true)}
    />
  );
}

function ProductActions({ product, onDelete, compact = false }) {
  const id = productKey(product);
  const btn = compact ? ACTION : DESKTOP_BTN;
  const danger = compact ? ACTION_DANGER : DESKTOP_BTN_DANGER;

  const buttons = (
    <>
      <Link to={`/farmer/products/${id}`} className={btn}>
        View
      </Link>
      <Link to={`/farmer/products/${id}/edit`} className={btn}>
        Edit
      </Link>
      <button type="button" className={danger} onClick={onDelete}>
        Delete
      </button>
    </>
  );

  if (compact) {
    return <div className="mt-2 grid grid-cols-3 gap-1">{buttons}</div>;
  }

  return <div className="flex flex-nowrap items-center justify-end gap-1">{buttons}</div>;
}

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setProducts(await getMyProducts());
    } catch (err) {
      toast.error(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async () => {
    try {
      await deleteMyProduct(deleteId);
      toast.success("Product deleted");
      setDeleteId("");
      await load();
    } catch (err) {
      toast.error(err.message || "Failed to delete product");
    }
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className={EXCEL_PAGE_TITLE}>My Products</h1>
          <p className={`${EXCEL_PAGE_SUB} hidden sm:block`}>
            Products linked to your crops. Publish for manager or vendor approval before they go live.
          </p>
        </div>
        <Link to="/farmer/products/add" className={`${EXCEL_BTN_PRIMARY} h-9 shrink-0 px-3 text-sm sm:h-10 sm:px-4`}>
          Add Product
        </Link>
      </div>

      {loading ? (
        <LoadingState rows={6} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Create a product from a crop to start listing harvest."
          action={
            <Link to="/farmer/products/add" className={EXCEL_BTN_PRIMARY}>
              Add Product
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-2 lg:hidden">
            {products.map((product) => {
              const id = productKey(product);
              const name = product.productName || product.name;
              return (
                <article key={id} className={`${EXCEL_PANEL} p-2.5`}>
                  <div className="flex items-center gap-2.5">
                    <ProductPhoto src={productPhoto(product)} name={name} className="h-14 w-14 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 truncate text-[13px] font-bold text-slate-900">
                          {name}
                          {product.variety ? (
                            <span className="font-medium text-slate-500"> · {product.variety}</span>
                          ) : null}
                        </p>
                        <StatusBadge status={product.stockStatus || product.status} className="max-w-[46%] shrink-0" />
                      </div>
                      <ProductIdLabel product={product} className="truncate text-[10px]" />
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">
                        {product.availableQuantity || 0} {product.unit || "Kg"} · {formatCropDate(product.harvestDate)}
                        {product.pricePerKg ? ` · ${formatProductPrice(product.pricePerKg, product.unit)}` : ""}
                      </p>
                    </div>
                  </div>
                  <ProductActions product={product} compact onDelete={() => setDeleteId(id)} />
                </article>
              );
            })}
          </div>

          <div className={`${EXCEL_WRAP} hidden min-w-0 lg:block`}>
            <table className={`${EXCEL_TABLE} w-full min-w-[980px]`}>
              <colgroup>
                <col className="w-[200px]" />
                <col className="w-[240px]" />
                <col className="w-[110px]" />
                <col className="w-[120px]" />
                <col className="w-[120px]" />
                <col className="w-[150px]" />
                <col className="w-[210px]" />
              </colgroup>
              <thead>
                <tr>
                  {["Product", "Product ID", "Crop", "Qty", "Harvest", "Status"].map((h) => (
                    <th key={h} className={`${EXCEL_HEAD} whitespace-nowrap`}>
                      {h}
                    </th>
                  ))}
                  <th className={`${EXCEL_HEAD} ${ACTION_COL} sticky right-0 z-20 whitespace-nowrap border-l border-slate-200 bg-slate-50 text-right`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const id = productKey(product);
                  const name = product.productName || product.name;
                  return (
                    <tr key={`row-${id}`} className="group align-middle hover:bg-slate-50">
                      <td className={EXCEL_CELL}>
                        <div className="flex items-center gap-2.5">
                          <ProductPhoto src={productPhoto(product)} name={name} className="h-9 w-9 shrink-0 rounded-lg" />
                          <span className="truncate font-semibold text-slate-900">{name}</span>
                        </div>
                      </td>
                      <td className={EXCEL_CELL}>
                        <ProductIdLabel product={product} className="whitespace-nowrap text-[11px]" />
                      </td>
                      <td className={`${EXCEL_CELL} whitespace-nowrap`}>{product.cropName || "—"}</td>
                      <td className={`${EXCEL_CELL} whitespace-nowrap`}>
                        {product.availableQuantity || 0} {product.unit || "Kg"}
                      </td>
                      <td className={`${EXCEL_CELL} whitespace-nowrap`}>{formatCropDate(product.harvestDate)}</td>
                      <td className={EXCEL_CELL}>
                        <StatusBadge status={product.stockStatus || product.status} />
                      </td>
                      <td className={`${EXCEL_CELL} ${ACTION_COL} sticky right-0 z-10 border-l border-slate-200 bg-white group-hover:bg-slate-50`}>
                        <ProductActions product={product} onDelete={() => setDeleteId(id)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal
        open={Boolean(deleteId)}
        title="Delete product?"
        onClose={() => setDeleteId("")}
        footer={
          <>
            <button type="button" className={EXCEL_BTN} onClick={() => setDeleteId("")}>
              Cancel
            </button>
            <button type="button" className={EXCEL_BTN_DANGER} onClick={onDelete}>
              Delete
            </button>
          </>
        }
      >
        <p>Only draft products can be deleted. This cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default ProductsPage;
