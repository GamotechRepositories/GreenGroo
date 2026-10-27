import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteManagerFarmerProduct, getManagerAllInventory } from "../api/farmerApi";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";
import {
  EXCEL_BTN,
  EXCEL_BTN_DANGER,
  EXCEL_BTN_PRIMARY,
  EXCEL_CELL,
  EXCEL_HEAD,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_TABLE,
  EXCEL_WRAP,
} from "../utils/excelStyles";
import { formatCropDate, managerInventoryAddPath, managerInventoryViewPath } from "../utils/cropLinks";

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

function farmerIdOf(product) {
  return String(product.farmerId || "").trim();
}

function getGradeQty(row, index) {
  if (row.grades?.[index]?.quantity != null) return Number(row.grades[index].quantity) || 0;
  if (index === 0) return Number(row.gradeAQty ?? 0);
  if (index === 1) return Number(row.gradeBQty ?? 0);
  return 0;
}

function getAvailQty(row) {
  return getGradeQty(row, 0) + getGradeQty(row, 1);
}

function productPhoto(product) {
  return product.media?.mainPhoto || product.image || product.imageUrl || "";
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
      loading="lazy"
      decoding="async"
      className={`object-cover ${className}`}
      onError={() => setBroken(true)}
    />
  );
}

function InventoryActions({ product, onDelete, compact = false }) {
  const id = productKey(product);
  const farmerId = farmerIdOf(product);
  const view = managerInventoryViewPath(farmerId, id);
  const edit = managerInventoryAddPath(farmerId, id);
  const btn = compact ? ACTION : DESKTOP_BTN;
  const danger = compact ? ACTION_DANGER : DESKTOP_BTN_DANGER;
  const buttons = (
    <>
      <Link to={view} className={btn}>View</Link>
      <Link to={edit} className={btn}>Edit</Link>
      <button type="button" className={danger} onClick={() => onDelete(product)}>Delete</button>
    </>
  );
  if (compact) return <div className="mt-2 grid grid-cols-3 gap-1">{buttons}</div>;
  return <div className="flex flex-nowrap items-center justify-end gap-1">{buttons}</div>;
}

function groupByFarmer(list) {
  const map = new Map();
  for (const product of list) {
    const key = farmerIdOf(product) || product.farmerName || "unknown";
    if (!map.has(key)) {
      map.set(key, {
        farmerId: farmerIdOf(product),
        farmerName: product.farmerName || "Farmer",
        items: [],
      });
    }
    map.get(key).items.push(product);
  }
  return Array.from(map.values()).sort((a, b) => a.farmerName.localeCompare(b.farmerName));
}

