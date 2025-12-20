const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authenticate = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const token = req.cookies?.token;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User no longer exists",
        });
      }

      // 🔐 ROLE CHECK (ONLY IF ROLES PROVIDED)
      if (allowedRoles.length > 0) {
        if (!allowedRoles.includes(user.role)) {
          return res.status(403).json({
            success: false,
            message: "Access denied: insufficient permissions",
          });
        }
      }

      req.user = user;
      next();

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  };
};

module.exports = authenticate;
