const jwt = require("jsonwebtoken");
const User = require("../models/users.model");
const Token = require("../models/token.model");
const { v4: uuidv4 } = require("uuid");
const { getRedisClient } = require("../config/redisConnect");
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
  //1) save in mongoDb
  await Token.create({ userId: user._id, refreshToken, sessionId, expiredAt });
  //2) save in redis
  const redisClient = getRedisClient();
  await redisClient.set(
    refreshToken,
    JSON.stringify({ userId: user._id, sessionId }),
    {
      EX: 7 * 24 * 60 * 60, // 7 days
    }
  );
  return { refreshToken, sessionId };
}
function generateAccessToken(user) {
  const payload = {
    id: user._id,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET_ACCESS, { expiresIn: "30d" });
}

async function newAccessToken(req, res) {
  const token = req.cookies.refresh_token;
  if (!token) {
    return res.status(401).json({ message: "No refresh token" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET_REFRESH);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const newAccessToken = generateAccessToken(user);
    console.log(newAccessToken);
    res.json({ accessToken: newAccessToken });
  } catch {
    res.status(403).json({ message: "Invalid refresh token" });
  }
}

module.exports = { generateRefreshToken, generateAccessToken, newAccessToken };
