export function productActionSet(status) {
  switch (status) {
    case "Draft":
      return ["view", "edit", "delete", "publish"];
    case "Pending Approval":
      return ["view"];
    case "Active":
    case "Low Stock":
      return ["view", "edit", "stock", "price", "pause"];
    case "Out of Stock":
      return ["view", "stock", "pause"];
    case "Paused":
      return ["view", "edit", "activate"];
    default:
      return ["view"];
  }
}

export function canProductAction(status, action) {
  return productActionSet(status).includes(action);
}

export function formatProductPrice(value, unit = "Kg") {
  const amount = Number(value) || 0;
  return `₹${amount}/${unit === "Kg" ? "Kg" : unit}`;
}

export function primaryGradeLabel(product) {
  const grade = product?.grades?.find((g) => Number(g.quantity) > 0) || product?.grades?.[0];
  return grade?.label || (grade?.grade ? `Grade ${grade.grade}` : "—");
}
