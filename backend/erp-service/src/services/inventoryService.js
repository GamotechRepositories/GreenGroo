import mongoose from "mongoose";
import { generateId } from "./idGenerator.js";
import { recordAudit, recordErpTransaction } from "./auditService.js";
import { Inventory, Batch, GoodsReceipt, Article } from "../models/index.js";
import { pushStatus } from "../models/plugins.js";

function inventoryLocationToken(locationType, locationId) {
  const type = String(locationType || "LOC").replace(/_/g, "").slice(0, 3).toUpperCase();
  const loc = String(locationId || "X").replace(/[^A-Za-z0-9]/g, "").slice(-4).toUpperCase();
  return `${type}${loc || "0001"}`.slice(0, 8);
}

function articleToken(article = {}) {
  return String(article.cropCode || article.articleId || "ART")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 6)
    .toUpperCase();
}

export async function getOrCreateInventory({ articleId, batchId = "", locationType, locationId }, session) {
  const existing = await Inventory.findOne({
    articleId,
    batchId: batchId || "",
    locationType,
    locationId,
    isDeleted: { $ne: true },
  }).session(session || null);
  if (existing) return existing;

  const article = await Article.findOne({ articleId }).session(session || null).lean();
  const inventoryId = await generateId(
    {
      module: "INV",
      location: inventoryLocationToken(locationType, locationId),
      article: articleToken(article || { articleId }),
    },
    session
  );
  const docs = await Inventory.create(
    [
      {
        inventoryId,
        articleId,
        batchId: batchId || "",
        locationType,
        locationId,
        status: "ACTIVE",
      },
    ],
    session ? { session } : undefined
  );
  return Array.isArray(docs) ? docs[0] : docs;
}

export async function applyStockMovement({
  articleId,
  batchId = "",
  locationType,
  locationId,
  inward = 0,
  outward = 0,
  damaged = 0,
  expired = 0,
  unitValue = 0,
  actor = {},
  session,
}) {
  const inv = await getOrCreateInventory({ articleId, batchId, locationType, locationId }, session);
  inv.inwardStock += Number(inward) || 0;
  inv.outwardStock += Number(outward) || 0;
  inv.damagedStock += Number(damaged) || 0;
  inv.expiredStock += Number(expired) || 0;
  inv.availableStock = inv.openingStock + inv.inwardStock - inv.outwardStock - inv.damagedStock - inv.expiredStock;
  inv.closingStock = inv.availableStock;
  inv.totalValue = inv.availableStock * (Number(unitValue) || 0);
  inv.lowStockAlert = inv.availableStock <= 10;
  pushStatus(inv, inv.status, actor.userId || "", `in:${inward} out:${outward}`);
  await inv.save(session ? { session } : undefined);

  if (articleId) {
    const article = await Article.findOne({ articleId }).session(session || null);
    if (article) {
      article.availableStock = Math.max(0, (article.availableStock || 0) + (Number(inward) || 0) - (Number(outward) || 0) - (Number(damaged) || 0));
      await article.save(session ? { session } : undefined);
    }
  }

  await recordAudit(
    {
      erpModule: "INV",
      recordId: inv.inventoryId,
      action: "INVENTORY_ADJUSTMENT",
      ...actor,
      newValue: { inward, outward, availableStock: inv.availableStock },
    },
    session
  );
  return inv;
}

/**
 * Atomic GRN receive: GRN + inventory + batch + audit.
 * If any step fails, the transaction aborts.
 */
export async function receiveGoodsAtomic({
  grnId,
  purchaseOrderId,
  vendorId,
  farmerId,
  articleId,
  batchId,
  receivedQuantity,
  acceptedQuantity,
  rejectedQuantity,
  locationType,
  locationId,
  qualityStatus = "PENDING",
  unitValue = 0,
  actor = {},
}) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const grn = await GoodsReceipt.findOne({ grnId }).session(session);
    if (!grn) throw new Error("GRN not found");

    grn.purchaseOrderId = purchaseOrderId || grn.purchaseOrderId;
    grn.vendorId = vendorId || grn.vendorId;
    grn.farmerId = farmerId || grn.farmerId;
    grn.articleId = articleId || grn.articleId;
    grn.batchId = batchId || grn.batchId;
    grn.receivedQuantity = receivedQuantity;
    grn.acceptedQuantity = acceptedQuantity;
    grn.rejectedQuantity = rejectedQuantity;
    grn.qualityStatus = qualityStatus;
    grn.locationType = locationType;
    grn.locationId = locationId;
    grn.stockUpdated = true;
    grn.receivedAt = new Date();
    pushStatus(grn, "RECEIVED", actor.userId || "");
    await grn.save({ session });

    if (batchId) {
      const batch = await Batch.findOne({ batchId }).session(session);
      if (batch) {
        batch.quantity = acceptedQuantity;
        batch.currentLocationType = locationType;
        batch.currentLocationId = locationId;
        pushStatus(batch, "RECEIVED", actor.userId || "");
        await batch.save({ session });
      }
    }

    await applyStockMovement({
      articleId,
      batchId,
      locationType,
      locationId,
      inward: acceptedQuantity,
      damaged: rejectedQuantity,
      unitValue,
      actor,
      session,
    });

    await recordAudit(
      {
        erpModule: "GRN",
        recordId: grnId,
        action: "CREATE",
        ...actor,
        newValue: { acceptedQuantity, rejectedQuantity },
      },
      session
    );
    await recordErpTransaction(
      {
        module: "GRN",
        transactionType: "GOODS_RECEIPT",
        recordId: grnId,
        userId: actor.userId,
        linkedDocuments: [purchaseOrderId, batchId, articleId].filter(Boolean),
      },
      session
    );

    await session.commitTransaction();
    return grn;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
