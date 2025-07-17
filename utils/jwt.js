const jwt = require("jsonwebtoken");
const User = require("../models/users.model");

const REFRESH_TOKEN_SECRET = process.env.JWT_SECRET_REFRESH;
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET_ACCESS;

function generateRefrechToken(user) {
  const payload = {
    id: user._id,
    role: user.roles,
  };
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "30d" });
}
function generateAccessToken(user) {
  const payload = {
    id: user._id,
    role: user.roles,
  };
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "30d" });
}

async function newAccessToken(req, res) {
  const token = req.cookies.refresh_token;
  if (!token) {
    return res.status(401).json({ message: "No refresh token" });
  }
  try {
    jwt.verify(token, REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const newAccessToken = generateAccessToken(User);
    res.json({ accesToken: newAccessToken });
  } catch {
    res.status(403).json({ message: "Invalid refresh token" });
  }
}

module.exports = { generateRefrechToken, generateAccessToken, newAccessToken };
