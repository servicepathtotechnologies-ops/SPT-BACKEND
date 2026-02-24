/**
 * Admin login validation using express-validator.
 */
import { body, validationResult } from "express-validator";

export const loginValidationRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email address."),
  body("password")
    .notEmpty()
    .withMessage("Password is required."),
];

/**
 * Middleware: check validation result and send 400 with structured errors on failure.
 */
export const validateLogin = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const formatted = errors.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));
  return res.status(400).json({
    success: false,
    message: "Validation failed.",
    errors: formatted,
  });
};
