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

const ORDERED_KEYS = {
  "Grade A": "gradeAQuantity",
  "Grade B": "gradeBQuantity",
  "Grade C": "gradeCQuantity",
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

  const result = labels.map((label) => {
    const g = findGrade(finalRows, label) || {};
    const og = findGrade(orderedRows, label) || {};
    const rejected = roundQty(
      Math.max(
        num(g.rejectedQuantity),
        num(gq[label]?.rejectedQuantity),
        num(order[REJECT_KEYS[label]])
      )
    );
    const assigned = roundQty(
      g.assignedQuantity ??
      og.assignedQuantity ??
      gq[label]?.assignedQuantity ??
      order[ASSIGNED_KEYS[label]] ??
      0
    );
    const rawOrdered = roundQty(
      g.orderedQuantity ??
      og.orderedQuantity ??
      og.quantity ??
      og.qty ??
      order[ORDERED_KEYS?.[label]] ??
      0
    );

    let finalQty = 0;
    if (g.quantity != null && Number.isFinite(Number(g.quantity)) && (assigned > 0 || num(g.quantity) > 0 || rawOrdered > 0)) {
      finalQty = roundQty(g.quantity);
    } else {
      const base = assigned > 0 ? assigned : rawOrdered;
      finalQty = roundQty(Math.max(0, base - rejected));
    }

    // Determine the pre-rejection Ordered / Received Quantity for this grade
    let gradeOrdered = 0;
    if (assigned > 0) {
      gradeOrdered = assigned;
    } else if (rawOrdered > 0 && rawOrdered >= finalQty + rejected) {
      gradeOrdered = rawOrdered;
    } else if (finalQty > 0 || rejected > 0) {
      gradeOrdered = roundQty(finalQty + rejected);
    }

    // Ensure Ordered - Rejected = Final Qty strictly holds
    if (gradeOrdered > 0) {
      if (assigned > 0) {
        finalQty = roundQty(Math.max(0, gradeOrdered - rejected));
      } else if (finalQty === 0 && rejected < gradeOrdered) {
        finalQty = roundQty(Math.max(0, gradeOrdered - rejected));
      } else if (gradeOrdered - rejected !== finalQty) {
        gradeOrdered = roundQty(finalQty + rejected);
      }
    }

    const defaultRate =
      label === "Grade A"
        ? num(order.gradeAPrice ?? order.price ?? 30)
        : label === "Grade B"
          ? num(order.gradeBPrice ?? (order.price ? Math.round(order.price * 0.4) : 12))
          : num(order.gradeCPrice ?? 0);
    const rate = num(g.price ?? g.rate ?? og.price ?? og.rate ?? (gradeOrdered > 0 || assigned > 0 ? defaultRate : 0));
    const amount = num(g.amount) > 0 ? roundQty(g.amount) : roundQty(finalQty * rate);

    return {
      label,
      ordered: gradeOrdered,
      assigned,
      rejected,
      finalQty,
      qty: finalQty,
      rate,
      amount,
      unit,
    };
  });

  const totalRejectedFromGrades = result.reduce((sum, r) => sum + r.rejected, 0);
  const unassignedRej = roundQty(Math.max(0, num(order.rejectedQuantity) - totalRejectedFromGrades));
  if (unassignedRej > 0) {
    result.push({
      label: "Rejected",
      ordered: unassignedRej,
      assigned: 0,
      rejected: unassignedRej,
      finalQty: 0,
      qty: 0,
      rate: 0,
      amount: 0,
      unit,
    });
  }

  return result;
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
