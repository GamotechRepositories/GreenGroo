import mongoose from "mongoose";

const uri = "mongodb+srv://greengrocc14_db_user:ZGgeauiLkTcmYCP1@cluster0.fwwh9al.mongodb.net/test?retryWrites=true&w=majority";

async function run() {
  await mongoose.connect(uri);
  const col = mongoose.connection.collection("farmerdocuments");
  await col.deleteMany({});
  console.log("Deleted all old farmer documents from MongoDB");
  process.exit(0);
}

run().catch(console.error);
