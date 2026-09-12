import {
  Farmer,
  FarmerProduct,
  FarmerStockHistory,
  Vendor,
} from "../../farmer-manager-service/src/models.js";

const ok = (res, data, extra = {}) => res.json({ success: true, data, ...extra });
const fail = (res, status, message) => res.status(status).json({ success: false, message });

function productStock(product) {
  if (Array.isArray(product.grades) && product.grades.length) {
    return product.grades.reduce((sum, grade) => sum + Number(grade.quantity || 0), 0);
  }
  return Number(product.stock || product.availableQuantity || 0);
}

function flattenInventory(products) {
  const rows = [];
  products.forEach((product) => {
    const grades =
      Array.isArray(product.grades) && product.grades.length
        ? product.grades
        : [{ id: "g-a", label: "Grade A", quantity: product.stock || 0 }];
    grades.forEach((grade) => {
      const qty = Number(grade.quantity || 0);
      const lowLimit = Number(product.lowStockLimit || 20);
      rows.push({
        id: `inv-${product.id}-${grade.id}`,
        productId: product.id,
        productName: product.name,
        category: product.category || "General",
        gradeId: grade.id,
        grade: grade.label || grade.id,
        unit: product.unit || "Kg",
        currentStock: qty,
        lowStockLimit: lowLimit,
        status: qty <= 0 ? "Out of Stock" : qty < lowLimit ? "Low Stock" : "In Stock",
        farmerId: product.farmerId,
        vendorId: product.vendorId,
        price: Number(product.price || product.sellingPrice || 0),
        lastUpdated: product.updatedAt,
      });
    });
  });
  return rows;
}

function summarizeRows(rows) {
  return {
    skuCount: rows.length,
    inStockSkus: rows.filter((row) => row.currentStock > 0).length,
    lowStockSkus: rows.filter((row) => row.status === "Low Stock").length,
    outOfStockSkus: rows.filter((row) => row.currentStock <= 0).length,
    totalUnits: rows.reduce((sum, row) => sum + Number(row.currentStock || 0), 0),
  };
}

async function adjustProductStock({
  product,
  gradeId,
  grade,
  change,
  setTo,
  updatedBy = "Admin",
  reason = "Admin inventory update",
}) {
  let grades =
    product.grades && product.grades.length
      ? [...product.grades]
      : [
          { id: "g-a", label: "Grade A", quantity: product.gradeAQty || product.stock || 0 },
          { id: "g-b", label: "Grade B", quantity: product.gradeBQty || 0 },
        ];

  let gIdx = grades.findIndex(
    (g) => g.id === gradeId || g.label === gradeId || g.label === grade
  );
  if (gIdx < 0) {
    grades.push({ id: `g-${Date.now()}`, label: grade || "Grade A", quantity: 0 });
    gIdx = grades.length - 1;
  }

  const prevStock = Number(grades[gIdx].quantity) || 0;
  let nextStock = prevStock;
  if (setTo != null && setTo !== "") {
    nextStock = Math.max(0, Math.floor(Number(setTo)));
  } else {
    const delta = Number(change) || 0;
    if (!delta) throw Object.assign(new Error("Enter a valid stock change"), { status: 400 });
    nextStock = Math.max(0, prevStock + Math.trunc(delta));
  }

  const appliedChange = nextStock - prevStock;
  grades[gIdx].quantity = nextStock;
  product.grades = grades;

  const totalStock = grades.reduce((sum, g) => sum + Number(g.quantity || 0), 0);
  product.stock = totalStock;
  product.availableQuantity = totalStock;
  product.gradeAQty = Number(grades[0]?.quantity) || 0;
  product.gradeBQty = Number(grades[1]?.quantity) || 0;
  if (totalStock <= 0) product.status = "Out of Stock";
  else if (product.status === "Out of Stock") product.status = "Available";

  await product.save();

  const historyEntry = await FarmerStockHistory.create({
    id: `sh-${Date.now()}`,
    vendorId: product.vendorId,
    managerId: product.managerId,
    farmerId: product.farmerId,
    productId: product.id,
    productName: product.name,
    grade: grades[gIdx].label,
    action: appliedChange >= 0 ? "Stock Added" : "Stock Reduced",
    previousStock: prevStock,
    changedQuantity: appliedChange,
    newStock: nextStock,
    reason,
    updatedBy,
    reference: "admin-inventory-hub",
    at: new Date(),
  });

  return { product, history: historyEntry, previousStock: prevStock, newStock: nextStock };
}

