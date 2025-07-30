const { createClient } = require("redis");
const logger = require("../utils/logger");
let client = null;
async function connectRedis() {
  client = createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  });
  client.on("error", (err) => {
    logger.error("Redis Client Error", { error: err.message });
  });
  try {
    await client.connect();
    logger.info("Redis client connected successfully");
  } catch (error) {
    logger.error("Redis client connection failed", error);
    throw error;
  }
}
function getRedisClient() {
  if (!client) {
    throw new Error("Redis client is not connected. Call connectRedis first.");
  }
  return client;
}
module.exports = { connectRedis, getRedisClient };
