import User from "../models/user.js";

export async function ensureUserIndexes() {
  const indexes = await User.collection.indexes();
  const emailIndex = indexes.find((index) => index.key?.email === 1);

  if (emailIndex && !emailIndex.sparse) {
    await User.collection.dropIndex("email_1");
    await User.collection.createIndex({ email: 1 }, { unique: true, sparse: true });
    console.log("Fixed user email index: recreated as unique + sparse");
    return;
  }

  await User.syncIndexes();
}