export async function listInventoryFarmers(req, res, next) {
  try {
    const search = String(req.query.search || req.query.q || "").trim().toLowerCase();
    const farmers = await Farmer.find().select("-password").sort({ createdAt: -1 }).lean();
    const products = await FarmerProduct.find().select("farmerId stock availableQuantity grades lowStockLimit status").lean();

    const byFarmer = new Map();
    products.forEach((product) => {
      const key = String(product.farmerId || "");
      if (!key) return;
      if (!byFarmer.has(key)) {
        byFarmer.set(key, { skuCount: 0, totalUnits: 0, lowStockSkus: 0, outOfStockSkus: 0 });
      }
      const bucket = byFarmer.get(key);
      const rows = flattenInventory([product]);
      bucket.skuCount += rows.length;
      rows.forEach((row) => {
        bucket.totalUnits += row.currentStock;
        if (row.status === "Low Stock") bucket.lowStockSkus += 1;
        if (row.currentStock <= 0) bucket.outOfStockSkus += 1;
      });
    });

    let data = farmers.map((farmer) => {
      const stock = byFarmer.get(String(farmer.id)) || {
        skuCount: 0,
        totalUnits: 0,
        lowStockSkus: 0,
        outOfStockSkus: 0,
      };
      return {
        id: farmer.id,
        name: farmer.name || farmer.fullName || "Farmer",
        mobile: farmer.mobile || "",
        email: farmer.email || "",
        status: farmer.status || "Active",
        location: [farmer.village, farmer.taluka, farmer.district, farmer.city]
          .filter(Boolean)
          .join(", "),
        vendorId: farmer.vendorId || "",
        vendorName: farmer.vendorName || "",
        ...stock,
      };
    });

    if (search) {
      data = data.filter((row) =>
        [row.name, row.mobile, row.location, row.vendorName, row.id]
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    }

    return ok(res, data, {
      stats: {
        count: data.length,
        withStock: data.filter((row) => row.totalUnits > 0).length,
        lowStock: data.filter((row) => row.lowStockSkus > 0).length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getInventoryFarmer(req, res, next) {
  try {
    const farmerId = String(req.params.farmerId || "").trim();
    const farmer = await Farmer.findOne({ id: farmerId }).select("-password").lean();
    if (!farmer) return fail(res, 404, "Farmer not found");

    const products = await FarmerProduct.find({ farmerId }).sort({ name: 1 }).lean();
    const rows = flattenInventory(products);
    return ok(res, rows, {
      entity: {
        type: "farmer",
        id: farmer.id,
        name: farmer.name || farmer.fullName || "Farmer",
        mobile: farmer.mobile || "",
        location: [farmer.village, farmer.taluka, farmer.district].filter(Boolean).join(", "),
        status: farmer.status || "Active",
        vendorId: farmer.vendorId || "",
      },
      stats: summarizeRows(rows),
    });
  } catch (error) {
    next(error);
  }
}

export async function adjustInventoryFarmer(req, res, next) {
  try {
    const farmerId = String(req.params.farmerId || "").trim();
    const { productId, gradeId, grade, change, stockCount, reason } = req.body || {};
    if (!productId) return fail(res, 400, "productId is required");

    const product = await FarmerProduct.findOne({ id: productId, farmerId });
    if (!product) return fail(res, 404, "Product not found for this farmer");

    const result = await adjustProductStock({
      product,
      gradeId,
      grade,
      change,
      setTo: stockCount,
      updatedBy: req.user?.name || req.user?.email || "Admin",
      reason: reason || "Admin inventory update",
    });

    return ok(res, {
      productId: result.product.id,
      previousStock: result.previousStock,
      newStock: result.newStock,
      historyId: result.history.id,
    }, { message: "Farmer inventory updated" });
  } catch (error) {
    if (error.status) return fail(res, error.status, error.message);
    next(error);
  }
}

export async function listInventoryVendors(req, res, next) {
  try {
    const search = String(req.query.search || req.query.q || "").trim().toLowerCase();
    const vendors = await Vendor.find().select("-password").sort({ createdAt: -1 }).lean();
    const products = await FarmerProduct.find().select("vendorId stock availableQuantity grades lowStockLimit").lean();

    const byVendor = new Map();
    products.forEach((product) => {
      const key = String(product.vendorId || "");
      if (!key) return;
      if (!byVendor.has(key)) {
        byVendor.set(key, { skuCount: 0, totalUnits: 0, lowStockSkus: 0, outOfStockSkus: 0, farmerIds: new Set() });
      }
      const bucket = byVendor.get(key);
      const rows = flattenInventory([product]);
      bucket.skuCount += rows.length;
      if (product.farmerId) bucket.farmerIds.add(String(product.farmerId));
      rows.forEach((row) => {
        bucket.totalUnits += row.currentStock;
        if (row.status === "Low Stock") bucket.lowStockSkus += 1;
        if (row.currentStock <= 0) bucket.outOfStockSkus += 1;
      });
    });

    let data = vendors.map((vendor) => {
      const stock = byVendor.get(String(vendor.id)) || {
        skuCount: 0,
        totalUnits: 0,
        lowStockSkus: 0,
        outOfStockSkus: 0,
        farmerIds: new Set(),
      };
      return {
        id: vendor.id,
        name: vendor.vendorName || vendor.ownerName || vendor.businessName || "Vendor",
        ownerName: vendor.ownerName || "",
        mobile: vendor.mobile || "",
        email: vendor.email || "",
        status: vendor.status || "Active",
        city: vendor.city || "",
        state: vendor.state || "",
        location: [vendor.city, vendor.state].filter(Boolean).join(", "),
        farmerCount: stock.farmerIds?.size || 0,
        skuCount: stock.skuCount || 0,
        totalUnits: stock.totalUnits || 0,
        lowStockSkus: stock.lowStockSkus || 0,
        outOfStockSkus: stock.outOfStockSkus || 0,
      };
    });

    if (search) {
      data = data.filter((row) =>
        [row.name, row.ownerName, row.mobile, row.location, row.id]
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    }

    return ok(res, data, {
      stats: {
        count: data.length,
        withStock: data.filter((row) => row.totalUnits > 0).length,
        lowStock: data.filter((row) => row.lowStockSkus > 0).length,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getInventoryVendor(req, res, next) {
  try {
    const vendorId = String(req.params.vendorId || "").trim();
    const vendor = await Vendor.findOne({ id: vendorId }).select("-password").lean();
    if (!vendor) return fail(res, 404, "Vendor not found");

    const products = await FarmerProduct.find({ vendorId }).sort({ name: 1 }).lean();
    const farmers = await Farmer.find({ vendorId }).select("id name").lean();
    const farmerMap = new Map(farmers.map((f) => [String(f.id), f.name]));
    const rows = flattenInventory(products).map((row) => ({
      ...row,
      farmerName: farmerMap.get(String(row.farmerId)) || row.farmerId || "—",
    }));

    return ok(res, rows, {
      entity: {
        type: "vendor",
        id: vendor.id,
        name: vendor.vendorName || vendor.ownerName || "Vendor",
        mobile: vendor.mobile || "",
        location: [vendor.city, vendor.state].filter(Boolean).join(", "),
        status: vendor.status || "Active",
        farmerCount: farmers.length,
      },
      stats: summarizeRows(rows),
    });
  } catch (error) {
    next(error);
  }
}

export async function adjustInventoryVendor(req, res, next) {
  try {
    const vendorId = String(req.params.vendorId || "").trim();
    const { productId, farmerId, gradeId, grade, change, stockCount, reason } = req.body || {};
    if (!productId) return fail(res, 400, "productId is required");

    const query = { id: productId, vendorId };
    if (farmerId) query.farmerId = farmerId;
    const product = await FarmerProduct.findOne(query);
    if (!product) return fail(res, 404, "Product not found for this vendor");

    const result = await adjustProductStock({
      product,
      gradeId,
      grade,
      change,
      setTo: stockCount,
      updatedBy: req.user?.name || req.user?.email || "Admin",
      reason: reason || "Admin inventory update",
    });

    return ok(res, {
      productId: result.product.id,
      farmerId: result.product.farmerId,
      previousStock: result.previousStock,
      newStock: result.newStock,
      historyId: result.history.id,
    }, { message: "Vendor inventory updated" });
  } catch (error) {
    if (error.status) return fail(res, error.status, error.message);
    next(error);
  }
}
