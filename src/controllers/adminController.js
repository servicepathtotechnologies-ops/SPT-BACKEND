/**
 * Admin controller — HTTP layer only; delegates to auth service.
 * Handles req/res and next(err). No DB or JWT logic here.
 */
import * as authService from "../services/authService.js";

/**
 * POST /api/admin/login — email + password → JWT.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json({
      success: true,
      message: "Login successful.",
      token: result.token,
      admin: result.admin,
    });
  } catch (err) {
    next(err);
  }
}
