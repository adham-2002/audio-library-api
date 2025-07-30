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
  const expiredAt = new Date(Date.now()) + 7 * 24 * 60 * 60 * 1000;

  try {
    await Token.create({
      userId: user._id,
      refreshToken,
      sessionId,
      expiredAt,
    });

    try {
      const redisClient = getRedisClient();
      const setKey = `user_session_list:${user._id}`;
      const sessionKey = `session:${user._id}:${sessionId}`;

      const sessionData = {
        refreshToken,
        sessionId: sessionId,
        createdAt: new Date().toISOString(),
        userRole: user.role,
        userId: user._id.toString(),
      };

      // Store only sessionId in the Set (best practice)
      await redisClient.sAdd(setKey, sessionId);
      await redisClient.expire(setKey, 7 * 24 * 60 * 60);

      // Store all session details in metadata key
      await redisClient.set(sessionKey, JSON.stringify(sessionData), {
        EX: 7 * 24 * 60 * 60,
      });

      logger.info("Session created in Redis", {
        userId: user._id,
        sessionId,
      });
    } catch (redisError) {
      logger.error("Redis connection or operation failed", {
        error: redisError.message,
        userId: user._id,
        sessionId,
      });
    }
  } catch (mongoError) {
    logger.error("MongoDB operation failed during token generation", {
      userId: user._id,
      error: mongoError.message,
    });
    throw mongoError;
  }

  return { refreshToken, sessionId };
}
function generateAccessToken(user, sessionId) {
  const payload = {
    id: user._id,
    role: user.role,
    sessionId: sessionId,
  };

  return jwt.sign(payload, JWT_SECRET_ACCESS, { expiresIn: "1h" }); // Extended to 1 hour for testing
}

module.exports = { generateRefreshToken, generateAccessToken };
