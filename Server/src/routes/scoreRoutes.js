import express from "express";
import { submitScore, syncDailyScores } from "../controllers/scoreController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/submit", verifyToken, submitScore);
router.post("/sync", verifyToken, syncDailyScores);

export default router;
