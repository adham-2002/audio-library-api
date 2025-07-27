const mongoose = require("mongoose");
const logger = require("../utils/logger");

const MONGO_URI = process.env.DATABASE_URL;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info("DB connected successfully");
  } catch (err) {
    logger.error(`DB connection error: ${err}`);
    throw err;
  }
};

module.exports = connectDB;
