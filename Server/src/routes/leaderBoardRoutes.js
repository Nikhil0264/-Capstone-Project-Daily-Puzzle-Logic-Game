import express from "express";
import {
  getDailyLeaderboard,
  getWeeklyLeaderboard,
  getAllTimeLeaderboard
} from "../controllers/leaderBoardController.js";

const router = express.Router();

router.get("/daily", getDailyLeaderboard);
router.get("/weekly", getWeeklyLeaderboard);
router.get("/all-time", getAllTimeLeaderboard);

export default router;
