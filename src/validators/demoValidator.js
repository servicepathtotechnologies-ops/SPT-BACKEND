/**
 * Demo validation rules using express-validator.
 */
import { body, query, validationResult } from "express-validator";

export const listDemoValidationRules = [
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

export const demoValidationRules = [
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
  body("company")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Company must be at most 150 characters."),
  body("demo_date")
    .notEmpty()
    .withMessage("Demo date is required.")
    .isISO8601()
    .withMessage("Please provide a valid date/time for the demo."),
  body("service")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Service must be at most 150 characters."),
  body("notes")
    .optional({ values: "null" })
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Notes must be at most 2000 characters."),
];

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

export const validateDemo = validate;

const STATUS_VALUES = ["Pending", "Scheduled", "Completed", "Cancelled", "Lead", "Lost"];

export const patchDemoStatusRules = [
  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required.")
    .isIn(STATUS_VALUES)
    .withMessage(`Status must be one of: ${STATUS_VALUES.join(", ")}`),
];
