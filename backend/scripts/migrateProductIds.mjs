import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import mongoose from 'mongoose';
import {
  cropCodeFromName,
  varietyCodeFromName,
  resolveCategoryCode,
} from '../erp-service/src/config/idRegistry.js';

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const productCol = db.collection('GreenGroccproducts');
  const storeInvCol = db.collection('storeinventories');
  const farmerProductCol = db.collection('farmerproducts');
  const vendorProductCol = db.collection('vendorproducts');
  const vendorReqCol = db.collection('vendorproductrequests');
  const stockHistoryCol = db.collection('farmerstockhistories');

  // 1. Migrate Admin Products in GreenGroccproducts
  console.log('\n--- 1. Migrating GreenGroccproducts ---');
  const products = await productCol.find({}).sort({ createdAt: 1, _id: 1 }).toArray();
  console.log(`Found ${products.length} catalog products to process`);

  const prefixCounters = {};
  const skuMap = new Map(); // oldIdentifier -> newId

  let totalUpdated = 0;
  let totalWithNan = 0;

  for (const p of products) {
    const catCode = resolveCategoryCode(p.categories?.[0] || p.category || p.name);
    const cropCode = cropCodeFromName(p.name);
    
    const vName = (p.varietyName || '').trim();
    let varCode = 'NAN';
    if (vName && vName.toUpperCase() !== 'NAN' && vName.toLowerCase() !== 'none') {
      varCode = varietyCodeFromName(vName);
    }
    if (!varCode) varCode = 'NAN';

    if (varCode === 'NAN') {
      totalWithNan++;
    }

    const prefix = `GGC-ART-${catCode}-${cropCode}-${varCode}-`;
    prefixCounters[prefix] = (prefixCounters[prefix] || 0) + 1;
    const serial = prefixCounters[prefix];
    const newId = `${prefix}${serial}`;

    const oldSku = p.sku;
    const oldPid = p.productId;

    if (oldSku && oldSku !== newId) {
      skuMap.set(oldSku, newId);
    }
    if (oldPid && oldPid !== newId) {
      skuMap.set(oldPid, newId);
    }

    if (p.productId !== newId || p.sku !== newId) {
      await productCol.updateOne(
        { _id: p._id },
        { $set: { productId: newId, sku: newId } }
      );
      totalUpdated++;
      console.log(`[UPDATED] "${p.name}" (var: "${p.varietyName || ''}"): ${oldPid || oldSku} -> ${newId}`);
    } else {
      console.log(`[UNCHANGED] "${p.name}": ${newId}`);
    }
  }

  console.log(`\nCatalog Summary: ${totalUpdated} products updated, ${totalWithNan} have NAN variety code.`);

  // 2. Update StoreInventory matching old SKUs
  console.log('\n--- 2. Updating StoreInventories ---');
  let storeInvUpdated = 0;
  for (const [oldSku, newSku] of skuMap.entries()) {
    const oldRows = await storeInvCol.find({ sku: oldSku }).toArray();
    for (const row of oldRows) {
      const conflict = await storeInvCol.findOne({
        managerId: row.managerId,
        sku: newSku,
        _id: { $ne: row._id },
      });
      if (conflict) {
        await storeInvCol.deleteOne({ _id: conflict._id });
      }
      await storeInvCol.updateOne({ _id: row._id }, { $set: { sku: newSku } });
      storeInvUpdated++;
    }
  }
  console.log(`Total StoreInventory updated: ${storeInvUpdated}`);

  // 3. Migrate Farmer Products
  console.log('\n--- 3. Migrating Farmer Products ---');
  const farmerProducts = await farmerProductCol.find({}).toArray();
  for (const fp of farmerProducts) {
    const oldPid = String(fp.productId || fp.id || '');
    let newFpId = oldPid;

    const vName = (fp.variety || '').trim();
    let varCode = 'NAN';
    if (vName && vName.toUpperCase() !== 'NAN' && vName.toLowerCase() !== 'none') {
      varCode = varietyCodeFromName(vName);
    }
    if (!varCode) varCode = 'NAN';

    // If padded like GGC-ART-VEG-ONI-HYB-00002 -> GGC-ART-VEG-ONI-HYB-2
    const paddedMatch = /^GGC-ART-([A-Z0-9]+)-([A-Z0-9]+)-([A-Z0-9]+)-0*(\d+)$/i.exec(oldPid);
    if (paddedMatch) {
      const cat = paddedMatch[1].toUpperCase();
      const crop = paddedMatch[2].toUpperCase();
      const finalVar = varCode !== 'NAN' ? varCode : paddedMatch[3].toUpperCase();
      const serialNum = parseInt(paddedMatch[4], 10);
      newFpId = `GGC-ART-${cat}-${crop}-${finalVar}-${serialNum}`;
    } else if (!/^GGC-ART-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-\d+$/i.test(oldPid)) {
      const catCode = resolveCategoryCode(fp.category || fp.name);
      const cropCode = cropCodeFromName(fp.name || fp.cropName);
      newFpId = `GGC-ART-${catCode}-${cropCode}-${varCode}-1`;
    }

    if (newFpId !== oldPid || !fp.productId) {
      await farmerProductCol.updateOne(
        { _id: fp._id },
        { $set: { id: newFpId, productId: newFpId, previousProductId: oldPid } }
      );
      console.log(`Updated FarmerProduct: ${oldPid} -> ${newFpId}`);

      // Update references
      if (oldPid) {
        await vendorProductCol.updateMany(
          { productId: oldPid },
          { $set: { productId: newFpId } }
        );
        await vendorReqCol.updateMany(
          { productId: oldPid },
          { $set: { productId: newFpId } }
        );
        await stockHistoryCol.updateMany(
          { productId: oldPid },
          { $set: { productId: newFpId } }
        );
      }
    }
  }

  // 4. Update vendorproducts and requests with skuMap if any match
  for (const [oldId, newId] of skuMap.entries()) {
    await vendorProductCol.updateMany({ productId: oldId }, { $set: { productId: newId } });
    await vendorReqCol.updateMany({ productId: oldId }, { $set: { productId: newId } });
  }

  console.log('\n✅ All old products successfully migrated to canonical Product IDs with NAN & sequential counts!');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
