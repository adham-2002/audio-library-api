const jwt = require("jsonwebtoken");
const User = require("../models/users.model");
const Token = require("../models/token.model");
const { v4: uuidv4 } = require("uuid");
const { getRedisClient } = require("../config/redisConnect");
const logger = require("../utils/logger");
const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH;
const JWT_SECRET_ACCESS = process.env.JWT_SECRET_ACCESS;

async function generateRefreshToken(user) {
  const sessionId = uuidv4();

  const payload = {
    id: user._id,
    role: user.role,
    sessionId: sessionId,
  };
  const refreshToken = jwt.sign(payload, JWT_SECRET_REFRESH, {
    expiresIn: "7d",
  });
  const expiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  try {
    // Save in MongoDB first (fallback storage)
    await Token.create({
      userId: user._id,
      refreshToken,
      sessionId,
      expiredAt,
    });

    // Save in Redis using Set + individual session keys
    const redisClient = getRedisClient();
    const setKey = `user_session_list:${user._id}`;
    const sessionKey = `session:${user._id}:${sessionId}`;

    // Add sessionId to user's set
    try {
      await redisClient.sAdd(setKey, sessionId);
      await redisClient.expire(setKey, 7 * 24 * 60 * 60);
    } catch (setError) {
      logger.error("Redis set operations failed", { error: setError.message });
    }

    // Save session data in individual key
    const sessionData = {
      refreshToken,
      sessionId: sessionId,
      createdAt: new Date().toISOString(),
      userRole: user.role,
    };
    try {
      await redisClient.set(sessionKey, JSON.stringify(sessionData), {
        EX: 7 * 24 * 60 * 60, // 7 days
      });
    } catch (sessionError) {
      logger.error("Redis session save failed", {
        error: sessionError.message,
      });
    }
  } catch (error) {
    logger.error("Redis operation failed during token generation", {
      userId: user._id,
      error: error.message,
    });
  }

  return { refreshToken, sessionId };
}
function generateAccessToken(user) {
  const payload = {
    id: user._id,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET_ACCESS, { expiresIn: "5m" });
}

module.exports = { generateRefreshToken, generateAccessToken };
