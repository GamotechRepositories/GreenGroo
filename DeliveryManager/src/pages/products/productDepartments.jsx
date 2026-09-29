export const DEFAULT_DEPARTMENTS = [
  { slug: "preorder", name: "Pre-order" },
  { slug: "ready2cook", name: "Ready2Cook" },
  { slug: "instantorder", name: "Instant Order" },
];

export const DEPARTMENT_STYLES = {
  preorder: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ready2cook: "bg-amber-50 text-amber-800 border-amber-200",
  instant: "bg-sky-50 text-sky-700 border-sky-200",
};

export const DEPARTMENT_LABELS = {
  preorder: "Pre-order",
  ready2cook: "Ready2Cook",
  instant: "Instant",
};

/** Section slug / alias → preorder | ready2cook | instant */
export function toDepartment(section) {
  const s = String(section || "").toLowerCase();
  if (["ready2cook", "ready-2-cook", "festive"].includes(s)) return "ready2cook";
  if (["instantorder", "instant", "supermall", "mall"].includes(s)) return "instant";
  return "preorder";
}

export function departmentPrefix(section) {
  const dept = toDepartment(section);
  if (dept === "ready2cook") return "RD";
  if (dept === "instant") return "IN";
  return "PR";
}

export function storeTypeFor(section) {
  const dept = toDepartment(section);
  if (dept === "ready2cook") return "festive";
  if (dept === "instant") return "mall";
  return "main";
}

/** Mirrors backend buildDepartmentId, e.g. PR-28-R2C3 */
export function previewDepartmentId({ department, deptNumber, rackRow, rackColumn }) {
  const clean = (v) => String(v || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const number = clean(deptNumber);
  if (!number) return "";
  const row = clean(rackRow).replace(/^R/, "");
  const column = clean(rackColumn).replace(/^C/, "");
  const location = row || column ? `-${row ? `R${row}` : ""}${column ? `C${column}` : ""}` : "";
  return `${departmentPrefix(department)}-${number}${location}`;
}

export function DepartmentBadge({ department, departmentId }) {
  const dept = toDepartment(department);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
        DEPARTMENT_STYLES[dept]
      }`}
    >
      {DEPARTMENT_LABELS[dept]}
      {departmentId ? <span className="font-mono">· {departmentId}</span> : null}
    </span>
  );
}
