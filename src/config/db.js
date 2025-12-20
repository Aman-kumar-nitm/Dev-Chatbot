const mongoose = require("mongoose");

const connectDB = async (URL) => {
  try {
    await mongoose.connect(URL);
    console.log("✅ MongoDB connected");

  } catch (error) {
    console.error("DB connection failed", error);
    process.exit(1);
  }
};

module.exports = connectDB;