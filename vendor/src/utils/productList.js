export function isPendingProduct(status) {
  const s = String(status || "").toLowerCase().replace(/_/g, " ");
  return s === "pending approval" || s === "pending";
}

export function isBusinessProductId(value) {
  const id = String(value || "").trim();
  return Boolean(id) && !/^[a-f0-9]{24}$/i.test(id);
}

export function productNameOf(item = {}) {
  return item.productName || item.name || "Farm Produce";
}

export function productImageOf(item = {}) {
  return item.image || item.media?.mainPhoto || "";
}

export function productGroupKey(item = {}) {
  const id = String(item.productId || item.id || "").trim();
  if (isBusinessProductId(id)) return id.toUpperCase();
  return `${productNameOf(item).trim().toLowerCase()}|${String(item.variety || "").trim().toLowerCase()}`;
}

export function normalizeGradeLabel(raw) {
  const str = String(raw || "").trim();
  if (!str) return "";
  if (/^(grade[\s_-]?a|a)$/i.test(str)) return "Grade A";
  if (/^(grade[\s_-]?b|b)$/i.test(str)) return "Grade B";
  if (/^(grade[\s_-]?c|c)$/i.test(str)) return "Grade C";
  if (/^(grade[\s_-]?d|d)$/i.test(str)) return "Grade D";
  return str;
}

export function extractProductGradeAndStock(p = {}) {
  const gradeMap = new Map();
  const rateMap = new Map();

  const add = (rawLabel, qty, rate = 0) => {
    const label = normalizeGradeLabel(rawLabel);
    if (!label) return;
    const n = Number(qty || 0);
    const r = Number(rate || 0);
    if (n > 0) {
      gradeMap.set(label, (gradeMap.get(label) || 0) + n);
    }
    if (r > 0 && !rateMap.has(label)) {
      rateMap.set(label, r);
    }
  };

  // 1. Parse grades array
  if (Array.isArray(p.grades)) {
    p.grades.forEach((g) => {
      if (!g) return;
      const label = g.label || g.name || g.grade || g.gradeName || "";
      const qty = g.quantity ?? g.qty ?? g.stock ?? g.availableQuantity ?? 0;
      const rate = g.price ?? g.rate ?? g.pricePerKg ?? p.pricePerKg ?? 0;
      add(label, qty, rate);
    });
  }

  // 2. Check direct grade fields on product
  const directA = Number(p.gradeAQty ?? p.grade_a_qty ?? p.gradeAQuantity ?? 0);
  const directB = Number(p.gradeBQty ?? p.grade_b_qty ?? p.gradeBQuantity ?? 0);
  const directC = Number(p.gradeCQty ?? p.grade_c_qty ?? p.gradeCQuantity ?? 0);
  const directD = Number(p.gradeDQty ?? p.grade_d_qty ?? p.gradeDQuantity ?? 0);

  if (directA > 0 && !gradeMap.has("Grade A")) add("Grade A", directA, p.gradeAPrice ?? p.pricePerKg);
  if (directB > 0 && !gradeMap.has("Grade B")) add("Grade B", directB, p.gradeBPrice);
  if (directC > 0 && !gradeMap.has("Grade C")) add("Grade C", directC, p.gradeCPrice);
  if (directD > 0 && !gradeMap.has("Grade D")) add("Grade D", directD, p.gradeDPrice);

  // 3. Fallback to general stock if grades are empty
  const directStock = Number(
    p.availableQuantity ?? p.stock ?? p.totalQuantity ?? p.quantity ?? p.stockQuantity ?? 0
  );

  const preferred = ["Grade A", "Grade B", "Grade C"];
  const sumKnownGrades = Array.from(gradeMap.values()).reduce((sum, v) => sum + v, 0);

  if (sumKnownGrades === 0 && directStock > 0) {
    const singleGrade = normalizeGradeLabel(p.grade || p.singleGrade || "");
    if (singleGrade) {
      add(singleGrade, directStock, p.pricePerKg || p.sellingPrice || 0);
    }
  }

  const finalSumGrades = Array.from(gradeMap.values()).reduce((sum, v) => sum + v, 0);
  const totalStock = finalSumGrades > 0 ? finalSumGrades : directStock;

  const orderedGrades = [
    ...preferred.map((label) => ({
      label,
      quantity: gradeMap.get(label) || 0,
      rate: rateMap.get(label) || 0,
    })),
    ...Array.from(gradeMap.entries())
      .filter(([label]) => !preferred.includes(label))
      .map(([label, quantity]) => ({
        label,
        quantity,
        rate: rateMap.get(label) || 0,
      })),
  ];

  return {
    gradeA: gradeMap.get("Grade A") || 0,
    gradeB: gradeMap.get("Grade B") || 0,
    gradeC: gradeMap.get("Grade C") || 0,
    grades: orderedGrades,
    gradeMap,
    totalStock,
  };
}

