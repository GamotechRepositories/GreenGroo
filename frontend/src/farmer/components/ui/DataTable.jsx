import { EXCEL_CELL, EXCEL_HEAD, EXCEL_TABLE, EXCEL_WRAP } from "../../utils/excelStyles";

function DataTable({ columns, rows, keyField = "id", emptyMessage = "No records found." }) {
  if (!rows?.length) {
    return (
      <div className={`${EXCEL_WRAP} px-3 py-8 text-center text-xs text-[#6B7280]`}>{emptyMessage}</div>
    );
  }

  return (
    <div className={EXCEL_WRAP}>
      <table className={EXCEL_TABLE}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={`${EXCEL_HEAD} whitespace-nowrap text-left`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[keyField]} className="hover:bg-[#F9F9F9]">
              {columns.map((col) => (
                <td key={col.key} className={`${EXCEL_CELL} whitespace-nowrap`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
