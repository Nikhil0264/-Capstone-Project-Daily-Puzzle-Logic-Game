import prisma from "../config/prisma.js";
import { calculateStreak } from "../services/streak.js";
import dayjs from "dayjs";

export const submitScore = async (req, res) => {
  try {
    const { score, timeTaken, puzzleId } = req.body;
    const userId = req.user.id;

    const todayDate = dayjs().format("YYYY-MM-DD");

        
    const existing = await prisma.dailyScore.findUnique({
      where: {
        userId_date: {
          userId,
          date: todayDate
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: "Already submitted today" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    const streakResult = calculateStreak(user.lastPlayed);

    if (streakResult === null) {
      return res.status(400).json({ error: "Already played today" });
    }

    let newStreak = 1;

    if (streakResult === "increment") {
      newStreak = user.streakCount + 1;
    }

    if (streakResult === "reset") {
      newStreak = 1;
    }

    // Transaction to keep writes minimal and safe in case of errors
    await prisma.$transaction([
      prisma.dailyScore.create({
        data: {
          userId,
          date: todayDate,
          puzzleId,
          score,
          timeTaken
        }
      }),

      prisma.user.update({
        where: { id: userId },
        data: {
          streakCount: newStreak,
          lastPlayed: new Date(),
          totalPoints: user.totalPoints + score
        }
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
      streak: newStreak
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Score submission failed" });
  }
};
