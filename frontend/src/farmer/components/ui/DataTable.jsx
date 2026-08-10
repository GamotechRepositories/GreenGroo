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
        className={`${embedded ? "border-t border-[#D4D4D4]" : EXCEL_WRAP} px-3 py-8 text-center text-xs text-[#6B7280]`}
      >
        {emptyMessage}
      </div>
    );
  }

  const cellClass = compact
    ? "border border-[#D4D4D4] px-1 py-0.5 text-[10px] leading-tight text-[#1F2937]"
    : EXCEL_CELL;
  const headClass = compact
    ? "border border-[#D4D4D4] bg-[#F2F2F2] px-1 py-0.5 text-[10px] font-semibold leading-tight text-[#1F2937]"
    : EXCEL_HEAD;

  const handleRowClick = (row, event) => {
    if (!onRowClick) return;
    if (event.target.closest("a, button, select, input, textarea, label")) return;
    onRowClick(row);
  };

  const table = (
    <table className={`${EXCEL_TABLE} ${compact ? "table-fixed w-full" : ""}`}>
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
            className={`hover:bg-[#F9F9F9] ${onRowClick ? "cursor-pointer" : ""} ${
              selectedRowId && row[keyField] === selectedRowId ? "bg-[#E8F5E9]" : ""
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
