import { Router } from "express";
import { getLost } from "../controllers/lostController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();
router.get("/", authenticate, getLost);
export default router;