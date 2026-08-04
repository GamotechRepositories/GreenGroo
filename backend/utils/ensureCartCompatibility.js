import Cart from "../models/Cart.js";

export async function ensureCartCompatibility() {
  const result = await Cart.updateMany(
    { $or: [{ email: null }, { email: { $exists: false } }] },
    { $set: { email: "" } }
  );

  if (result.modifiedCount > 0) {
    console.log(`Fixed ${result.modifiedCount} cart(s) missing email field`);
  }

  await Cart.syncIndexes();
}
