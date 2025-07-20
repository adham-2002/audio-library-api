const jwt = require("jsonwebtoken");
const JWT_SECRET_ACCESS = process.env.JWT_SECRET_ACCESS;
function authMiddleware(allowedUsers = ["user"]) {
  return function (req, res, next) {
    console.log("you are here ");
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "Missing Authorization header" });
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Invalid Authorization format" });
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET_ACCESS);
      req.user = decoded;
      if (allowedUsers && !allowedUsers.includes(decoded.role)) {
        return res
          .status(403)
          .json({ message: "Access denied: You do not have permission" });
      }
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}

module.exports = authMiddleware;
