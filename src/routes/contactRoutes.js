/**
 * Contact API routes — GET (list, protected), POST (submit, public), DELETE (protected).
 */
import { Router } from "express";
import {
  getAllContacts,
  submitContact,
  deleteContact,
} from "../controllers/contactController.js";
import {
  contactValidationRules,
  listContactValidationRules,
  validateContact,
  validate,
} from "../validators/contactValidator.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// GET /api/contact — fetch all submissions (admin only; optional ?limit=&offset=)
router.get("/", authenticate, listContactValidationRules, validate, getAllContacts);

// POST /api/contact — submit contact form (public; validation + controller)
router.post("/", contactValidationRules, validateContact, submitContact);

// DELETE /api/contact/:id — delete one contact (admin only)
router.delete("/:id", authenticate, deleteContact);

export default router;
