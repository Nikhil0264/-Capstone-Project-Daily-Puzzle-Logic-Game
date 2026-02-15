import prisma from "../config/prisma.js";
import { calculateStreak } from "../services/streak.js";
import dayjs from "dayjs";

export const submitScore = async (req, res) => {
  try {
    const { score, timeTaken, puzzleId, date } = req.body;
    const userId = req.user.id;

    // Validation
    if (!date || !dayjs(date).isValid()) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Reject future dates (allow current day)
    const submissionDate = dayjs(date).format("YYYY-MM-DD");
    const today = dayjs().format("YYYY-MM-DD");
    if (dayjs(submissionDate).isAfter(today, 'day')) {
      return res.status(400).json({ error: "Cannot submit for future dates" });
    }

    // Score validation
    if (score < 0 || score > 5000) {
      return res.status(400).json({ error: "Score out of valid range (0-5000)" });
    }

    // Time taken validation
    if (timeTaken < 5) {
      return res.status(400).json({ error: "Submission time too short" });
    }

    if (timeTaken > 86400) { // 24 hours
      return res.status(400).json({ error: "Submission time too long" });
    }

    // Check if already submitted for this date
    const existing = await prisma.dailyScore.findUnique({
      where: {
        userId_date: {
          userId,
          date: submissionDate
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: "Already submitted score for this date" });
    }

    // Get user record
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { stats: true }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Calculate streak
    const streakResult = calculateStreak(user.lastPlayed, submissionDate);
    let newStreak = user.streakCount || 0;

    if (streakResult === "increment") {
      newStreak = user.streakCount + 1;
    } else if (streakResult === "reset") {
      newStreak = 1;
    } else if (streakResult === null && user.lastPlayed === submissionDate) {
      // Already played today, don't change streak
      newStreak = user.streakCount || 0;
    } else {
      newStreak = 1;
    }

    // Only update last played if this is the latest submission
    const isLatest = !user.lastPlayed || dayjs(submissionDate).isSameOrAfter(dayjs(user.lastPlayed), 'day');

    const updateData = {
      totalPoints: user.totalPoints + score
    };

    if (isLatest) {
      updateData.streakCount = newStreak;
      updateData.lastPlayed = new Date(submissionDate);
    }

    // Use transaction to ensure consistency
    await prisma.$transaction([
      prisma.dailyScore.create({
        data: {
          userId,
          date: submissionDate,
          puzzleId,
          score,
          timeTaken
        }
      }),

      prisma.user.update({
        where: { id: userId },
        data: updateData
      }),

      prisma.userStats.update({
        where: { userId },
        data: {
          puzzlesSolved: { increment: 1 },
          avgSolveTime:
            ((user.stats?.avgSolveTime || 0) + timeTaken) / 2
        }
      })
    ]);

    res.json({
      success: true,
      streak: isLatest ? newStreak : user.streakCount,
      message: isLatest ? "Streak updated" : "Past score recorded"
    });

  } catch (error) {
    console.error("Score submission error:", error);
    res.status(500).json({ error: "Score submission failed" });
  }
};
