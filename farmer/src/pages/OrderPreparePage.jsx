import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getMyOrder, packMyOrder, prepareMyOrder, readyMyOrder } from "../api/farmerApi";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import OrderQrCode from "../components/orders/OrderQrCode";
import { ORDER_PACKAGE_TYPES } from "../utils/constants";
import { formatOrderDate } from "../utils/orderDisplay";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY, EXCEL_INPUT, EXCEL_PAGE_SUB, EXCEL_PAGE_TITLE, EXCEL_PANEL, EXCEL_PANEL_HEAD } from "../utils/excelStyles";

function OrderPreparePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [form, setForm] = useState({
    packedQuantity: "",
    packageCount: "",
    packageType: "Crate",
    packageWeight: "",
    packingDate: "",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyOrder(id);
      setOrder(data);
      setForm({
        packedQuantity: data.packedQuantity || data.orderedQuantity || "",
        packageCount: data.packingDetails?.packageCount || "",
        packageType: data.packingDetails?.packageType || "Crate",
        packageWeight: data.packingDetails?.packageWeight || "",
        packingDate: data.packingDetails?.packingDate || new Date().toISOString().slice(0, 10),
        notes: data.packingDetails?.notes || "",
      });
    } catch (err) {
      toast.error(err.message || "Order not found");
      navigate("/farmer/orders/preparing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return <LoadingState rows={8} />;
  if (!order) return null;

  const reserved = Number(order.reservedQuantity || order.orderedQuantity || 0);

  const savePacking = async () => {
    const packedQuantity = Number(form.packedQuantity);
    if (packedQuantity > reserved) {
      toast.error("Packed quantity cannot exceed the reserved quantity");
      return;
    }
    setSaving("pack");
    try {
      setOrder(
        await packMyOrder(id, {
          packedQuantity,
          packingDetails: {
            packageCount: Number(form.packageCount) || 0,
            packageType: form.packageType,
            packageWeight: Number(form.packageWeight) || 0,
            packingDate: form.packingDate,
            notes: form.notes,
          },
        })
      );
      toast.success("Packing details saved");
    } catch (err) {
      toast.error(err.message || "Failed to save packing");
    } finally {
      setSaving("");
    }
  };

  const startPrep = async () => {
    setSaving("prep");
    try {
      setOrder(await prepareMyOrder(id, { packedQuantity: Number(form.packedQuantity) || undefined }));
      toast.success("Preparation started");
    } catch (err) {
      toast.error(err.message || "Failed to start preparation");
    } finally {
      setSaving("");
    }
  };

  const updateQty = async () => {
    setSaving("qty");
    try {
      setOrder(await prepareMyOrder(id, { packedQuantity: Number(form.packedQuantity) || 0 }));
      toast.success("Quantity updated");
    } catch (err) {
      toast.error(err.message || "Failed to update quantity");
    } finally {
      setSaving("");
    }
  };

  const markReady = async () => {
    setSaving("ready");
    try {
      if (Number(form.packedQuantity) > 0) {
        await packMyOrder(id, {
          packedQuantity: Number(form.packedQuantity),
          packingDetails: {
            packageCount: Number(form.packageCount) || 0,
            packageType: form.packageType,
            packageWeight: Number(form.packageWeight) || 0,
            packingDate: form.packingDate,
            notes: form.notes,
          },
        });
      }
      setOrder(await readyMyOrder(id));
      toast.success("Marked ready for pickup");
      navigate("/farmer/orders/ready");
    } catch (err) {
      toast.error(err.message || "Add packing details before marking ready");
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Order Preparation</h1>
          <p className={EXCEL_PAGE_SUB}>
            {order.orderId || order.id} • {order.productName}{" "}
            <Link to={`/farmer/orders/${id}`} className="font-semibold text-[#217346] hover:underline">
              View order
            </Link>
          </p>
        </div>
        <StatusBadge status={order.preparationStatus || order.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_200px]">
        <section className={EXCEL_PANEL}>
          <h2 className={EXCEL_PANEL_HEAD}>Order</h2>
          <div className="grid gap-3 p-3 text-xs sm:grid-cols-2">
            <Info label="Order ID" value={order.orderId || order.id} />
            <Info label="Farmer Name" value={order.farmerName} />
            <Info label="Product Name" value={order.productName} />
            <Info label="Variety" value={order.variety} />
            <Info label="Ordered Quantity" value={`${order.orderedQuantity} ${order.unit}`} />
            <Info label="Available Quantity" value={`${order.availableStock ?? 0} ${order.unit}`} />
            <Info label="Harvest Date" value={formatOrderDate(order.harvestDate)} />
            <Info label="Packing Date" value={formatOrderDate(form.packingDate)} />
            <Info label="Expected Pickup Date" value={formatOrderDate(order.pickupDate)} />
            <Info label="Preparation Status" value={order.preparationStatus} />
          </div>
        </section>
        <OrderQrCode value={order.qrPayload || `greengroo:order:${order.orderId || order.id}`} />
      </div>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Packing Details</h2>
        <div className="grid gap-3 p-3 sm:grid-cols-2">
          <Field label={`Packed Quantity (${order.unit})`}>
            <input className={EXCEL_INPUT} type="number" min="0" value={form.packedQuantity} onChange={(e) => setForm((p) => ({ ...p, packedQuantity: e.target.value }))} />
          </Field>
          <Field label="Number of Packages">
            <input className={EXCEL_INPUT} type="number" min="0" value={form.packageCount} onChange={(e) => setForm((p) => ({ ...p, packageCount: e.target.value }))} />
          </Field>
          <Field label="Package Type">
            <select className={EXCEL_INPUT} value={form.packageType} onChange={(e) => setForm((p) => ({ ...p, packageType: e.target.value }))}>
              {ORDER_PACKAGE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Package Weight (${order.unit})`}>
            <input className={EXCEL_INPUT} type="number" min="0" value={form.packageWeight} onChange={(e) => setForm((p) => ({ ...p, packageWeight: e.target.value }))} />
          </Field>
          <Field label="Packing Date">
            <input className={EXCEL_INPUT} type="date" value={form.packingDate} onChange={(e) => setForm((p) => ({ ...p, packingDate: e.target.value }))} />
          </Field>
          <Field label="Packing Notes">
            <input className={EXCEL_INPUT} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </Field>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" className={EXCEL_BTN} disabled={saving} onClick={startPrep}>
          {saving === "prep" ? "Saving…" : "Start Preparation"}
        </button>
        <button type="button" className={EXCEL_BTN} disabled={saving} onClick={updateQty}>
          {saving === "qty" ? "Saving…" : "Update Quantity"}
        </button>
        <button type="button" className={EXCEL_BTN} disabled={saving} onClick={savePacking}>
          {saving === "pack" ? "Saving…" : "Add Packing Details"}
        </button>
        <button type="button" className={EXCEL_BTN_PRIMARY} disabled={saving} onClick={markReady}>
          {saving === "ready" ? "Saving…" : "Ready for Pickup"}
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="font-semibold text-[#6B7280]">{label}</p>
      <p className="mt-0.5 font-semibold text-[#1F2937]">{value || "—"}</p>
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

export default OrderPreparePage;
