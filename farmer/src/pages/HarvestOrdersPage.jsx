import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getHarvestOrders, getProducts } from "../api/farmerApi";
import LoadingState from "../components/ui/LoadingState";
import StatusBadge from "../components/ui/StatusBadge";
import { EXCEL_PANEL, EXCEL_PANEL_HEAD, EXCEL_TABLE, EXCEL_WRAP, EXCEL_HEAD, EXCEL_CELL } from "../utils/excelStyles";

export default function HarvestOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getHarvestOrders();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error(err.message || "Failed to load harvest orders");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingState />;

  // Extract unique grade names across all harvest orders for dynamic columns
  const gradeSet = new Set();
  orders.forEach((o) => {
    (o.grades || []).forEach((g) => {
      if (g.name) gradeSet.add(g.name);
    });
  });
  const dynamicGrades = Array.from(gradeSet);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1F2937]">Harvest Orders</h1>
          <p className="text-xs text-[#6B7280]">View harvest order records submitted by Vendor / Farmer Manager</p>
        </div>
        <span className="rounded bg-[#E8F5E9] px-2.5 py-1 text-xs font-bold text-[#217346]">
          View Only (Managed by Vendor)
        </span>
      </div>

      <section className={EXCEL_PANEL}>
        <h2 className={EXCEL_PANEL_HEAD}>Harvest Order Details</h2>
        <div className="p-3">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B7280]">
              No harvest orders recorded yet. Vendor Manager will issue harvest orders here.
            </div>
          ) : (
            <div className={EXCEL_WRAP}>
              <table className={EXCEL_TABLE}>
                <thead>
                  <tr>
                    <th className={`${EXCEL_HEAD} text-center`}>Sr.</th>
                    <th className={`${EXCEL_HEAD} text-left`}>Date</th>
                    <th className={`${EXCEL_HEAD} text-left`}>Day</th>
                    <th className={`${EXCEL_HEAD} text-left`}>Product</th>
                    <th className={`${EXCEL_HEAD} text-left`}>Category</th>
                    <th className={`${EXCEL_HEAD} text-center`}>Unit</th>
                    {dynamicGrades.length > 0
                      ? dynamicGrades.map((g) => (
                          <th key={g} className={`${EXCEL_HEAD} text-right`}>
                            {g} Qty
                          </th>
                        ))
                      : (
                        <>
                          <th className={`${EXCEL_HEAD} text-right`}>Grade A Qty</th>
                          <th className={`${EXCEL_HEAD} text-right`}>Grade B Qty</th>
                        </>
                      )}
                    <th className={`${EXCEL_HEAD} text-right text-[#DC2626]`}>Rejection Qty</th>
                    <th className={`${EXCEL_HEAD} text-center`}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, idx) => {
                    const gradeMap = {};
                    (o.grades || []).forEach((g) => {
                      gradeMap[g.name] = g.quantity;
                    });

                    return (
                      <tr key={o.id || idx} className="hover:bg-[#F9F9F9]">
                        <td className={`${EXCEL_CELL} text-center text-[#6B7280]`}>{idx + 1}</td>
                        <td className={`${EXCEL_CELL} font-medium`}>{o.date || "—"}</td>
                        <td className={`${EXCEL_CELL} text-[#6B7280]`}>{o.day || "—"}</td>
                        <td className={`${EXCEL_CELL} font-bold text-[#1F2937]`}>{o.productName}</td>
                        <td className={`${EXCEL_CELL} text-[#6B7280]`}>{o.category}</td>
                        <td className={`${EXCEL_CELL} text-center text-[#6B7280]`}>{o.unit}</td>
                        {dynamicGrades.length > 0
                          ? dynamicGrades.map((g) => (
                              <td key={g} className={`${EXCEL_CELL} text-right tabular-nums font-semibold`}>
                                {gradeMap[g] !== undefined ? `${gradeMap[g]} ${o.unit}` : "0 " + o.unit}
                              </td>
                            ))
                          : (
                            <>
                              <td className={`${EXCEL_CELL} text-right tabular-nums font-semibold`}>
                                {o.grades?.[0]?.quantity ?? 0} {o.unit}
                              </td>
                              <td className={`${EXCEL_CELL} text-right tabular-nums font-semibold`}>
                                {o.grades?.[1]?.quantity ?? 0} {o.unit}
                              </td>
                            </>
                          )}
                        <td className={`${EXCEL_CELL} text-right tabular-nums font-bold text-[#DC2626]`}>
                          {o.rejectionQty || 0} {o.unit}
                        </td>
                        <td className={`${EXCEL_CELL} text-center`}>
                          <StatusBadge status={o.status || "Approved"} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
