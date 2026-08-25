import { EXCEL_CELL, EXCEL_HEAD, EXCEL_TABLE, EXCEL_WRAP } from "../../utils/excelStyles";

function DataTable({
  columns,
  rows,
  keyField = "id",
  emptyMessage = "No records found.",
  embedded = false,
  compact = false,
  onRowClick,
  selectedRowId,
}) {
  if (!rows?.length) {
    return (
      <div
        className={`${embedded ? "border-t border-slate-100" : EXCEL_WRAP} px-4 py-10 text-center text-sm text-slate-500`}
      >
        {emptyMessage}
      </div>
    );
  }

  const cellClass = compact
    ? "border-b border-slate-100 px-2 py-1.5 text-xs leading-tight text-slate-700"
    : EXCEL_CELL;
  const headClass = compact
    ? "border-b border-slate-200 bg-slate-50 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
    : EXCEL_HEAD;

  const handleRowClick = (row, event) => {
    if (!onRowClick) return;
    if (event.target.closest("a, button, select, input, textarea, label")) return;
    onRowClick(row);
  };

  const table = (
    <table className={`${EXCEL_TABLE} ${compact ? "table-fixed w-full min-w-0" : ""}`}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              className={`${headClass} ${col.align === "right" ? "text-right" : "text-left"} ${compact ? "whitespace-normal break-words" : "whitespace-nowrap"}`}
              style={col.width ? { width: col.width } : undefined}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row[keyField]}
            onClick={(event) => handleRowClick(row, event)}
            className={`transition hover:bg-emerald-50/40 ${onRowClick ? "cursor-pointer" : ""} ${
              selectedRowId && row[keyField] === selectedRowId ? "bg-emerald-50" : ""
            }`}
          >
            {columns.map((col) => (
              <td
                key={col.key}
                className={`${cellClass} ${col.align === "right" ? "text-right" : "text-left"} ${compact || col.wrap ? "whitespace-normal break-words" : "whitespace-nowrap"}`}
              >
                {col.render ? col.render(row) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (embedded) return table;

  return <div className={EXCEL_WRAP}>{table}</div>;
}

export default DataTable;
