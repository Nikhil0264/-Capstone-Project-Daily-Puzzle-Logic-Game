import prisma from "../config/prisma.js";
import { calculateStreak } from "../services/streak.js";
import dayjs from "dayjs";

export const submitScore = async (req, res) => {
  try {
    const { score, timeTaken, puzzleId, date, difficulty } = req.body;
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
          difficulty: difficulty || "medium",
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

export const syncDailyScores = async (req, res) => {
  try {
    const { entries } = req.body;
    const userId = req.user.id;

    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ error: "Entries must be an array" });
    }

    console.log(`[Sync] Batch sync for user ${userId}: ${entries.length} items`);

    const results = [];
    let syncedCount = 0;

    // Batch upsert entries
    for (const entry of entries) {
      const { date, score, timeTaken, puzzleId, difficulty } = entry;
      const submissionDate = dayjs(date).format("YYYY-MM-DD");

      try {
        await prisma.dailyScore.upsert({
          where: {
            userId_date: {
              userId,
              date: submissionDate
            }
          },
          update: {
            score,
            timeTaken,
            difficulty: difficulty || "medium"
          },
          create: {
            userId,
            date: submissionDate,
            puzzleId: puzzleId || `daily-${submissionDate}`,
            score,
            timeTaken,
            difficulty: difficulty || "medium"
          }
        });
        syncedCount++;
      } catch (err) {
        console.warn(`[Sync] Failed to sync entry for ${submissionDate}:`, err.message);
      }
    }

    // Refresh user's total points and streak based on full history
    const allScores = await prisma.dailyScore.findMany({
      where: { userId },
      orderBy: { date: 'asc' }
    });

    const totalPoints = allScores.reduce((acc, s) => acc + s.score, 0);

    // Calculate current streak
    let streakCount = 0;
    if (allScores.length > 0) {
      const dates = allScores.map(s => s.date);
      let current = dayjs().format("YYYY-MM-DD");
      if (!dates.includes(current)) {
        current = dayjs().subtract(1, 'day').format("YYYY-MM-DD");
      }

      while (dates.includes(current)) {
        streakCount++;
        current = dayjs(current).subtract(1, 'day').format("YYYY-MM-DD");
      }
    }

    const latestScore = allScores[allScores.length - 1];

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints,
        streakCount,
        lastPlayed: latestScore ? new Date(latestScore.date) : null
      }
    });

    res.json({
      success: true,
      synced: syncedCount,
      totalPoints,
      streakCount
    });

  } catch (error) {
    console.error("Batch sync error:", error);
    res.status(500).json({ error: "Batch sync failed" });
  }
};
