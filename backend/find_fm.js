import connectDB from './legacy/config/dbconfig.js';
import DeliveryManager from './delivery-service/src/models/DeliveryManager.js';
import bcrypt from 'bcrypt';

await connectDB();
const mgr = await DeliveryManager.findOne({ email: 'swala@gmail.com' }).select('+password').lean();

if (mgr) {
  const hash = await bcrypt.hash('password123', 10);
  await DeliveryManager.findByIdAndUpdate(mgr._id, { password: hash });
  console.log('Password updated for swala@gmail.com to: password123');
} else {
  console.log('No Delivery Managers found.');
}
process.exit(0);
