import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getManagerFarmerById,
  getManagerFarmerCrops,
  getManagerFarmerProducts,
  getManagerFarmerInventory,
  getManagerFarmerOrders,
  getManagerFarmerEarnings,
  getManagerFarmerDocuments,
  uploadManagerFarmerDocument,
  deleteManagerFarmerCrop,
  reviewManagerFarmerProduct,
} from "../../api/farmerApi";
import { isPendingProductApproval } from "../../utils/productActions";
import { formatCropDate, formatCropBusinessId, formatProductBusinessId } from "../../utils/cropLinks";
import FileUpload from "../../components/ui/FileUpload";
import StatusBadge from "../../components/ui/StatusBadge";
import {
  EXCEL_PANEL,
  EXCEL_PAGE_TITLE,
  EXCEL_PAGE_SUB,
  EXCEL_BTN_PRIMARY,
} from "../../utils/excelStyles";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function mergeFarmerDocs(docs = []) {
  const list = Array.isArray(docs) ? docs : [];
  const map = Object.fromEntries(list.map((d) => [d.type, d]));
  return DOCUMENT_TYPES.map((t) => ({
    id: map[t.id]?.id || `missing-${t.id}`,
    type: t.id,
    name: t.name,
    fileName: map[t.id]?.fileName || "",
    fileUrl: map[t.id]?.fileUrl || "",
    uploadedAt: map[t.id]?.uploadedAt || null,
    status: map[t.id]?.status || "Not Uploaded",
  }));
}

const TABS = ["Overview", "Crops", "Products", "Inventory", "Orders", "Earnings", "Documents"];

