import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import LoadingState from "../components/ui/LoadingState";
import StatusBadge from "../components/ui/StatusBadge";
import { getMyProduct, updateMyProductPrice, updateMyProductStock } from "../api/farmerApi";
import { formatProductPrice } from "../utils/productActions";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY, EXCEL_INPUT, EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE, EXCEL_PANEL, EXCEL_PANEL_HEAD } from "../utils/excelStyles";

function ProductPriceStockPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [form, setForm] = useState({
    availableQuantity: "",
    pricePerKg: "",
    minimumOrderQuantity: "",
    availableFrom: "",
    availableUntil: "",
    lowStockLimit: 10,
    grades: [],
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyProduct(id);
      setProduct(data);
      setForm({
        availableQuantity: data.availableQuantity ?? "",
        pricePerKg: data.pricePerKg ?? data.sellingPrice ?? "",
        minimumOrderQuantity: data.minimumOrderQuantity ?? "",
        availableFrom: data.availableFrom || "",
        availableUntil: data.availableUntil || "",
        lowStockLimit: data.lowStockLimit || 10,
        grades: (data.grades || []).map((g) => ({ ...g, quantity: g.quantity ?? "", price: g.price ?? "" })),
      });
    } catch (err) {
      toast.error(err.message || "Product not found");
      navigate("/farmer/products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <LoadingState rows={8} />;
  if (!product) return null;

  const locked = product.status === "Pending Approval";

  const saveStock = async () => {
    if (locked) return;
    setSaving("stock");
    try {
      await updateMyProductStock(id, {
        availableQuantity: Number(form.availableQuantity),
        minimumOrderQuantity: Number(form.minimumOrderQuantity),
        availableFrom: form.availableFrom,
        availableUntil: form.availableUntil,
        lowStockLimit: Number(form.lowStockLimit),
        grades: form.grades.map((g) => ({ ...g, quantity: Number(g.quantity) || 0, price: Number(g.price) || 0 })),
      });
      toast.success("Stock updated");
      await load();
    } catch (err) {
      toast.error(err.message || "Failed to update stock");
    } finally {
      setSaving("");
    }
  };

  const savePrice = async () => {
    if (locked) return;
    if (!(Number(form.pricePerKg) > 0)) {
      toast.error("Selling price must be greater than 0");
      return;
    }
    setSaving("price");
    try {
      await updateMyProductPrice(id, {
        pricePerKg: Number(form.pricePerKg),
        grades: form.grades.map((g) => ({ ...g, price: Number(g.price || form.pricePerKg) || 0 })),
      });
      toast.success("Price updated");
      await load();
    } catch (err) {
      toast.error(err.message || "Failed to update price");
    } finally {
      setSaving("");
    }
  };

  const saveAll = async () => {
    if (locked) return;
    if (!(Number(form.pricePerKg) > 0)) {
      toast.error("Selling price must be greater than 0");
      return;
    }
    setSaving("all");
    try {
      await updateMyProductPrice(id, {
        pricePerKg: Number(form.pricePerKg),
        grades: form.grades.map((g) => ({ ...g, price: Number(g.price || form.pricePerKg) || 0 })),
      });
      await updateMyProductStock(id, {
        availableQuantity: Number(form.availableQuantity),
        minimumOrderQuantity: Number(form.minimumOrderQuantity),
        availableFrom: form.availableFrom,
        availableUntil: form.availableUntil,
        lowStockLimit: Number(form.lowStockLimit),
        grades: form.grades.map((g) => ({ ...g, quantity: Number(g.quantity) || 0, price: Number(g.price) || 0 })),
      });
      toast.success("Price and stock saved");
      await load();
    } catch (err) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Price & Stock</h1>
        <p className={EXCEL_PAGE_SUB}>
          {product.productName || product.name} • {formatProductPrice(product.pricePerKg, product.unit)}{" "}
          <Link to={`/farmer/products/${id}`} className="font-semibold text-[#217346] hover:underline">
            Back to details
          </Link>
        </p>
      </div>

      <section className={EXCEL_PANEL}>
        <div className={`${EXCEL_PANEL_HEAD} flex items-center justify-between`}>
          <span>Stock & Availability</span>
          <StatusBadge status={product.stockStatus || product.status} />
        </div>
        <div className="grid gap-3 p-3 sm:grid-cols-2">
          <Field label="Product Name">
            <input className={EXCEL_INPUT} value={product.productName || product.name} disabled />
          </Field>
          <Field label={`Available Quantity (${product.unit})`}>
            <input className={EXCEL_INPUT} type="number" min="0" value={form.availableQuantity} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, availableQuantity: e.target.value }))} />
          </Field>
          <Field label="Selling Price / Kg">
            <input className={EXCEL_INPUT} type="number" min="0" step="0.01" value={form.pricePerKg} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, pricePerKg: e.target.value }))} />
          </Field>
          <Field label="Minimum Order Quantity">
            <input className={EXCEL_INPUT} type="number" min="0" value={form.minimumOrderQuantity} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, minimumOrderQuantity: e.target.value }))} />
          </Field>
          <Field label="Available From">
            <input className={EXCEL_INPUT} type="date" value={form.availableFrom} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, availableFrom: e.target.value }))} />
          </Field>
          <Field label="Available Until">
            <input className={EXCEL_INPUT} type="date" value={form.availableUntil} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, availableUntil: e.target.value }))} />
          </Field>
          <Field label="Low Stock Threshold">
            <input className={EXCEL_INPUT} type="number" min="0" value={form.lowStockLimit} disabled={locked} onChange={(e) => setForm((p) => ({ ...p, lowStockLimit: e.target.value }))} />
          </Field>
        </div>
      </section>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Grade A / B / C</h2>
        <div className="space-y-2 p-3">
          {form.grades.map((grade, index) => (
            <div key={grade.grade || index} className="grid gap-2 sm:grid-cols-3">
              <input className={EXCEL_INPUT} value={grade.label || `Grade ${grade.grade}`} disabled />
              <input
                className={EXCEL_INPUT}
                type="number"
                min="0"
                placeholder="Quantity"
                value={grade.quantity}
                disabled={locked}
                onChange={(e) => {
                  const grades = [...form.grades];
                  grades[index] = { ...grade, quantity: e.target.value };
                  setForm((p) => ({ ...p, grades }));
                }}
              />
              <input
                className={EXCEL_INPUT}
                type="number"
                min="0"
                placeholder="Price"
                value={grade.price}
                disabled={locked}
                onChange={(e) => {
                  const grades = [...form.grades];
                  grades[index] = { ...grade, price: e.target.value };
                  setForm((p) => ({ ...p, grades }));
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={saving || locked} className={EXCEL_BTN} onClick={savePrice}>
          {saving === "price" ? "Saving…" : "Update Price"}
        </button>
        <button type="button" disabled={saving || locked} className={EXCEL_BTN} onClick={saveStock}>
          {saving === "stock" ? "Saving…" : "Update Stock"}
        </button>
        <button type="button" disabled={saving || locked} className={EXCEL_BTN_PRIMARY} onClick={saveAll}>
          Save
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold">{label}</label>
      {children}
    </div>
  );
}

export default ProductPriceStockPage;
