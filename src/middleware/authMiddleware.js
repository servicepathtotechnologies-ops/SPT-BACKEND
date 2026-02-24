/**
 * JWT authentication middleware — verifies Bearer token and attaches req.user.
 * Use on routes that require admin authentication.
 */
import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { logger } from "../utils/logger.js";

const JWT_SECRET = config.security.jwtSecret;

/**
 * Verify JWT from Authorization: Bearer <token>.
 * On success: set req.user = { id, email }; call next().
 * On failure: respond 401 with { success: false, message }.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Provide a valid Bearer token.",
    });
  }

  const token = authHeader.slice(7); // remove "Bearer "

  if (!JWT_SECRET) {
    logger.error("JWT_SECRET is not set.");
    return res.status(500).json({
      success: false,
      message: "Server configuration error.",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Expect decoded payload to have sub (admin id) and email
    req.user = {
      id: decoded.sub,
      email: decoded.email,
    };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
      });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }
    next(err);
  }
};
