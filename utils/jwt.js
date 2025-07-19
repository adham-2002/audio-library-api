const jwt = require("jsonwebtoken");
const User = require("../models/users.model");

const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH;
const JWT_SECRET_ACCESS = process.env.JWT_SECRET_ACCESS;

function generateRefrechToken(user) {
  const payload = {
    id: user._id,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET_REFRESH, { expiresIn: "30d" });
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
    console.log(newAccessToken)
    res.json({ accesToken: newAccessToken });
  } catch {
    res.status(403).json({ message: "Invalid refresh token" });
  }
}

module.exports = { generateRefrechToken, generateAccessToken, newAccessToken };
