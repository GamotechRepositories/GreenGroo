import mongoose from "mongoose";

const connectDB = async () => {
  const uri =
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/bulkmobilemartdb";

  try {
    const conn = await mongoose.connect(uri);
    console.log(
      `MongoDB connected: ${conn.connection.host} / ${conn.connection.name}`
    );
    return conn;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    if (error.message.includes("bad auth")) {
      console.error(
        "Check MONGODB_URI in .env: copy a fresh connection string from Atlas (Connect → Drivers), confirm the DB user exists under Database Access, and URL-encode special characters in the password (e.g. @ → %40)."
      );
    }
    process.exit(1);
  }
};

export default connectDB;
