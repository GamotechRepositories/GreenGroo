import mongoose from "mongoose";

const connectDB = async (serviceName = "service") => {
  const uri =
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/greengroccdb";

  try {
    const conn = await mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME || "test",
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
    });
    console.log(
      `[${serviceName}] MongoDB connected: ${conn.connection.host} / ${conn.connection.name}`
    );
    return conn;
  } catch (error) {
    console.error(`[${serviceName}] MongoDB connection error:`, error.message);
    process.exit(1);
  }
};

export default connectDB;
