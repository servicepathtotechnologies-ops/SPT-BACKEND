import { Router } from "express";
import { getActivity } from "../controllers/activityController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();
router.get("/", authenticate, getActivity);
export default router;