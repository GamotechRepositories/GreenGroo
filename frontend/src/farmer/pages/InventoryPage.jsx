import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  adjustStock,
  getInventory,
  getStockHistory,
} from "../api/farmerApi";
import DataTable from "../components/ui/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingState from "../components/ui/LoadingState";
import Modal from "../components/ui/Modal";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
} from "../utils/excelStyles";

function InventoryPage() {
  const [rows, setRows] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [change, setChange] = useState(0);
  const [reason, setReason] = useState("Stock adjustment");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [inventory, stockHistory] = await Promise.all([getInventory(), getStockHistory()]);
      setRows(inventory);
      setHistory(stockHistory);
    } catch (err) {
      toast.error(err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = [
    { key: "product", header: "Product" },
    { key: "sku", header: "SKU" },
    { key: "currentStock", header: "Current Stock" },
    { key: "unit", header: "Unit" },
    { key: "lowStockLimit", header: "Low Stock Limit" },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "lastUpdated",
      header: "Last Updated",
      render: (row) => new Date(row.lastUpdated).toLocaleString("en-IN"),
    },
    {
      key: "action",
      header: "Action",
      render: (row) => (
        <button
          type="button"
          onClick={() => {
            setSelected(row);
            setChange(0);
            setReason("Stock adjustment");
          }}
          className="font-semibold text-[#217346]"
        >
          Adjust
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className={EXCEL_PAGE_TITLE}>Inventory</h1>
        <p className={`mt-0.5 ${EXCEL_PAGE_SUB}`}>
          Update stock, track low-stock alerts, and view history.
        </p>
      </div>

      {loading ? <LoadingState /> : <DataTable columns={columns} rows={rows} />}

      <section className="space-y-2">
        <h2 className={EXCEL_PAGE_TITLE}>Stock History</h2>
        <DataTable
          columns={[
            { key: "productName", header: "Product" },
            {
              key: "change",
              header: "Change",
              render: (row) => (
                <span className={row.change >= 0 ? "text-emerald-700" : "text-red-600"}>
                  {row.change >= 0 ? `+${row.change}` : row.change}
                </span>
              ),
            },
            { key: "reason", header: "Reason" },
            { key: "stockAfter", header: "Stock After" },
            {
              key: "at",
              header: "Date",
              render: (row) => new Date(row.at).toLocaleString("en-IN"),
            },
          ]}
          rows={history}
        />
      </section>

      <Modal
        open={Boolean(selected)}
        title={`Adjust stock — ${selected?.product || ""}`}
        onClose={() => setSelected(null)}
        footer={
          <>
            <button type="button" onClick={() => setSelected(null)} className={EXCEL_BTN}>
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !change}
              onClick={async () => {
                setBusy(true);
                try {
                  await adjustStock({
                    productId: selected.id,
                    change: Number(change),
                    reason,
                  });
                  toast.success("Stock updated");
                  setSelected(null);
                  load();
                } catch (err) {
                  toast.error(err.message || "Update failed");
                } finally {
                  setBusy(false);
                }
              }}
              className={EXCEL_BTN_PRIMARY}
            >
              Save
            </button>
          </>
        }
      >
        <p className="mb-2 text-xs text-[#6B7280]">
          Current stock: <strong>{selected?.currentStock}</strong> {selected?.unit}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setChange(10)} className={EXCEL_BTN}>
            + Add 10
          </button>
          <button type="button" onClick={() => setChange(-5)} className={EXCEL_BTN}>
            − Reduce 5
          </button>
        </div>
        <label className="mt-3 block text-xs font-semibold">Change (+/−)</label>
        <input type="number" value={change} onChange={(e) => setChange(e.target.value)} className={`mt-1 ${EXCEL_INPUT}`} />
        <label className="mt-2 block text-xs font-semibold">Reason</label>
        <input value={reason} onChange={(e) => setReason(e.target.value)} className={`mt-1 ${EXCEL_INPUT}`} />
      </Modal>
    </div>
  );
}

export default InventoryPage;
