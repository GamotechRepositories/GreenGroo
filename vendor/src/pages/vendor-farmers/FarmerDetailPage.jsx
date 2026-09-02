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
    Pending: "bg-yellow-100 text-yellow-700",
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
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

function mergeFarmerDocs(docs = []) {
  const map = Object.fromEntries(docs.map((d) => [d.type, d]));
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

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  const [uploadingType, setUploadingType] = useState("");

  const loadDocuments = () =>
    vendorApi
      .getFarmerDocuments(farmerId)
      .then((res) => setDocuments(asList(res)))
      .catch(() => setDocuments([]));

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
      vendorApi.getFarmerOrders(farmerId).then((r) => setOrders(asList(r))).catch(() => setOrders([]));
    }
    if (tab === "Earnings") {
      vendorApi.getFarmerEarnings(farmerId).then((r) => setEarnings(asList(r))).catch(() => setEarnings([]));
    }
    if (tab === "Documents") loadDocuments();
  }, [tab, farmerId]);

  const handleUploadDocument = async (type, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      window.alert("File must be 5MB or smaller");
      return;
    }
    setUploadingType(type);
    try {
      const url = await fileToDataUrl(file);
      await vendorApi.uploadFarmerDocument(farmerId, { type, fileName: file.name, fileUrl: url });
      await loadDocuments();
    } catch (err) {
      window.alert(err?.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingType("");
    }
  };

  if (loading) return <p className="p-6 text-xs text-[#6B7280]">Loading farmer details…</p>;
  if (!farmer) return <p className="p-6 text-xs text-[#DC2626]">Farmer not found</p>;

  return (
    <div className="space-y-4 p-6">
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
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-[#F2F2F2] text-left">
                  {["Product", "Category", "Grades", "Harvest Date", "Status"].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold text-[#6B7280]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-[#6B7280]">
                      No products
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                      <td className="px-3 py-2.5 font-semibold">{p.name}</td>
                      <td className="px-3 py-2.5">{p.category}</td>
                      <td className="px-3 py-2.5">
                        {p.grades?.map((g) => `${g.label}: ${g.quantity} Kg`).join(" · ") || p.gradesSummary || "—"}
                      </td>
                      <td className="px-3 py-2.5">{p.harvestDate || "—"}</td>
                      <td className="px-3 py-2.5">{STATUS_BADGE(p.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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

        {tab === "Documents" && (
          <div className="space-y-3 p-4">
            <p className="text-xs text-[#6B7280]">KYC documents for this farmer. Files can also be replaced later.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {mergeFarmerDocs(documents).map((d) => (
                <div key={d.type} className="space-y-2 border border-[#D4D4D4] p-3">
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
                  <label className="inline-flex cursor-pointer border border-[#D4D4D4] bg-white px-2.5 py-1 text-[11px] font-semibold hover:bg-[#F2F2F2]">
                    {uploadingType === d.type ? "Uploading…" : d.fileName ? "Replace file" : "Choose file"}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      disabled={uploadingType === d.type}
                      onChange={(e) => handleUploadDocument(d.type, e.target.files?.[0])}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
