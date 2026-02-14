import prisma from "../config/prisma.js";
import dayjs from "dayjs";

export const getDailyLeaderboard = async (req, res) => {
  try {
    const today = dayjs().format("YYYY-MM-DD");

    const leaderboard = await prisma.dailyScore.findMany({
      where: { date: today },
      orderBy: { score: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};

export const getWeeklyLeaderboard = async (req, res) => {
  try {
    const startOfWeek = dayjs().startOf("week").format("YYYY-MM-DD");

    const leaderboard = await prisma.dailyScore.groupBy({
      by: ["userId"],
      where: {
        date: {
          gte: startOfWeek
        }
      },
      _sum: {
        score: true
      },
      orderBy: {
        _sum: {
          score: "desc"
        }
      },
      take: 100
    });

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch weekly leaderboard" });
  }
};


export const getAllTimeLeaderboard = async (req, res) => {
  try {
    const leaderboard = await prisma.user.findMany({
      orderBy: {
        totalPoints: "desc"
      },
      take: 100,
      select: {
        name: true,
        totalPoints: true,
        streakCount: true
      }
    });

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch all-time leaderboard" });
  }
};
