export const STATEMENT_GRADES = ["Grade A", "Grade B", "Grade C"];

const ASSIGNED_KEYS = {
  "Grade A": "gradeAAssigned",
  "Grade B": "gradeBAssigned",
  "Grade C": "gradeCAssigned",
};

const REJECT_KEYS = {
  "Grade A": "gradeARejected",
  "Grade B": "gradeBRejected",
  "Grade C": "gradeCRejected",
};

export function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function roundQty(n) {
  return Math.max(0, Math.round(num(n) * 1000) / 1000);
}

function labelOf(g) {
  return String(g?.label || g?.name || g?.grade || "").trim();
}

function findGrade(rows, label) {
  return (Array.isArray(rows) ? rows : []).find((g) => labelOf(g) === label) || null;
}

export function gradeStatementRows(order = {}) {
  const unit = order.unit || "Kg";
  const gq = order.gradeQuality && typeof order.gradeQuality === "object" ? order.gradeQuality : {};
  const finalRows =
    Array.isArray(order.finalStatement) && order.finalStatement.length
      ? order.finalStatement
      : Array.isArray(order.grades)
        ? order.grades
        : [];
  const orderedRows = Array.isArray(order.orderedGrades) && order.orderedGrades.length ? order.orderedGrades : [];
  const extras = [...finalRows, ...orderedRows]
    .map(labelOf)
    .filter((label) => label && !STATEMENT_GRADES.includes(label));
  const labels = [...STATEMENT_GRADES, ...Array.from(new Set(extras)).sort()];

  return labels.map((label) => {
    const g = findGrade(finalRows, label) || {};
    const og = findGrade(orderedRows, label) || {};
    const rejected = roundQty(
      Math.max(
        num(g.rejectedQuantity),
        num(gq[label]?.rejectedQuantity),
        num(order[REJECT_KEYS[label]])
      )
    );
    const ordered = roundQty(g.orderedQuantity ?? og.orderedQuantity ?? og.quantity ?? og.qty);
    const assigned = roundQty(g.assignedQuantity ?? order[ASSIGNED_KEYS[label]]);
    const rate = num(g.price ?? g.rate ?? og.price ?? og.rate ?? (ordered > 0 || assigned > 0 ? order.price : 0));
    const base = ordered > 0 ? ordered : assigned;
    const finalQty = roundQty(Math.max(0, base - rejected));
    const amount = roundQty(finalQty * rate);
    return {
      label,
      ordered,
      assigned,
      rejected,
      finalQty,
      qty: finalQty,
      rate,
      amount,
      unit,
    };
  });
}

export function gradeStatementMap(order) {
  return Object.fromEntries(gradeStatementRows(order).map((row) => [row.label, row]));
}

export function gradeStatementTotals(rows) {
  return (Array.isArray(rows) ? rows : []).reduce(
    (acc, row) => ({
      ordered: acc.ordered + num(row.ordered),
      rejected: acc.rejected + num(row.rejected),
      finalQty: acc.finalQty + num(row.finalQty ?? row.qty),
      amount: acc.amount + num(row.amount),
    }),
    { ordered: 0, rejected: 0, finalQty: 0, amount: 0 }
  );
}
