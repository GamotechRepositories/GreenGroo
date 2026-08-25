import StoreInventory from "../models/StoreInventory.js";

export async function getStockMap(managerId) {
  const rows = await StoreInventory.find({ managerId, isActive: true });
  return new Map(rows.map((r) => [r.sku, r]));
}

export function findOrderShortages(order, stockMap) {
  const shortages = [];
  for (const item of order.items || []) {
    if (item.customerInformed) continue;
    const stock = stockMap.get(item.sku);
    const available = stock ? stock.stockCount : 0;
    if (available < item.quantity) {
      shortages.push({
        sku: item.sku,
        name: item.name,
        needed: item.quantity,
        available,
      });
    }
  }
  return shortages;
}

/**
 * Deduct this dark store's inventory for fulfilable order items.
 * Safe to call more than once — no-ops if stock was already taken.
 */
export async function deductOrderStock(managerId, order) {
  if (order.stockDeductedAt) {
    return { deducted: false, alreadyDeducted: true, shortages: [] };
  }

  const fulfilable = (order.items || []).filter((item) => !item.customerInformed);
  if (fulfilable.length === 0) {
    return {
      deducted: false,
      alreadyDeducted: false,
      shortages: [],
      empty: true,
    };
  }

  const stockMap = await getStockMap(managerId);
  const shortages = findOrderShortages(order, stockMap);
  if (shortages.length) {
    return { deducted: false, alreadyDeducted: false, shortages };
  }

  const deducted = [];
  for (const item of fulfilable) {
    const updated = await StoreInventory.findOneAndUpdate(
      {
        managerId,
        sku: item.sku,
        stockCount: { $gte: item.quantity },
      },
      { $inc: { stockCount: -item.quantity } },
      { new: true }
    );
    if (!updated) {
      for (const done of deducted) {
        await StoreInventory.findOneAndUpdate(
          { managerId, sku: done.sku },
          { $inc: { stockCount: done.quantity } }
        );
      }
      const latest = await StoreInventory.findOne({ managerId, sku: item.sku });
      return {
        deducted: false,
        alreadyDeducted: false,
        shortages: [
          {
            sku: item.sku,
            name: item.name,
            needed: item.quantity,
            available: latest?.stockCount || 0,
          },
        ],
      };
    }
    deducted.push(item);
  }

  order.stockDeductedAt = new Date();
  await order.save();
  return { deducted: true, alreadyDeducted: false, shortages: [] };
}
