import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { vendorApi } from "../../api/vendorApi";

const TABS = ["Overview", "Crops", "Products", "Inventory", "Orders", "Earnings", "Documents"];

const DOCUMENT_TYPES = [
  { id: "aadhaar", name: "Aadhaar / ID Proof" },
  { id: "pan", name: "PAN Card" },
  { id: "bank", name: "Bank Details" },
  { id: "address", name: "Address Proof" },
  { id: "other", name: "Other Documents" },
];

const STATUS_BADGE = (status) => {
  const map = {
    Active: "bg-green-100 text-green-700",
    Inactive: "bg-gray-100 text-gray-600",
    "Pending Approval": "bg-yellow-100 text-yellow-700",
    Pending: "bg-yellow-100 text-yellow-700",
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
    REJECTED: "bg-red-100 text-red-700",
    NEW: "bg-blue-100 text-blue-700",
    PREPARING: "bg-violet-100 text-violet-700",
    ACCEPTED: "bg-indigo-100 text-indigo-700",
    "Not Uploaded": "bg-gray-100 text-gray-600",
    New: "bg-blue-100 text-blue-700",
    Completed: "bg-emerald-100 text-emerald-700",
    Cancelled: "bg-red-100 text-red-600",
    Growing: "bg-blue-100 text-blue-700",
    Planned: "bg-indigo-100 text-indigo-700",
    Harvested: "bg-emerald-100 text-emerald-700",
    "Ready for Harvest": "bg-teal-100 text-teal-700",
    Paid: "bg-green-100 text-green-700",
    "In Stock": "bg-green-100 text-green-700",
    "Low Stock": "bg-yellow-100 text-yellow-700",
    "Out of Stock": "bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status || "—"}
    </span>
  );
};

function isPendingProduct(status) {
  const s = String(status || "").toLowerCase().replace(/_/g, " ");
  return s === "pending approval" || s === "pending";
}

function formatCropDate(value) {
  if (!value) return "—";
  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split("-").map(Number);
  if (!year || !month || !day) return String(value);
  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCropBusinessId(crop = {}) {
  return crop.cropId || crop.id || "—";
}

function asList(res) {
  const data = res?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.documents)) return data.documents;
  if (Array.isArray(data?.transactions)) return data.transactions;
  if (Array.isArray(data?.orders)) return data.orders;
  return [];
}

function getUploadedFarmerDocs(docs = []) {
  return (docs || []).filter(
    (d) => Boolean(d && (d.fileUrl || d.fileName) && d.status !== "Not Uploaded" && d.status !== "not_uploaded")
  );
}

