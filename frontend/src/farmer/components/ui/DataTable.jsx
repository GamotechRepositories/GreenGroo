function DataTable({ columns, rows, keyField = "id", emptyMessage = "No records found." }) {
  if (!rows?.length) {
    return <p className="py-10 text-center text-sm text-[#6B7280]">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[#F9FAFB] text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-4 py-3">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E7EB]">
          {rows.map((row) => (
            <tr key={row[keyField]} className="hover:bg-[#F7F2E8]/40">
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-4 py-3 text-[#1F2937]">
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
