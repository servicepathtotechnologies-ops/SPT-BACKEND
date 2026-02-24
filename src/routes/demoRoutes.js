/**
 * Demo API routes — GET (list, protected), POST (submit, public), DELETE (protected).
 */
import { Router } from "express";
import {
  getAllDemos,
  submitDemo,
  deleteDemo,
} from "../controllers/demoController.js";
import {
  demoValidationRules,
  listDemoValidationRules,
  validateDemo,
  validate,
} from "../validators/demoValidator.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// GET /api/demo — fetch all demo bookings (admin only)
router.get("/", authenticate, listDemoValidationRules, validate, getAllDemos);

// POST /api/demo — submit demo booking (public)
router.post("/", demoValidationRules, validateDemo, submitDemo);

// DELETE /api/demo/:id — delete one demo (admin only)
router.delete("/:id", authenticate, deleteDemo);

export default router;
