import prisma from "../config/prisma.js";
import { calculateStreak } from "../services/streak.js";
import dayjs from "dayjs";

export const submitScore = async (req, res) => {
  try {
    const { score, timeTaken, puzzleId, date } = req.body;
    const userId = req.user.id;

    
    if (!date || !dayjs(date).isValid()) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    
    
    const serverToday = dayjs().endOf('day').add(1, 'day');
    if (dayjs(date).isAfter(serverToday)) {
      return res.status(400).json({ error: "Cannot submit for future dates" });
    }

    if (score < 0 || score > 5000) { 
      return res.status(400).json({ error: "Invalid score range" });
    }

    if (timeTaken < 5) { 
      return res.status(400).json({ error: "Time taken is too short" });
    }

    if (timeTaken < 0) {
      return res.status(400).json({ error: "Invalid time taken" });
    }

    
    const submissionDate = dayjs(date).format("YYYY-MM-DD");

    const existing = await prisma.dailyScore.findUnique({
      where: {
        userId_date: {
          userId,
          date: submissionDate
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: "Already submitted for this date" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    
    
    
    const streakResult = calculateStreak(user.lastPlayed, submissionDate);

    
    
    
    

    let newStreak = user.streakCount; 

    if (streakResult === "increment") {
      newStreak = user.streakCount + 1;
    } else if (streakResult === "reset") {
      newStreak = 1;
    } else if (user.streakCount === 0) {
      newStreak = 1;
    }
    
    

    
    
    
    
    
    

    const isLatest = !user.lastPlayed || dayjs(submissionDate).isAfter(dayjs(user.lastPlayed));

    
    
    
    
    
    

    const updateData = {
      totalPoints: user.totalPoints + score
    };

    if (isLatest) {
      updateData.streakCount = newStreak;
      updateData.lastPlayed = new Date(submissionDate); 
    }

    
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
    console.error(error);
    res.status(500).json({ error: "Score submission failed" });
  }
};
