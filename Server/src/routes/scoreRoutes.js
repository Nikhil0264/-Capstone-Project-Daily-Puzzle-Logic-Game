import express from "express";
import { submitScore } from "../controllers/scoreController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/submit", verifyToken, submitScore);

export default router;