export default function FarmerDetailPage() {
  const { farmerId } = useParams();
  const [tab, setTab] = useState("Overview");
  const [farmer, setFarmer] = useState(null);
  const [crops, setCrops] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyProductId, setBusyProductId] = useState("");
  const [productToast, setProductToast] = useState("");

  // Document Review & Modals State
  const [viewDoc, setViewDoc] = useState(null);
  const [rejectDocModal, setRejectDocModal] = useState(null);
  const [docRejectReason, setDocRejectReason] = useState("");
  const [docActionBusy, setDocActionBusy] = useState(false);

  const loadDocuments = () =>
    vendorApi
      .getFarmerDocuments(farmerId)
      .then((res) => setDocuments(asList(res)))
      .catch(() => setDocuments([]));

  const handleApproveDocument = async (docId, docName) => {
    if (!docId || String(docId).startsWith("missing-")) {
      window.alert("Please upload a file before approving");
      return;
    }
    setDocActionBusy(true);
    try {
      await vendorApi.updateFarmerDocumentStatus(farmerId, docId, "Approved", "");
      setProductToast(`${docName} approved successfully ✓`);
      await loadDocuments();
    } catch (err) {
      window.alert(err?.response?.data?.message || "Failed to approve document");
    } finally {
      setDocActionBusy(false);
    }
  };

  const openRejectDocModal = (docId, docName) => {
    if (!docId || String(docId).startsWith("missing-")) {
      window.alert("Cannot reject a document that is not uploaded");
      return;
    }
    setRejectDocModal({ docId, docName });
    setDocRejectReason("");
  };

  const handleConfirmRejectDoc = async (e) => {
    e?.preventDefault();
    if (!rejectDocModal || !docRejectReason.trim()) {
      window.alert("Please provide a rejection reason");
      return;
    }
    setDocActionBusy(true);
    try {
      await vendorApi.updateFarmerDocumentStatus(
        farmerId,
        rejectDocModal.docId,
        "Rejected",
        docRejectReason.trim()
      );
      setProductToast(`${rejectDocModal.docName} rejected with reason`);
      setRejectDocModal(null);
      setDocRejectReason("");
      await loadDocuments();
    } catch (err) {
      window.alert(err?.response?.data?.message || "Failed to reject document");
    } finally {
      setDocActionBusy(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    vendorApi
      .getFarmerById(farmerId)
      .then((r) => setFarmer(r.data))
      .catch(() => setFarmer(null))
      .finally(() => setLoading(false));
    vendorApi
      .getFarmerCrops(farmerId)
      .then((r) => setCrops(asList(r)))
      .catch(() => setCrops([]));
  }, [farmerId]);

  useEffect(() => {
    if (tab === "Crops") {
      vendorApi.getFarmerCrops(farmerId).then((r) => setCrops(asList(r))).catch(() => setCrops([]));
    }
    if (tab === "Products") {
      vendorApi.getFarmerProducts(farmerId).then((r) => setProducts(asList(r))).catch(() => setProducts([]));
    }
    if (tab === "Inventory") {
      vendorApi.getFarmerInventory(farmerId).then((r) => setInventory(asList(r))).catch(() => setInventory([]));
    }
    if (tab === "Orders") {
      const loadOrders = () =>
        vendorApi.getFarmerOrders(farmerId).then((r) => setOrders(asList(r))).catch(() => setOrders([]));
      loadOrders();
      const timer = window.setInterval(loadOrders, 5000);
      return () => window.clearInterval(timer);
    }
    if (tab === "Earnings") {
      vendorApi.getFarmerEarnings(farmerId).then((r) => setEarnings(asList(r))).catch(() => setEarnings([]));
    }
    if (tab === "Documents") loadDocuments();
  }, [tab, farmerId]);

  const handleReviewProduct = async (product, decision) => {
    const id = product.id || product.productId;
    let reason = "";
    if (decision === "rejected") {
      const typed = window.prompt("Reason for rejection (optional)");
      if (typed === null) return;
      reason = typed;
    }
    setBusyProductId(id);
    try {
      await vendorApi.reviewFarmerProduct(farmerId, id, decision, reason);
      setProductToast(decision === "approved" ? "Product approved" : "Product rejected");
      const res = await vendorApi.getFarmerProducts(farmerId);
      setProducts(asList(res));
    } catch (err) {
      setProductToast(err?.response?.data?.message || "Failed to review product");
    } finally {
      setBusyProductId("");
      window.setTimeout(() => setProductToast(""), 4000);
    }
  };

  if (loading) return <p className="p-6 text-xs text-[#6B7280]">Loading farmer details…</p>;
  if (!farmer) return <p className="p-6 text-xs text-[#DC2626]">Farmer not found</p>;

  return (
    <div className="space-y-4 p-6">
      {productToast ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {productToast}
        </div>
      ) : null}
      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
        <Link to="/vendor/all-farmers" className="hover:text-[#217346]">
          Farmers
        </Link>
        <span>›</span>
        <span className="font-semibold text-[#1F2937]">{farmer.name}</span>
      </div>

      <div className="border border-[#D4D4D4] bg-white p-4">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-[#D4D4D4] bg-[#F2F2F2] text-xl font-bold text-[#217346]">
            {farmer.initials || farmer.name?.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-[#1F2937]">{farmer.name}</h1>
            <p className="text-sm text-[#6B7280]">
              {farmer.mobile} · {farmer.email || "—"}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {STATUS_BADGE(farmer.status)}
              <span className="text-[10px] text-[#6B7280]">Code: {farmer.farmerCode || farmer.farmerId || "—"}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            {[
              { label: "Crops", value: crops.length },
              { label: "Products", value: farmer.totalProducts ?? 0 },
              { label: "Orders", value: farmer.totalOrders ?? 0 },
              { label: "Earnings", value: `₹${(farmer.totalEarnings ?? 0).toLocaleString("en-IN")}` },
            ].map((s) => (
              <div key={s.label} className="border border-[#D4D4D4] px-3 py-2">
                <p className="text-lg font-bold text-[#1F2937]">{s.value}</p>
                <p className="text-[10px] text-[#6B7280]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
          {[
            ["Farm Name", farmer.farmName],
            ["Farm Location", farmer.farmLocation],
            ["Farm Address", farmer.farmAddress],
            ["Farm Area", farmer.farmArea],
            ["Farm Type", farmer.farmType],
            ["Joining", farmer.createdAt ? new Date(farmer.createdAt).toLocaleDateString("en-IN") : "—"],
          ].map(([label, val]) => (
            <div key={label}>
              <span className="text-[#6B7280]">{label}: </span>
              <span className="font-semibold">{val || "—"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-0 overflow-x-auto border-b border-[#D4D4D4]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
              tab === t ? "border-[#217346] text-[#217346]" : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="border border-[#D4D4D4] bg-white">
        {tab === "Overview" && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 p-4 text-xs sm:grid-cols-3">
            <div>
              <span className="text-[#6B7280]">Village: </span>
              <span className="font-semibold">{farmer.address?.village || "—"}</span>
            </div>
            <div>
              <span className="text-[#6B7280]">Taluka: </span>
              <span className="font-semibold">{farmer.address?.taluka || "—"}</span>
            </div>
            <div>
              <span className="text-[#6B7280]">District: </span>
              <span className="font-semibold">{farmer.address?.district || "—"}</span>
            </div>
            <div>
              <span className="text-[#6B7280]">State: </span>
              <span className="font-semibold">{farmer.address?.state || "—"}</span>
            </div>
            <div>
              <span className="text-[#6B7280]">Pincode: </span>
              <span className="font-semibold">{farmer.address?.pincode || "—"}</span>
            </div>
            <div>
              <span className="text-[#6B7280]">Manager: </span>
              <span className="font-semibold">{farmer.managerName || "—"}</span>
            </div>
            <div>
              <span className="text-[#6B7280]">Bank: </span>
              <span className="font-semibold">{farmer.bank?.bankName || "—"}</span>
            </div>
            <div>
              <span className="text-[#6B7280]">Account: </span>
              <span className="font-semibold">{farmer.bank?.accountNumber || "—"}</span>
            </div>
            <div>
              <span className="text-[#6B7280]">IFSC: </span>
              <span className="font-semibold">{farmer.bank?.ifsc || "—"}</span>
            </div>
          </div>
        )}

        {tab === "Crops" && (
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-[#D4D4D4] px-3 py-2.5">
              <p className="text-xs font-semibold text-[#1F2937]">Crops</p>
              <Link
                to={`/vendor/all-farmers/${farmerId}/crops/add`}
                className="bg-[#217346] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#1a5c38]"
              >
                + Add Crop
              </Link>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#F2F2F2] text-left">
                  {["Crop", "Crop ID", "Variety", "Sowing", "Harvest", "Status", "Action"].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold text-[#6B7280]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {crops.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-[#6B7280]">
                      No crops added for this farmer
                    </td>
                  </tr>
                ) : (
                  crops.map((crop) => (
                    <tr key={crop.cropId || crop.id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                      <td className="px-3 py-2.5 font-semibold">{crop.cropName}</td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-emerald-700">{formatCropBusinessId(crop)}</td>
                      <td className="px-3 py-2.5">{crop.variety || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2.5">{formatCropDate(crop.sowingDate)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5">{formatCropDate(crop.expectedHarvestDate)}</td>
                      <td className="px-3 py-2.5">{STATUS_BADGE(crop.status)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-nowrap items-center gap-1.5">
                          <Link
                            to={`/vendor/all-farmers/${farmerId}/crops/${encodeURIComponent(crop.cropId || crop.id)}`}
                            className="border border-[#D4D4D4] bg-white px-2.5 py-1 text-[11px] font-semibold hover:bg-[#F2F2F2]"
                          >
                            View
                          </Link>
                          <Link
                            to={`/vendor/all-farmers/${farmerId}/crops/${encodeURIComponent(crop.cropId || crop.id)}/edit`}
                            className="border border-[#D4D4D4] bg-white px-2.5 py-1 text-[11px] font-semibold hover:bg-[#F2F2F2]"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                            onClick={async () => {
                              const id = crop.cropId || crop.id;
                              if (!window.confirm(`Delete crop "${crop.cropName}"?`)) return;
                              try {
                                await vendorApi.deleteFarmerCrop(farmerId, id);
                                const res = await vendorApi.getFarmerCrops(farmerId);
                                setCrops(asList(res));
                              } catch (err) {
                                window.alert(err?.response?.data?.message || "Failed to delete crop");
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {tab === "Products" && (
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-[#D4D4D4] px-3 py-2.5">
              <p className="text-xs font-semibold text-[#1F2937]">Products</p>
              <Link
                to={`/vendor/all-farmers/${farmerId}/products/add`}
                className="bg-[#217346] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#1a5c38]"
              >
                + Add Product
              </Link>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#F2F2F2] text-left">
                  {["Product", "Product ID", "Category", "Grades", "Harvest Date", "Status", "Action"].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold text-[#6B7280]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-[#6B7280]">
                      No products
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                      <td className="px-3 py-2.5 font-semibold">{p.name}</td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-emerald-700">{p.productId || p.id || "—"}</td>
                      <td className="px-3 py-2.5">{p.category}</td>
                      <td className="px-3 py-2.5">
                        {p.grades?.map((g) => `${g.label}: ${g.quantity} Kg`).join(" · ") || p.gradesSummary || "—"}
                      </td>
                      <td className="px-3 py-2.5">{p.harvestDate || "—"}</td>
                      <td className="px-3 py-2.5">{STATUS_BADGE(p.status)}</td>
                      <td className="px-3 py-2.5">
                        {isPendingProduct(p.status) ? (
                          <div className="flex flex-nowrap items-center gap-1">
                            <button
                              type="button"
                              disabled={busyProductId === (p.id || p.productId)}
                              onClick={() => handleReviewProduct(p, "approved")}
                              className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 hover:bg-green-200 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={busyProductId === (p.id || p.productId)}
                              onClick={() => handleReviewProduct(p, "rejected")}
                              className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[#9CA3AF]">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {tab === "Inventory" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#F2F2F2] text-left">
                  {["Product", "Grade", "Quantity", "Status"].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold text-[#6B7280]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-[#6B7280]">
                      No inventory
                    </td>
                  </tr>
                ) : (
                  inventory.flatMap((p) => {
                    if (p.grades?.length) {
                      return p.grades.map((g, gi) => (
                        <tr key={`${p.id}-${g.id || gi}`} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                          <td className="px-3 py-2.5 font-semibold">{gi === 0 ? p.name : ""}</td>
                          <td className="px-3 py-2.5">{g.label}</td>
                          <td className="px-3 py-2.5">
                            {g.quantity} {p.unit || "Kg"}
                          </td>
                          <td className="px-3 py-2.5">{STATUS_BADGE(p.status)}</td>
                        </tr>
                      ));
                    }
                    return [
                      <tr key={p.id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                        <td className="px-3 py-2.5 font-semibold">{p.productName || p.name}</td>
                        <td className="px-3 py-2.5">{p.grade || "All"}</td>
                        <td className="px-3 py-2.5">
                          {p.currentStock ?? p.stock ?? 0} {p.unit || "Kg"}
                        </td>
                        <td className="px-3 py-2.5">{STATUS_BADGE(p.status)}</td>
                      </tr>,
                    ];
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Orders" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[#F2F2F2]">
                  <th className="w-12 border border-[#D4D4D4] px-2.5 py-2 text-center font-semibold text-[#4B5563]">Sr.</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-left font-semibold text-[#1F2937]">Date</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-left font-semibold text-[#1F2937]">Day</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-left font-semibold text-[#1F2937]">Product</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-left font-semibold text-[#1F2937]">Category</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-center font-semibold text-[#1F2937]">Unit</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-right font-semibold text-[#1F2937]">Grade A Qty</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-right font-semibold text-[#DC2626]">Rejection Qty</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-right font-semibold text-[#1F2937]">Amount</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-center font-semibold text-[#1F2937]">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="border border-[#D4D4D4] px-3 py-6 text-center text-[#6B7280]">
                      No harvest orders found for this farmer
                    </td>
                  </tr>
                ) : (
                  orders.flatMap((o, oIdx) => {
                    const prods =
                      o.products && o.products.length
                        ? o.products
                        : [
                            {
                              name: o.productName || "Produce",
                              category: o.category || "Produce",
                              unit: o.unit || "Kg",
                              quantity: o.totalQuantity || 0,
                              total: o.totalAmount || o.amount || 0,
                            },
                          ];
                    const dateStr = o.harvestDate || o.date || (o.orderDate ? String(o.orderDate).slice(0, 10) : "—");
                    return prods.map((p, pIdx) => (
                      <tr key={`${o.id || o.orderId}-${pIdx}`} className="hover:bg-[#F9F9F9]">
                        <td className="border border-[#D4D4D4] px-2.5 py-2 text-center text-[#6B7280]">{oIdx + 1}</td>
                        <td className="whitespace-nowrap border border-[#D4D4D4] px-2.5 py-2 font-medium">{dateStr}</td>
                        <td className="border border-[#D4D4D4] px-2.5 py-2 text-[#6B7280]">{o.day || "—"}</td>
                        <td className="border border-[#D4D4D4] px-2.5 py-2 font-bold text-[#1F2937]">{p.name}</td>
                        <td className="border border-[#D4D4D4] px-2.5 py-2 text-[#6B7280]">{p.category || o.category || "Produce"}</td>
                        <td className="border border-[#D4D4D4] px-2.5 py-2 text-center text-[#6B7280]">{p.unit || o.unit || "Kg"}</td>
                        <td className="border border-[#D4D4D4] px-2.5 py-2 text-right font-bold tabular-nums">
                          {p.quantity || 0} {p.unit || o.unit || "Kg"}
                        </td>
                        <td className="border border-[#D4D4D4] px-2.5 py-2 text-right font-bold text-[#DC2626] tabular-nums">
                          {pIdx === 0 ? Number(o.rejectionQty || 0) : 0} {p.unit || o.unit || "Kg"}
                        </td>
                        <td className="border border-[#D4D4D4] px-2.5 py-2 text-right font-semibold text-[#217346] tabular-nums">
                          ₹{(p.total || o.totalAmount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="whitespace-nowrap border border-[#D4D4D4] px-2.5 py-2 text-center">
                          {STATUS_BADGE(o.status || "Approved")}
                        </td>
                      </tr>
                    ));
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Earnings" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#F2F2F2] text-left">
                  {["Date", "Crop", "Quantity", "Gross", "Deductions", "Net", "Status"].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold text-[#6B7280]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {earnings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-[#6B7280]">
                      No earnings recorded
                    </td>
                  </tr>
                ) : (
                  earnings.map((e) => (
                    <tr key={e.id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                      <td className="px-3 py-2.5">{e.date || "—"}</td>
                      <td className="px-3 py-2.5">{e.cropName || "—"}</td>
                      <td className="px-3 py-2.5">{e.quantity || 0} Kg</td>
                      <td className="px-3 py-2.5">₹{(e.grossEarnings || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2.5 text-[#DC2626]">-₹{e.deductions || 0}</td>
                      <td className="px-3 py-2.5 font-semibold text-[#217346]">₹{(e.netEarnings || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2.5">{STATUS_BADGE(e.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Documents" && (() => {
          const uploadedDocs = getUploadedFarmerDocs(documents);
          return (
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#1F2937]">Farmer Uploaded Documents ({uploadedDocs.length})</p>
                  <p className="text-[11px] text-[#6B7280]">Review farmer documents, approve KYC, or reject with specific reason.</p>
                </div>
                <button
                  type="button"
                  onClick={loadDocuments}
                  className="text-xs font-semibold text-[#217346] hover:underline"
                >
                  🔄 Refresh Docs
                </button>
              </div>

              {uploadedDocs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#D4D4D4] bg-[#FBFBFB] p-8 text-center">
                  <span className="text-3xl">📭</span>
                  <p className="mt-2 text-xs font-bold text-slate-700">
                    शेतकऱ्याने अद्याप कोणतेही कागदपत्र अपलोड केलेले नाही
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    (No documents uploaded yet by this farmer. Once uploaded from the farmer app, they will appear here for verification.)
                  </p>
                </div>
              ) : (
                <div className="grid gap-3.5 sm:grid-cols-2">
                  {uploadedDocs.map((d) => {
                    const isPdf = d.fileName?.toLowerCase().endsWith(".pdf") || d.fileUrl?.startsWith("data:application/pdf");
                    const isVideo = d.type === "video_kyc" || d.fileName?.toLowerCase().endsWith(".mp4") || d.fileUrl?.startsWith("data:video") || d.fileName?.toLowerCase().endsWith(".webm") || d.fileName?.toLowerCase().endsWith(".mov");
                    const hasFile = Boolean(d.fileUrl);

                    return (
                      <div key={d.type || d.id} className="space-y-2.5 rounded-lg border border-[#D4D4D4] bg-white p-3.5 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className="text-xl mt-0.5">{isVideo ? "🎥" : isPdf ? "📄" : "🪪"}</span>
                            <div>
                              <p className="text-xs font-bold text-[#1F2937]">{d.name}</p>
                              <p className="mt-0.5 text-[11px] text-[#6B7280]">
                                {hasFile ? (
                                  <button
                                    type="button"
                                    onClick={() => setViewDoc({ ...d, farmerName: farmer.name })}
                                    className="font-medium text-[#217346] underline hover:text-[#165030] text-left truncate max-w-[200px]"
                                  >
                                    {d.fileName || (isVideo ? "Play Video KYC" : "View Document")}
                                  </button>
                                ) : (
                                  <span className="text-slate-400">{d.fileName || "Uploaded Document"}</span>
                                )}
                              </p>
                              <p className="mt-0.5 text-[10px] text-[#94A3B8]">
                                {d.uploadedAt ? `Uploaded ${new Date(d.uploadedAt).toLocaleDateString("en-IN")}` : "—"}
                              </p>
                            </div>
                          </div>
                          {STATUS_BADGE(d.status)}
                        </div>

                        {d.status === "Rejected" && d.rejectionReason && (
                          <div className="rounded bg-red-50 p-2 text-[11px] text-red-700 border border-red-200">
                            <p className="font-bold">⚠️ Rejection Reason (अमान्य कारण):</p>
                            <p className="mt-0.5 text-[10.5px]">{d.rejectionReason}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setViewDoc({ ...d, farmerId: farmer.id, farmerName: farmer.name })}
                            className="rounded bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 border border-slate-300"
                          >
                            {isVideo ? "🎥 Watch Video" : "👁️ View"}
                          </button>

                          {d.status !== "Approved" && (
                            <button
                              type="button"
                              disabled={docActionBusy}
                              onClick={() => handleApproveDocument(d.id || d.type, d.name)}
                              className="rounded bg-green-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-green-700 shadow-sm disabled:opacity-50"
                            >
                              ✓ Approve
                            </button>
                          )}

                          {d.status !== "Rejected" && (
                            <button
                              type="button"
                              disabled={docActionBusy}
                              onClick={() => openRejectDocModal(d.id || d.type, d.name)}
                              className="rounded bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-700 shadow-sm disabled:opacity-50"
                            >
                              ✕ Reject
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* View Document Modal */}
      {viewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-[#F8FAFC]">
              <div>
                <h3 className="text-sm font-bold text-[#0F172A]">{viewDoc.name}</h3>
                <p className="text-[11px] text-[#64748B]">Farmer: {viewDoc.farmerName}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewDoc(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-50 flex items-center justify-center min-h-[300px]">
              {viewDoc.type === "video_kyc" || viewDoc.fileUrl?.startsWith("data:video") || /\.(mp4|webm|mov|mkv)$/i.test(viewDoc.fileName || "") ? (
                <div className="w-full flex flex-col items-center justify-center p-2">
                  <video
                    src={viewDoc.fileUrl}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[60vh] max-w-full rounded-lg shadow-sm border border-slate-300 bg-black"
                  />
                  <div className="mt-3 text-center">
                    <p className="text-xs font-bold text-slate-700">Live Video KYC Recording (थेट चेहरा व व्हिडिओ केवायसी)</p>
                    <p className="text-[11px] text-slate-500">{viewDoc.fileName || "kyc_video.mp4"}</p>
                  </div>
                </div>
              ) : viewDoc.fileUrl?.startsWith("data:application/pdf") || viewDoc.fileName?.toLowerCase().endsWith(".pdf") ? (
                <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-red-200 max-w-md">
                  <span className="text-5xl">📄</span>
                  <h4 className="mt-3 text-sm font-bold text-slate-800">{viewDoc.fileName || "PDF Document"}</h4>
                  <p className="mt-1 text-xs text-slate-500">PDF File Document</p>
                  <a
                    href={viewDoc.fileUrl}
                    download={viewDoc.fileName || `${viewDoc.type}.pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#217346] px-4 py-2 text-xs font-bold text-white hover:bg-[#165030]"
                  >
                    ⬇️ Download / Open PDF
                  </a>
                </div>
              ) : (
                <img
                  src={viewDoc.fileUrl}
                  alt={viewDoc.name}
                  className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-sm border border-slate-200"
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Status: {viewDoc.status}
                </span>
                {viewDoc.status === "Rejected" && viewDoc.rejectionReason && (
                  <span className="text-xs text-red-600">Reason: {viewDoc.rejectionReason}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {viewDoc.status !== "Approved" && (
                  <button
                    type="button"
                    disabled={docActionBusy}
                    onClick={() => {
                      handleApproveDocument(viewDoc.id, viewDoc.name);
                      setViewDoc(null);
                    }}
                    className="rounded bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 shadow-sm disabled:opacity-50"
                  >
                    ✓ Approve
                  </button>
                )}
                {viewDoc.status !== "Rejected" && (
                  <button
                    type="button"
                    disabled={docActionBusy}
                    onClick={() => {
                      const dId = viewDoc.id;
                      const dName = viewDoc.name;
                      setViewDoc(null);
                      openRejectDocModal(dId, dName);
                    }}
                    className="rounded bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-sm disabled:opacity-50"
                  >
                    ✕ Reject
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewDoc(null)}
                  className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Document Modal */}
      {rejectDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <h3 className="text-sm font-bold text-red-800">
                    Reject Document (कागदपत्र अमान्य करा)
                  </h3>
                  <p className="text-[11px] text-red-600">
                    {rejectDocModal.docName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectDocModal(null)}
                className="rounded p-1 text-red-400 hover:bg-red-100 hover:text-red-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmRejectDoc} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Quick Reason Presets (नमुना कारण निवडा):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "अस्पष्ट किंवा वाचता न येणारा फोटो (Unclear or blurry document photo)",
                    "कागदपत्रावरील नाव प्रोफाईलशी जुळत नाही (Name does not match farmer profile)",
                    "कालबाह्य किंवा चुकीचे कागदपत्र (Invalid or expired document)",
                    "कागदपत्राचा पूर्ण भाग दिसत नाही (Incomplete page or edges cut off)",
                    "चुकीच्या प्रकारात अपलोड केले आहे (Uploaded under wrong document category)",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDocRejectReason(preset)}
                      className={`text-left text-[11px] px-2 py-1 rounded-md border transition-colors ${
                        docRejectReason === preset
                          ? "bg-red-600 text-white border-red-600 font-bold"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Rejection Reason Details (अमान्य करण्याचे कारण) *:
                </label>
                <textarea
                  rows={3}
                  value={docRejectReason}
                  onChange={(e) => setDocRejectReason(e.target.value)}
                  placeholder="उदा. आधार कार्डवरील फोटो स्पष्ट दिसत नाही, कृपया स्पष्ट फोटो अपलोड करा..."
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectDocModal(null)}
                  className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={docActionBusy || !docRejectReason.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 shadow-sm"
                >
                  {docActionBusy ? "Rejecting…" : "Confirm Reject (अमान्य करा ❌)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
