import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getManagerFarmers, getManagerFarmerProducts } from "../../api/farmerApi";
import { EXCEL_PANEL, EXCEL_INPUT, EXCEL_PAGE_TITLE, EXCEL_PAGE_SUB, EXCEL_BTN, EXCEL_BTN_PRIMARY } from "../../utils/excelStyles";

export default function ManagerProductsPage() {
  const [farmers, setFarmers] = useState([]);
  const [productsByFarmer, setProductsByFarmer] = useState({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const fs = await getManagerFarmers();
      const farmerList = Array.isArray(fs) ? fs : [];
      setFarmers(farmerList);

      const results = await Promise.all(
        farmerList.map((f) =>
          getManagerFarmerProducts(f.id)
            .then((prods) => ({ farmerId: f.id, products: Array.isArray(prods) ? prods : [] }))
            .catch(() => ({ farmerId: f.id, products: [] }))
        )
      );

      const map = {};
      results.forEach(({ farmerId, products }) => {
        map[farmerId] = products;
      });
      setProductsByFarmer(map);
    } catch {
      setFarmers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter farmers to display
  const displayedFarmers = farmers.filter((f) => {
    if (selectedFarmerId && f.id !== selectedFarmerId) return false;
    if (!q) return true;
    const query = q.toLowerCase();
    const matchesFarmer =
      f.name?.toLowerCase().includes(query) ||
      f.mobile?.includes(query) ||
      f.farmName?.toLowerCase().includes(query);
    const farmerProds = productsByFarmer[f.id] || [];
    const matchesProduct = farmerProds.some(
      (p) =>
        p.name?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
    );
    return matchesFarmer || matchesProduct;
  });

  // Calculate totals
  const allLoadedProducts = Object.values(productsByFarmer).flat();
  const totalProductsCount = allLoadedProducts.length;
  const totalStockKg = allLoadedProducts.reduce((sum, p) => {
    const gradesSum = (p.grades || []).reduce((s, g) => s + Number(g.quantity || 0), 0);
    return sum + (gradesSum || Number(p.stock || 0));
  }, 0);

  // Extract unique categories
  const allCategories = Array.from(
    new Set(allLoadedProducts.map((p) => p.category).filter(Boolean))
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>All Products (Farmer-wise)</h1>
          <p className={EXCEL_PAGE_SUB}>View and monitor produce grouped by each assigned farmer</p>
        </div>
        <Link
          to="/farmer/manager/farmers/add"
          className={`${EXCEL_BTN_PRIMARY} inline-block px-3 py-1.5 text-xs`}
        >
          + Add Farmer
        </Link>
      </div>

      {/* Summary Stat Badges */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Assigned Farmers", value: farmers.length, color: "text-[#1F2937]" },
          { label: "Total Products", value: totalProductsCount, color: "text-[#217346]" },
          { label: "Total Produce Stock", value: `${totalStockKg.toLocaleString("en-IN")} Kg`, color: "text-emerald-700" },
          { label: "Active Produce Categories", value: allCategories.length || "—", color: "text-blue-700" },
        ].map((s) => (
          <div key={s.label} className={`${EXCEL_PANEL} p-3`}>
            <p className="text-[11px] text-[#6B7280]">{s.label}</p>
            <p className={`mt-0.5 text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by product, category, or farmer name…"
          className={`${EXCEL_INPUT} max-w-xs`}
        />
        <select
          value={selectedFarmerId}
          onChange={(e) => setSelectedFarmerId(e.target.value)}
          className={`${EXCEL_INPUT} max-w-[200px]`}
        >
          <option value="">All Farmers ({farmers.length})</option>
          {farmers.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.mobile})
            </option>
          ))}
        </select>
        {allCategories.length > 0 && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`${EXCEL_INPUT} max-w-[160px]`}
          >
            <option value="">All Categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Farmer-wise Product Panels */}
      {loading ? (
        <div className={`${EXCEL_PANEL} p-8 text-center text-xs text-[#6B7280]`}>
          Loading farmer products…
        </div>
      ) : displayedFarmers.length === 0 ? (
        <div className={`${EXCEL_PANEL} p-8 text-center text-xs text-[#6B7280]`}>
          {farmers.length === 0 ? (
            <div className="space-y-2">
              <p className="font-semibold text-gray-700">No farmers assigned to your account yet.</p>
              <Link
                to="/farmer/manager/farmers/add"
                className={`${EXCEL_BTN_PRIMARY} inline-block px-4 py-2 text-xs`}
              >
                + Register First Farmer
              </Link>
            </div>
          ) : (
            "No matching farmer or products found"
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedFarmers.map((f) => {
            const rawProds = productsByFarmer[f.id] || [];
            const farmerProds = rawProds.filter((p) => {
              if (selectedCategory && p.category !== selectedCategory) return false;
              if (!q) return true;
              const query = q.toLowerCase();
              return (
                p.name?.toLowerCase().includes(query) ||
                p.category?.toLowerCase().includes(query) ||
                f.name?.toLowerCase().includes(query)
              );
            });

            const farmerTotalStock = farmerProds.reduce((sum, p) => {
              const gradesSum = (p.grades || []).reduce((s, g) => s + Number(g.quantity || 0), 0);
              return sum + (gradesSum || Number(p.stock || 0));
            }, 0);

            return (
              <div key={f.id} className={EXCEL_PANEL}>
                {/* Farmer Header */}
                <div className="flex flex-wrap items-center justify-between border-b border-[#D4D4D4] bg-[#F8FBF8] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#D4D4D4] bg-white text-xs font-bold text-[#217346]">
                      {f.initials || f.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xs font-bold text-[#1F2937]">{f.name}</h2>
                        <span className="text-[10px] text-[#6B7280]">({f.mobile})</span>
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                          f.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {f.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B7280]">
                        {f.farmName ? <span className="font-semibold text-gray-700">{f.farmName} · </span> : ""}
                        {f.farmLocation || "No location"} · {f.farmType || "Organic"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <span className="text-[10px] text-[#6B7280]">Total Stock: </span>
                      <span className="font-bold text-[#217346]">{farmerTotalStock} Kg</span>
                      <span className="text-[10px] text-[#6B7280] ml-2">({farmerProds.length} Products)</span>
                    </div>
                    <Link
                      to={`/farmer/manager/farmers/${f.id}`}
                      className={`${EXCEL_BTN} text-[11px]`}
                    >
                      View Profile →
                    </Link>
                  </div>
                </div>

                {/* Farmer Products Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#D4D4D4] bg-[#F2F2F2] text-left">
                        {["Product Name", "Category", "Grades & Stock", "Total Qty", "Harvest Date", "Status"].map((h) => (
                          <th key={h} className="px-3 py-2 font-semibold text-[#6B7280]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {farmerProds.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-5 text-center text-[#6B7280]">
                            No products added by {f.name} yet.
                          </td>
                        </tr>
                      ) : (
                        farmerProds.map((p) => {
                          const totalQty = (p.grades || []).reduce((s, g) => s + Number(g.quantity || 0), 0) || Number(p.stock || 0);
                          return (
                            <tr key={p.id} className="border-b border-[#D4D4D4] last:border-0 hover:bg-[#F9F9F9]">
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                  {p.image ? (
                                    <img src={p.image} alt={p.name} className="h-7 w-7 rounded object-cover border border-[#D4D4D4]" />
                                  ) : (
                                    <div className="flex h-7 w-7 items-center justify-center rounded bg-[#E8F5E9] text-[10px] font-bold text-[#217346]">
                                      {p.name?.charAt(0)}
                                    </div>
                                  )}
                                  <span className="font-semibold text-gray-900">{p.name}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-gray-600">
                                {p.category} {p.subCategory ? `· ${p.subCategory}` : ""}
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {(p.grades || []).map((g) => (
                                    <span key={g.id || g.label} className="inline-flex items-center gap-1 rounded bg-[#E8F5E9] px-1.5 py-0.5 text-[10px] font-semibold text-[#217346]">
                                      <span>{g.label}:</span>
                                      <span>{g.quantity} Kg</span>
                                    </span>
                                  ))}
                                  {(!p.grades || p.grades.length === 0) && (
                                    <span className="text-gray-500">{p.stock || 0} Kg</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 font-bold text-[#217346]">
                                {totalQty} Kg
                              </td>
                              <td className="px-3 py-2.5 text-[#6B7280]">
                                {p.harvestDate ? new Date(p.harvestDate).toLocaleDateString("en-IN") : (p.harvestDate || "—")}
                              </td>
                              <td className="px-3 py-2.5">
                                <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                                  p.status === "Approved" ? "bg-green-100 text-green-700" :
                                  p.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                                  "bg-gray-100 text-gray-600"
                                }`}>
                                  {p.status || "Active"}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