function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const selectedFarmerId = searchParams.get("farmerId") || "";

  const load = async () => {
    setLoading(true);
    try {
      const data = await getManagerAllInventory();
      setFarmers(Array.isArray(data?.farmers) ? data.farmers : []);
      setProducts(Array.isArray(data?.inventory) ? data.inventory : []);
    } catch (err) {
      toast.error(err.message || "Failed to load inventory");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!selectedFarmerId) return products;
    return products.filter((p) => farmerIdOf(p) === selectedFarmerId);
  }, [products, selectedFarmerId]);

  const groups = useMemo(() => groupByFarmer(filtered), [filtered]);

  const onDelete = async () => {
    if (!deleteProduct) return;
    try {
      await deleteManagerFarmerProduct(farmerIdOf(deleteProduct), productKey(deleteProduct));
      toast.success("Inventory deleted");
      setDeleteProduct(null);
      await load();
    } catch (err) {
      toast.error(err.message || "Failed to delete inventory");
    }
  };

  const addPath = managerInventoryAddPath(selectedFarmerId);

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className={EXCEL_PAGE_TITLE}>Inventory</h1>
          <p className={`${EXCEL_PAGE_SUB} hidden sm:block`}>
            Stock shown farmer-wise. Adding inventory saves it on that farmer only.
          </p>
        </div>
        <Link to={addPath} className={`${EXCEL_BTN_PRIMARY} h-9 shrink-0 px-3 text-sm sm:h-10 sm:px-4`}>
          + Add Inventory
        </Link>
      </div>

      <select
        className={`${EXCEL_INPUT} max-w-xs`}
        value={selectedFarmerId}
        onChange={(e) => {
          const next = new URLSearchParams(searchParams);
          if (e.target.value) next.set("farmerId", e.target.value);
          else next.delete("farmerId");
          setSearchParams(next, { replace: true });
        }}
      >
        <option value="">All Farmers</option>
        {farmers.map((f) => (
          <option key={f.id || f.farmerId} value={f.id || f.farmerId}>
            {f.name}
          </option>
        ))}
      </select>

      {loading ? (
        <LoadingState rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No inventory yet"
          description="Select a farmer and add inventory from a product, same as the farmer app."
          action={
            <Link to={addPath} className={EXCEL_BTN_PRIMARY}>
              Add Inventory
            </Link>
          }
        />
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.farmerId || group.farmerName} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Link
                  to={group.farmerId ? `/manager/farmers/${encodeURIComponent(group.farmerId)}` : "/manager/farmers"}
                  className="text-sm font-bold text-[#217346] hover:underline"
                >
                  {group.farmerName}
                </Link>
                <span className="text-[11px] text-slate-500">
                  {group.items.length} item{group.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="space-y-2 lg:hidden">
                {group.items.map((product) => {
                  const id = productKey(product);
                  const name = product.productName || product.name;
                  const qty = getAvailQty(product);
                  return (
                    <article key={`${group.farmerId}-${id}`} className={`${EXCEL_PANEL} p-2.5`}>
                      <div className="flex items-center gap-2.5">
                        <ProductPhoto src={productPhoto(product)} name={name} className="h-14 w-14 shrink-0 rounded-xl" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 truncate text-[13px] font-bold text-slate-900">{name}</p>
                            <StatusBadge status={product.status} className="max-w-[46%] shrink-0" />
                          </div>
                          <p className="mt-0.5 truncate text-[10px] text-slate-500">
                            Gr A {getGradeQty(product, 0)} · Gr B {getGradeQty(product, 1)} · {qty} {product.unit || "Kg"}
                          </p>
                          <p className="truncate text-[10px] text-slate-500">
                            Harvest {formatCropDate(product.harvestDate)} · {product.farmLocation || "—"}
                          </p>
                        </div>
                      </div>
                      <InventoryActions product={product} compact onDelete={setDeleteProduct} />
                    </article>
                  );
                })}
              </div>
              <div className={`${EXCEL_WRAP} hidden min-w-0 lg:block`}>
                <table className={`${EXCEL_TABLE} w-full min-w-[1100px]`}>
                  <thead>
                    <tr>
                      {["Product", "Category", "Unit", "Harvest", "Location", "Organic", "Gr A", "Gr B", "Avail. Qty", "Status"].map((h) => (
                        <th key={h} className={`${EXCEL_HEAD} whitespace-nowrap`}>{h}</th>
                      ))}
                      <th className={`${EXCEL_HEAD} ${ACTION_COL} sticky right-0 z-20 whitespace-nowrap border-l border-slate-200 bg-slate-50 text-right`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((product) => {
                      const id = productKey(product);
                      const name = product.productName || product.name;
                      const qty = getAvailQty(product);
                      return (
                        <tr key={`row-${group.farmerId}-${id}`} className="group align-middle hover:bg-slate-50">
                          <td className={EXCEL_CELL}>
                            <div className="flex items-center gap-2.5">
                              <ProductPhoto src={productPhoto(product)} name={name} className="h-9 w-9 shrink-0 rounded-lg" />
                              <span className="truncate font-semibold text-slate-900">{name}</span>
                            </div>
                          </td>
                          <td className={`${EXCEL_CELL} whitespace-nowrap`}>{product.category || "—"}</td>
                          <td className={`${EXCEL_CELL} whitespace-nowrap`}>{product.unit || "Kg"}</td>
                          <td className={`${EXCEL_CELL} whitespace-nowrap`}>{formatCropDate(product.harvestDate)}</td>
                          <td className={`${EXCEL_CELL} whitespace-nowrap`}>{product.farmLocation || "—"}</td>
                          <td className={`${EXCEL_CELL} whitespace-nowrap`}>
                            {product.produceType === "non-organic" || product.organic === false ? "Non-Org" : "Organic"}
                          </td>
                          <td className={`${EXCEL_CELL} whitespace-nowrap tabular-nums`}>{getGradeQty(product, 0)}</td>
                          <td className={`${EXCEL_CELL} whitespace-nowrap tabular-nums`}>{getGradeQty(product, 1)}</td>
                          <td className={`${EXCEL_CELL} whitespace-nowrap tabular-nums ${qty <= 0 ? "font-semibold text-red-600" : ""}`}>
                            {qty}
                          </td>
                          <td className={EXCEL_CELL}>
                            <StatusBadge status={product.status} />
                          </td>
                          <td className={`${EXCEL_CELL} ${ACTION_COL} sticky right-0 z-10 border-l border-slate-200 bg-white group-hover:bg-slate-50`}>
                            <InventoryActions product={product} onDelete={setDeleteProduct} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(deleteProduct)}
        title="Delete inventory?"
        onClose={() => setDeleteProduct(null)}
        footer={
          <>
            <button type="button" className={EXCEL_BTN} onClick={() => setDeleteProduct(null)}>Cancel</button>
            <button type="button" className={EXCEL_BTN_DANGER} onClick={onDelete}>Delete</button>
          </>
        }
      >
        <p>This will remove the product and its inventory from this farmer’s catalog.</p>
      </Modal>
    </div>
  );
}

export default InventoryPage;
