const passwordValidator = require("../utils/passwordValidator");
const User = require("../models/users.model");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const apiError = require("../utils/apiError");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const logger = require("../utils/logger");
const { getRedisClient } = require("../config/redisConnect");
const jwt = require("jsonwebtoken");
const Token = require("../models/token.model");
const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH;
const signup = asyncErrorHandler(async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    logger.info(`User signup attempt`, {
      username,
      email,
      role: role || "user",
    });
    const existedEmail = await User.findOne({ email });
    if (existedEmail) {
      logger.warn(`Signup failed - email already exists`, { email });
      return next(new apiError("Email already exists", 409));
    }
    const userRole = role === "admin" ? "admin" : "user";
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: username,
      email: email,
      password: hashedPassword,
      role: userRole,
    });

    await newUser.save();
    logger.info(`User created successfully`, {
      userId: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    });

    const { refreshToken, sessionId } = await generateRefreshToken(newUser);
    const accessToken = generateAccessToken(newUser, sessionId);

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "Signup successful",
      user: {
        id: newUser._id,
        name: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
});
const signin = asyncErrorHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    logger.info(`User signin attempt`, { email });

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`Signin failed - user not found`, { email });
      return next(new apiError("User Not Found", 400));
    }

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      logger.warn(`Signin failed - invalid password`, {
        email,
        userId: user._id,
      });
      return next(new apiError("Invalid Password", 400));
    }

    const { refreshToken, sessionId } = await generateRefreshToken(user);
    const accessToken = generateAccessToken(user, sessionId);

    logger.info(`User signed in successfully`, {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      sessionId,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Signin successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      sessionId,
    });
  } catch (error) {
    logger.error(`Signin error`, {
      email: req.body?.email,
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
});
const newAccessToken = asyncErrorHandler(async (req, res, next) => {
  const token = req.cookies.refresh_token;

  if (!token) {
    return res.status(401).json({ message: "No refresh token" });
  }

  const decoded = jwt.verify(token, JWT_SECRET_REFRESH);
  const redisClient = getRedisClient();
  // Use sessionKey structure
  const sessionKey = `session:${decoded.id}:${decoded.sessionId}`;
  let sessionData = null;
  try {
    sessionData = await redisClient.get(sessionKey);
  } catch (redisError) {
    logger.warn("Redis get failed, falling back to MongoDB", {
      error: redisError.message,
    });
  }

  // If not in Redis, fallback to MongoDB
  if (!sessionData) {
    const tokenDoc = await Token.findOne({ refreshToken: token });
    if (!tokenDoc) {
      return res.status(403).json({ message: "Refresh token not recognized" });
    }
    sessionData = JSON.stringify({
      userId: tokenDoc.userId,
      sessionId: tokenDoc.sessionId,
      refreshToken: token,
      createdAt: tokenDoc.createdAt,
      userRole: tokenDoc.role,
    });

    // Save in Redis for future requests (if Redis is available)
    try {
      const sessionKeyDb = `session:${tokenDoc.userId}:${tokenDoc.sessionId}`;
      await redisClient.set(sessionKeyDb, sessionData, {
        EX: Math.floor((tokenDoc.expiredAt - Date.now()) / 1000),
      });
      // Add to set
      await redisClient.sAdd(
        `user_session_list:${tokenDoc.userId}`,
        tokenDoc.sessionId
      );
      await redisClient.expire(
        `user_session_list:${tokenDoc.userId}`,
        Math.floor((tokenDoc.expiredAt - Date.now()) / 1000)
      );
    } catch (redisError) {
      logger.warn("Redis set failed", { error: redisError.message });
    }
  }

  const parsed = JSON.parse(sessionData);
  if (parsed.sessionId !== decoded.sessionId) {
    return next(new apiError("Session mismatch, please login again", 403));
  }

  const user = await User.findById(decoded.id);
  if (!user) return next(new apiError("User not found", 404));

  const newAccessToken = generateAccessToken(user, decoded.sessionId);

  logger.info("Access token refreshed successfully", { userId: user._id });

  res.status(200).json({
    accessToken: newAccessToken,
  });
});

module.exports = {
  signup,
  signin,
  newAccessToken,
};
