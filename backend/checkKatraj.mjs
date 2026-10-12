import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'c:/Users/saura/OneDrive/Desktop/company/GreenGroo/backend/.env' });
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const DeliveryManager = mongoose.model('DeliveryManager', new mongoose.Schema({ area: String }));
  const StoreInventory = mongoose.model('StoreInventory', new mongoose.Schema({ managerId: mongoose.Schema.Types.ObjectId, stockCount: Number, sku: String, name: String }));
  
  const katraj = await DeliveryManager.findOne({ area: /katraj/i });
  console.log('Katraj Store:', katraj?._id);
  
  if (katraj) {
    const inventory = await StoreInventory.find({ managerId: katraj._id, stockCount: { $gt: 0 } }).lean();
    console.log('In-stock items:', inventory.length, inventory);
  }
  process.exit(0);
});
