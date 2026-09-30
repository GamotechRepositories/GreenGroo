const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb+srv://greengrocc14_db_user:ZGgeauiLkTcmYCP1@cluster0.fwwh9al.mongodb.net/test?retryWrites=true&w=majority');
  const db = mongoose.connection.db;
  
  const p1 = await db.collection('farmerproducts').findOne({ _id: new mongoose.Types.ObjectId('6a9a935780901a8b8660b1b4') });
  const p2 = await db.collection('farmerproducts').findOne({ _id: new mongoose.Types.ObjectId('6a9a98e480901a8b8660ba9e') });
  console.log('=== P1 (Nitin) ===\n', JSON.stringify(p1, null, 2));
  console.log('=== P2 (Sunil) ===\n', JSON.stringify(p2, null, 2));

  const fOrders = await db.collection('farmerorders').find({}).toArray();
  console.log('=== farmerorders count:', fOrders.length);
  fOrders.forEach(o => {
    if (o.farmerId === 'GGC-FR-MH-AHI-SAN-00001' || o.farmerId === 'GGC-FR-MH-AHI-SAN-00002') {
      console.log('Order:', JSON.stringify(o, null, 2));
    }
  });

  const fHarvestOrders = await db.collection('farmerharvestorders').find({}).toArray();
  console.log('=== farmerharvestorders count:', fHarvestOrders.length);
  fHarvestOrders.forEach(o => {
    console.log('HarvestOrder:', JSON.stringify(o, null, 2));
  });

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
