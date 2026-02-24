/**
 * Centralized error handler middleware — structured JSON response, env-aware messages.
 * Use next(err) from routes/controllers to reach this handler.
 */
import config from "../config/index.js";
import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  const { isProduction } = config;

  if (isProduction) {
    logger.error(err.message || err);
  } else {
    logger.error(err);
  }

  // PostgreSQL / pg errors
  if (err.code) {
    if (err.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A submission with this email already exists.",
        errors: [],
      });
    }
    if (err.code === "23503" || err.code === "22P02") {
      return res.status(400).json({
        success: false,
        message: "Invalid data.",
        errors: [],
      });
    }
    if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
      return res.status(503).json({
        success: false,
        message: "Service temporarily unavailable.",
        errors: [],
      });
    }
  }

  // Rate limit (express-rate-limit sets statusCode)
  if (err.statusCode === 429) {
    return res.status(429).json({
      success: false,
      message: err.message || "Too many requests.",
      errors: [],
    });
  }

  // Generic server error — hide details in production
  const status = err.statusCode || err.status || 500;
  const message = isProduction
    ? "Something went wrong. Please try again later."
    : (err.message || "Internal server error.");

  res.status(status).json({
    success: false,
    message,
    errors: err.errors || [],
  });
};
