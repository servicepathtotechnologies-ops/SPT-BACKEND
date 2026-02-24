/**
 * Contact validation rules using express-validator.
 */
import { body, query, validationResult } from "express-validator";

// Validation rules for GET /api/contact (optional pagination)
export const listContactValidationRules = [
  query("limit")
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage("limit must be between 1 and 500")
    .toInt(),
  query("offset")
    .optional()
    .isInt({ min: 0 })
    .withMessage("offset must be a non-negative integer")
    .toInt(),
];

// Validation rules for POST /api/contact
export const contactValidationRules = [
  body("full_name")
    .trim()
    .notEmpty()
    .withMessage("Full name is required.")
    .isLength({ min: 2 })
    .withMessage("Full name must be at least 2 characters."),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isLength({ max: 254 })
    .withMessage("Email is too long.")
    .isEmail({ allow_utf8_local_part: false, require_tld: true })
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),
  body("phone")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 20 })
    .withMessage("Phone must be at most 20 characters."),
  body("company")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Company must be at most 150 characters."),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required.")
    .isLength({ min: 10 })
    .withMessage("Message must be at least 10 characters."),
];

/**
 * Reusable middleware: check validation result and send structured 400 on failure.
 */
export const validate = (req, res, next) => {
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

/** Alias for POST contact validation. */
export const validateContact = validate;
