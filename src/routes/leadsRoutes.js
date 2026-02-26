import { Router } from "express";
import { getLeads } from "../controllers/leadsController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();
router.get("/", authenticate, getLeads);
export default router;