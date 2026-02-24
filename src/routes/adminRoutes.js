/**
 * Admin API routes — login (public); protected routes live under contact with authMiddleware.
 */
import { Router } from "express";
import { login } from "../controllers/adminController.js";
import { loginValidationRules, validateLogin } from "../validators/adminValidator.js";

const router = Router();

// POST /api/admin/login — email + password, returns JWT
router.post("/login", loginValidationRules, validateLogin, login);

export default router;
