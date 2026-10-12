import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'c:/Users/saura/OneDrive/Desktop/company/GreenGroo/backend/.env' });
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Product = mongoose.model('Product', new mongoose.Schema({}, { collection: 'GreenGroccproducts', strict: false }));
  
  const katrajId = new mongoose.Types.ObjectId('6ac8ec16642ffa05a79fbe52');
  const products = await Product.find({ ownerManagerId: katrajId }).lean();
  console.log('Katraj-owned products:', products.length, products.map(p => p.name));
  
  const adminProducts = await Product.find({ ownerManagerId: null }).limit(5).lean();
  console.log('Some Admin products:', adminProducts.length, adminProducts.map(p => p.sku));
  
  const allProducts = await Product.countDocuments();
  console.log('Total products:', allProducts);
  
  const prTom = await Product.findOne({ sku: 'PR-TOM-9FBE52' });
  console.log('Tomato product:', prTom?.sku, prTom?.ownerManagerId);
  process.exit(0);
});
