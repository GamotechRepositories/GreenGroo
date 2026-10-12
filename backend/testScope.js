import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'c:/Users/saura/OneDrive/Desktop/company/GreenGroo/backend/.env' });
import { storeProductScope } from './delivery-service/src/services/nearestStoreCatalog.js';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const DeliveryManager = mongoose.models.DeliveryManager || mongoose.model('DeliveryManager', new mongoose.Schema({ area: String }));
  const StoreInventory = mongoose.models.StoreInventory || mongoose.model('StoreInventory', new mongoose.Schema({ managerId: mongoose.Schema.Types.ObjectId, stockCount: Number, sku: String, name: String }));
  const Product = mongoose.models.GreenGroccProduct || mongoose.model('GreenGroccProduct', new mongoose.Schema({}, { collection: 'GreenGroccproducts', strict: false }));
  
  const katraj = await DeliveryManager.findOne({ area: /katraj/i });
  const inStockItems = await StoreInventory.find({ managerId: katraj._id, stockCount: { $gt: 0 } }).lean();
  
  const catalog = { manager: katraj, inStockItems };
  const scope = storeProductScope(catalog);
  console.log(JSON.stringify(scope, null, 2));
  
  const products = await Product.find(scope).lean();
  console.log('Matches:', products.length, products.map(p => p.sku));
  
  process.exit(0);
});
