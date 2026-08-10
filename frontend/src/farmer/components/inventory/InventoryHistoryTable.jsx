import DataTable from "../ui/DataTable";
import { EXCEL_WRAP } from "../../utils/excelStyles";

const HISTORY_COLUMNS = [
  {
    key: "at",
    header: "Date & Time",
    wrap: true,
    render: (row) => new Date(row.at).toLocaleString("en-IN"),
  },
  { key: "productName", header: "Product", wrap: true },
  { key: "grade", header: "Grade" },
  { key: "action", header: "Action", wrap: true },
  {
    key: "previousStock",
    header: "Previous Stock",
    align: "right",
    render: (row) => <span className="tabular-nums">{row.previousStock}</span>,
  },
  {
    key: "changedQuantity",
    header: "Changed Qty",
    align: "right",
    render: (row) => {
      const qty = Number(row.changedQuantity) || 0;
      return (
        <span className={`tabular-nums ${qty >= 0 ? "text-emerald-700" : "text-red-600"}`}>
          {qty >= 0 ? `+${qty}` : qty}
        </span>
      );
    },
  },
  {
    key: "newStock",
    header: "New Stock",
    align: "right",
    render: (row) => <span className="tabular-nums">{row.newStock}</span>,
  },
  { key: "reason", header: "Reason" },
  { key: "updatedBy", header: "Updated By" },
  {
    key: "reference",
    header: "Reference",
    wrap: true,
    render: (row) => row.reference || "—",
  },
];

function InventoryHistoryTable({ rows = [], emptyMessage = "No inventory history yet." }) {
  if (!rows.length) {
    return (
      <div className="px-3 py-8 text-center text-xs text-[#6B7280]">{emptyMessage}</div>
    );
  }

  return (
    <div className={EXCEL_WRAP}>
      <div className="overflow-x-auto">
        <DataTable columns={HISTORY_COLUMNS} rows={rows} embedded compact />
      </div>
    </div>
  );
}

export default InventoryHistoryTable;