const STATUS_BADGE = (status) => {
  const map = {
    Active: "bg-green-100 text-green-700",
    Inactive: "bg-gray-100 text-gray-600",
    Pending: "bg-yellow-100 text-yellow-700",
    "Pending Approval": "bg-yellow-100 text-yellow-700",
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
    "Not Uploaded": "bg-gray-100 text-gray-600",
    New: "bg-blue-100 text-blue-700",
    Completed: "bg-emerald-100 text-emerald-700",
    Cancelled: "bg-red-100 text-red-600",
    Growing: "bg-blue-100 text-blue-700",
    Planned: "bg-indigo-100 text-indigo-700",
    Harvested: "bg-emerald-100 text-emerald-700",
    Paid: "bg-green-100 text-green-700",
  };
  return <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${map[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
};

export default function ManagerFarmerDetailPage() {
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
  const [uploadingType, setUploadingType] = useState("");
  const [busyProductId, setBusyProductId] = useState("");

  const loadDocuments = () =>
    getManagerFarmerDocuments(farmerId)
      .then((res) => setDocuments(Array.isArray(res) ? res : res?.documents || []))
      .catch(() => setDocuments([]));

  useEffect(() => {
    setLoading(true);
    getManagerFarmerById(farmerId)
      .then(setFarmer)
      .catch(() => {})
      .finally(() => setLoading(false));
    getManagerFarmerCrops(farmerId).then(setCrops).catch(() => setCrops([]));
  }, [farmerId]);

  useEffect(() => {
    if (tab === "Crops") getManagerFarmerCrops(farmerId).then(setCrops).catch(() => setCrops([]));
    if (tab === "Products") getManagerFarmerProducts(farmerId).then(setProducts).catch(() => {});
    if (tab === "Inventory") getManagerFarmerInventory(farmerId).then(setInventory).catch(() => {});
    if (tab === "Orders") {
      const loadOrders = () => getManagerFarmerOrders(farmerId).then(setOrders).catch(() => {});
      loadOrders();
      const timer = window.setInterval(loadOrders, 5000);
      return () => window.clearInterval(timer);
    }
    if (tab === "Earnings") {
      getManagerFarmerEarnings(farmerId)
        .then((res) => setEarnings(Array.isArray(res) ? res : (Array.isArray(res?.transactions) ? res.transactions : [])))
        .catch(() => setEarnings([]));
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
      await reviewManagerFarmerProduct(farmerId, id, decision, reason);
      toast.success(decision === "approved" ? "Product approved" : "Product rejected");
      setProducts(await getManagerFarmerProducts(farmerId));
    } catch (err) {
      toast.error(err.message || "Failed to review product");
    } finally {
      setBusyProductId("");
    }
  };

  const handleUploadDocument = async (type, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be 5MB or smaller");
      return;
    }
    setUploadingType(type);
    try {
      const url = await fileToDataUrl(file);
      await uploadManagerFarmerDocument(farmerId, type, { name: file.name, url });
      toast.success(`${file.name} uploaded`);
      await loadDocuments();
    } catch (err) {
      toast.error(err?.message || "Failed to upload document");
    } finally {
      setUploadingType("");
    }
  };

  if (loading) return <p className="text-xs text-[#6B7280] p-4">Loading farmer details…</p>;
  if (!farmer) return <p className="text-xs text-[#DC2626] p-4">Farmer not found</p>;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
        <Link to="/farmer/manager/farmers" className="hover:text-[#217346]">Farmers</Link>
        <span>›</span>
        <span className="text-[#1F2937] font-semibold">{farmer.name}</span>
      </div>

      {/* Profile Card */}
      <div className={`${EXCEL_PANEL} p-4`}>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-[#D4D4D4] bg-[#F2F2F2] text-xl font-bold text-[#217346]">
            {farmer.initials || farmer.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className={EXCEL_PAGE_TITLE}>{farmer.name}</h1>
            <p className={EXCEL_PAGE_SUB}>{farmer.mobile} · {farmer.email || "—"}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {STATUS_BADGE(farmer.status)}
              <span className="text-[10px] text-[#6B7280]">Code: {farmer.farmerCode || "—"}</span>
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

        {/* Farm Info */}
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

      {/* Tabs */}
      <div className="flex gap-0 overflow-x-auto border-b border-[#D4D4D4]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
              tab === t
                ? "border-[#217346] text-[#217346]"
                : "border-transparent text-[#6B7280] hover:text-[#1F2937]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={EXCEL_PANEL}>
        {tab === "Overview" && (
          <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
            <div><span className="text-[#6B7280]">Village: </span><span className="font-semibold">{farmer.address?.village || "—"}</span></div>
            <div><span className="text-[#6B7280]">Taluka: </span><span className="font-semibold">{farmer.address?.taluka || "—"}</span></div>
            <div><span className="text-[#6B7280]">District: </span><span className="font-semibold">{farmer.address?.district || "—"}</span></div>
            <div><span className="text-[#6B7280]">State: </span><span className="font-semibold">{farmer.address?.state || "—"}</span></div>
            <div><span className="text-[#6B7280]">Pincode: </span><span className="font-semibold">{farmer.address?.pincode || "—"}</span></div>
            <div><span className="text-[#6B7280]">Bank: </span><span className="font-semibold">{farmer.bank?.bankName || "—"}</span></div>
            <div><span className="text-[#6B7280]">Account: </span><span className="font-semibold">{farmer.bank?.accountNumber || "—"}</span></div>
            <div><span className="text-[#6B7280]">IFSC: </span><span className="font-semibold">{farmer.bank?.ifsc || "—"}</span></div>
          </div>
        )}

        {tab === "Crops" && (
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-[#D4D4D4] px-3 py-2.5">
              <p className="text-xs font-semibold text-[#1F2937]">Crops</p>
              <Link
                to={`/farmer/manager/farmers/${farmerId}/crops/add`}
                className={`${EXCEL_BTN_PRIMARY} px-3 py-1.5 text-[11px]`}
              >
                + Add Crop
              </Link>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#F2F2F2] text-left">
                  {["Crop", "Crop ID", "Variety", "Sowing", "Harvest", "Status", "Action"].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold text-[#6B7280]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {crops.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-4 text-center text-[#6B7280]">No crops added for this farmer</td></tr>
                ) : crops.map((crop) => (
                  <tr key={crop.cropId || crop.id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                    <td className="px-3 py-2.5 font-semibold">{crop.cropName}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-emerald-700">{formatCropBusinessId(crop)}</td>
                    <td className="px-3 py-2.5">{crop.variety || "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{formatCropDate(crop.sowingDate)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{formatCropDate(crop.expectedHarvestDate)}</td>
                    <td className="px-3 py-2.5">{STATUS_BADGE(crop.status)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-nowrap items-center gap-1.5">
                        <Link
                          to={`/farmer/manager/farmers/${farmerId}/crops/${encodeURIComponent(crop.cropId || crop.id)}`}
                          className="border border-[#D4D4D4] bg-white px-2.5 py-1 text-[11px] font-semibold hover:bg-[#F2F2F2]"
                        >
                          View
                        </Link>
                        <Link
                          to={`/farmer/manager/farmers/${farmerId}/crops/${encodeURIComponent(crop.cropId || crop.id)}/edit`}
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
                              await deleteManagerFarmerCrop(farmerId, id);
                              toast.success("Crop deleted");
                              setCrops(await getManagerFarmerCrops(farmerId).catch(() => []));
                            } catch (err) {
                              toast.error(err?.message || "Failed to delete crop");
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                to={`/farmer/manager/farmers/${farmerId}/products/add`}
                className={`${EXCEL_BTN_PRIMARY} px-3 py-1.5 text-[11px]`}
              >
                + Add Product
              </Link>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#F2F2F2] text-left">
                  {["Product", "Product ID", "Category", "Grades", "Harvest Date", "Status", "Action"].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold text-[#6B7280]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={7} className="px-3 py-4 text-center text-[#6B7280]">No products</td></tr>
                ) : products.map((p) => (
                  <tr key={p.id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                    <td className="px-3 py-2.5 font-semibold">{p.name}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-emerald-700">{formatProductBusinessId(p)}</td>
                    <td className="px-3 py-2.5">{p.category}</td>
                    <td className="px-3 py-2.5">
                      {p.grades?.map((g) => `${g.label}: ${g.quantity} Kg`).join(" · ") || "—"}
                    </td>
                    <td className="px-3 py-2.5">{p.harvestDate || "—"}</td>
                    <td className="px-3 py-2.5">{STATUS_BADGE(p.status)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-nowrap items-center gap-1">
                        <button
                          type="button"
                          disabled={busyProductId === (p.id || p.productId) || !isPendingProductApproval(p.status)}
                          onClick={() => handleReviewProduct(p, "approved")}
                          className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 hover:bg-green-200 disabled:opacity-40"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busyProductId === (p.id || p.productId) || !isPendingProductApproval(p.status)}
                          onClick={() => handleReviewProduct(p, "rejected")}
                          className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 hover:bg-red-200 disabled:opacity-40"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                    <th key={h} className="px-3 py-2.5 font-semibold text-[#6B7280]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inventory.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-4 text-center text-[#6B7280]">No inventory</td></tr>
                ) : inventory.flatMap((p) =>
                  (p.grades || [{ label: "All", quantity: p.stock || 0 }]).map((g, gi) => (
                    <tr key={`${p.id}-${gi}`} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                      <td className="px-3 py-2.5 font-semibold">{gi === 0 ? p.name : ""}</td>
                      <td className="px-3 py-2.5">{g.label}</td>
                      <td className="px-3 py-2.5">{g.quantity} Kg</td>
                      <td className="px-3 py-2.5">{STATUS_BADGE(p.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Orders" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#F2F2F2]">
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-center text-[#4B5563] w-12 font-semibold">Sr.</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-left text-[#1F2937] font-semibold">Date</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-left text-[#1F2937] font-semibold">Day</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-left text-[#1F2937] font-semibold">Product</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-left text-[#1F2937] font-semibold">Category</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-center text-[#1F2937] font-semibold">Unit</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-right text-[#1F2937] font-semibold">Grade A Qty</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-right text-[#DC2626] font-semibold">Rejection Qty</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-right text-[#1F2937] font-semibold">Amount</th>
                  <th className="border border-[#D4D4D4] px-2.5 py-2 text-center text-[#1F2937] font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={10} className="border border-[#D4D4D4] px-3 py-6 text-center text-[#6B7280]">No harvest orders found for this farmer</td></tr>
                ) : orders.flatMap((o, oIdx) => {
                  const prods = o.products && o.products.length ? o.products : [{
                    name: o.productName || "Produce",
                    category: o.category || "Produce",
                    unit: o.unit || "Kg",
                    grade: "Grade A",
                    quantity: o.totalQuantity || 0,
                    price: 0,
                    total: o.totalAmount || o.amount || 0,
                  }];
                  const dateStr = o.harvestDate || (o.orderDate ? new Date(o.orderDate).toISOString().split("T")[0] : "—");
                  const dayStr = o.day || "Today";

                  return prods.map((p, pIdx) => (
                    <tr key={`${o.id}-${pIdx}`} className="border border-[#D4D4D4] hover:bg-[#F9F9F9] transition-colors">
                      <td className="border border-[#D4D4D4] px-2.5 py-2 text-center text-[#6B7280]">{oIdx + 1}</td>
                      <td className="border border-[#D4D4D4] px-2.5 py-2 font-medium whitespace-nowrap">{dateStr}</td>
                      <td className="border border-[#D4D4D4] px-2.5 py-2 text-[#6B7280]">{dayStr}</td>
                      <td className="border border-[#D4D4D4] px-2.5 py-2 font-bold text-[#1F2937]">{p.name}</td>
                      <td className="border border-[#D4D4D4] px-2.5 py-2 text-[#6B7280]">{p.category || o.category || "Produce"}</td>
                      <td className="border border-[#D4D4D4] px-2.5 py-2 text-center text-[#6B7280]">{p.unit || o.unit || "Kg"}</td>
                      <td className="border border-[#D4D4D4] px-2.5 py-2 text-right font-bold text-[#1F2937] tabular-nums">
                        {p.quantity || 0} {p.unit || o.unit || "Kg"}
                      </td>
                      <td className="border border-[#D4D4D4] px-2.5 py-2 text-right font-bold text-[#DC2626] tabular-nums">
                        {pIdx === 0 ? Number(o.rejectionQty || 0) : 0} {p.unit || o.unit || "Kg"}
                      </td>
                      <td className="border border-[#D4D4D4] px-2.5 py-2 text-right font-semibold text-[#217346] tabular-nums">
                        ₹{(p.total || o.totalAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="border border-[#D4D4D4] px-2.5 py-2 text-center whitespace-nowrap">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Earnings" && (
          <div className="p-3 space-y-3">
            <div className="flex justify-between items-center bg-[#F2F8F3] p-2.5 border border-[#D4D4D4]">
              <span className="font-bold text-xs text-[#1F2937]">Detailed Farmer Produce & Earnings</span>
              <Link
                to={`/farmer/manager/earnings/farmer/${farmer.id}`}
                className="border border-[#217346] bg-[#217346] px-3 py-1 text-xs font-bold text-white hover:bg-[#1a5c38]"
              >
                📊 Open Full Earning Spreadsheet ↗
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[#F2F2F2] text-left">
                    {["Date", "Crop", "Quantity", "Gross", "Deductions", "Net", "Status"].map((h) => (
                      <th key={h} className="px-3 py-2.5 font-semibold text-[#6B7280]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {earnings.length === 0 ? (
                    <tr><td colSpan={7} className="px-3 py-4 text-center text-[#6B7280]">No earnings recorded</td></tr>
                  ) : earnings.map((e) => (
                    <tr key={e.id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                      <td className="px-3 py-2.5">{e.date}</td>
                      <td className="px-3 py-2.5">{e.cropName}</td>
                      <td className="px-3 py-2.5">{e.quantity} Kg</td>
                      <td className="px-3 py-2.5">₹{(e.grossEarnings || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2.5 text-[#DC2626]">-₹{e.deductions || 0}</td>
                      <td className="px-3 py-2.5 font-semibold text-[#217346]">₹{(e.netEarnings || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2.5">{STATUS_BADGE(e.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "Documents" && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-[#6B7280]">
              Upload KYC documents for this farmer. Files can also be replaced later.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {mergeFarmerDocs(documents).map((d) => (
                <div key={d.type} className="border border-[#D4D4D4] p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[#1F2937]">{d.name}</p>
                      <p className="mt-0.5 text-[10px] text-[#6B7280]">
                        {d.fileUrl ? (
                          <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-[#217346] underline">
                            {d.fileName}
                          </a>
                        ) : (
                          "Not uploaded yet"
                        )}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[#6B7280]">
                        {d.uploadedAt ? `Uploaded ${new Date(d.uploadedAt).toLocaleDateString("en-IN")}` : "—"}
                      </p>
                    </div>
                    {STATUS_BADGE(d.status)}
                  </div>
                  <FileUpload
                    label=""
                    currentFileName={d.fileName || ""}
                    disabled={uploadingType === d.type}
                    onSelect={(file) => handleUploadDocument(d.type, file)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