export function summarizeProductRows(rows = []) {
  let gradeA = 0;
  let gradeB = 0;
  let gradeC = 0;
  let totalStock = 0;
  const extraGradeMap = new Map();

  rows.forEach((p) => {
    const parsed = extractProductGradeAndStock(p);
    gradeA += parsed.gradeA;
    gradeB += parsed.gradeB;
    gradeC += parsed.gradeC;
    totalStock += parsed.totalStock;

    parsed.grades.forEach((g) => {
      if (!["Grade A", "Grade B", "Grade C"].includes(g.label) && g.quantity > 0) {
        extraGradeMap.set(g.label, (extraGradeMap.get(g.label) || 0) + g.quantity);
      }
    });
  });

  if (totalStock === 0) {
    totalStock = rows.reduce((s, p) => s + productQty(p), 0);
  }

  const orderedGrades = [
    { label: "Grade A", quantity: gradeA },
    { label: "Grade B", quantity: gradeB },
    { label: "Grade C", quantity: gradeC },
    ...Array.from(extraGradeMap.entries()).map(([label, quantity]) => ({ label, quantity })),
  ];

  return {
    gradeA,
    gradeB,
    gradeC,
    totalQty: totalStock,
    grades: orderedGrades,
  };
}

export function productQty(product) {
  if (product?.totalQty != null && Number(product.totalQty) > 0) return Number(product.totalQty);
  if (product?.totalStock != null && Number(product.totalStock) > 0) return Number(product.totalStock);
  const gradesSum = (product?.grades || []).reduce((s, g) => s + Number(g.quantity || 0), 0);
  const directStock = Number(product?.availableQuantity ?? product?.stock ?? product?.totalQuantity ?? 0);
  return gradesSum || directStock;
}

export function formatProductId(product = {}) {
  const raw = String(product.productId || product.id || "").trim();
  if (isBusinessProductId(raw)) return raw;
  return "";
}

export function productFarmersPath(product) {
  const key = productGroupKey(product);
  const params = new URLSearchParams({ name: productNameOf(product) });
  const productId =
    [product.productId, product.id].find((v) => isBusinessProductId(v)) || product.productId || product.id || "";
  if (productId) params.set("productId", productId);
  return `/vendor/products/${encodeURIComponent(key)}/farmers?${params.toString()}`;
}

export function statusPriority(status) {
  if (isPendingProduct(status)) return 0;
  if (status === "Rejected") return 1;
  if (status === "Draft" || status === "Paused") return 2;
  return 3;
}

export function groupByProduct(items) {
  const map = new Map();
  for (const p of items) {
    const key = productGroupKey(p);
    const qty = productQty(p);
    const existing = map.get(key);
    const image = productImageOf(p);
    if (!existing) {
      map.set(key, {
        ...p,
        image,
        groupKey: key,
        listings: [p],
        totalQty: qty,
      });
      continue;
    }
    existing.listings.push(p);
    existing.totalQty += qty;
    if (statusPriority(p.status) < statusPriority(existing.status)) {
      existing.status = p.status;
    }
    if (!existing.image && image) existing.image = image;
  }
  return Array.from(map.values());
}

export function matchesViewedProduct(product, { productId, productName, productKey }) {
  const idNeedle = String(productId || "").trim();
  const nameNeedle = String(productName || "").trim().toLowerCase();
  const keyNeedle = decodeURIComponent(String(productKey || "")).trim();
  const pid = String(product.productId || product.id || "").trim();
  const pname = productNameOf(product).trim().toLowerCase();
  const varietyKey = `${pname}|${String(product.variety || "").trim().toLowerCase()}`;

  if (idNeedle && isBusinessProductId(idNeedle)) {
    return pid.toUpperCase() === idNeedle.toUpperCase();
  }
  if (keyNeedle && isBusinessProductId(keyNeedle)) {
    return pid.toUpperCase() === keyNeedle.toUpperCase();
  }
  if (keyNeedle.includes("|") && varietyKey === keyNeedle.toLowerCase()) return true;
  if (nameNeedle && pname === nameNeedle) return true;
  if (keyNeedle && (pid.toLowerCase() === keyNeedle.toLowerCase() || pname === keyNeedle.toLowerCase())) return true;
  return false;
}

export function productStatusClass(status) {
  if (status === "Active" || status === "Approved") return "bg-green-100 text-green-700";
  if (isPendingProduct(status)) return "bg-yellow-100 text-yellow-700";
  if (status === "Rejected") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-600";
}
