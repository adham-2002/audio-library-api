const apiError = require("../utils/apiError");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const { getRedisClient } = require("../config/redisConnect");
const jwt = require("jsonwebtoken");
const Token = require("../models/token.model");
const logger = require("../utils/logger");
const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH;

const logout = asyncErrorHandler(async (req, res, next) => {
  const token = req.cookies.refresh_token;
  if (!token) {
    return next(new apiError("No refresh token provided", 401));
  }

  const decoded = jwt.verify(token, JWT_SECRET_REFRESH);
  const { id: userId, sessionId } = decoded;
  const redisClient = getRedisClient();

  const sessionKey = `session:${userId}:${sessionId}`;
  const setKey = `user_session_list:${userId}`;

  // Remove from Redis
  await redisClient.del(sessionKey);
  await redisClient.sRem(setKey, sessionId);

  // Remove from MongoDB
  await Token.deleteOne({ refreshToken: token, userId, sessionId });

  res.clearCookie("refresh_token");

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

const logoutAll = asyncErrorHandler(async (req, res, next) => {
  const token = req.cookies.refresh_token;
  if (!token) {
    return next(new apiError("No refresh token provided", 401));
  }

  const decoded = jwt.verify(token, JWT_SECRET_REFRESH);
  const userId = decoded.id;
  const redisClient = getRedisClient();

  // Remove all tokens from MongoDB
  await Token.deleteMany({ userId });

  // Remove all sessions from Redis
  const setKey = `user_session_list:${userId}`;
  const pattern = `session:${userId}:*`;
  const allSessionKeys = await redisClient.keys(pattern);

  if (allSessionKeys.length > 0) {
    await redisClient.del(allSessionKeys);
  }
  await redisClient.del(setKey);

  res.clearCookie("refresh_token");

  res.status(200).json({
    status: "success",
    message: "Logged out from all devices",
  });
});
const getLoggedUserSessions = asyncErrorHandler(async (req, res, next) => {
  const { id: userId, sessionId: currentSessionId } = req.user;
  const redisClient = getRedisClient();
  const setKey = `user_session_list:${userId}`;

  const sessionIds = await redisClient.sMembers(setKey);
  if (!sessionIds?.length) {
    return next(new apiError("No active sessions found", 404));
  }

  // Format sessions to only return sessionId and current session indicator
  const sessions = sessionIds.map(sessionId => ({
    sessionId,
    isCurrentSession: sessionId === currentSessionId,
  }));

  res.status(200).json({
    status: "success",
    data: {
      totalSessions: sessions.length,
      sessions,
    },
  });
});
const deleteSpecificSession = asyncErrorHandler(async (req, res, next) => {
  const { sessionId } = req.params;
  const { id: userId } = req.user;
  const redisClient = getRedisClient();

  const sessionKey = `session:${userId}:${sessionId}`;
  const setKey = `user_session_list:${userId}`;

  const sessionExists = await redisClient.exists(sessionKey);
  if (!sessionExists) {
    return next(new apiError("Session not found", 404));
  }

  // Remove from Redis
  await redisClient.del(sessionKey);
  await redisClient.sRem(setKey, sessionId);

  // Remove from MongoDB
  await Token.deleteOne({ userId, sessionId });

  res.status(200).json({
    status: "success",
    message: "Session deleted successfully",
  });
});
module.exports = {
  logout,
  logoutAll,
  getLoggedUserSessions,
  deleteSpecificSession,
};
