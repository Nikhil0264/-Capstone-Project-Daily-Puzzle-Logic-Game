import prisma from "../config/prisma.js";


export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                stats: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        
        res.json(user);
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
};


export const getUserScoreHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const scores = await prisma.dailyScore.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            take: parseInt(limit),
            skip: parseInt(skip)
        });

        const total = await prisma.dailyScore.count({ where: { userId } });

        res.json({
            data: scores,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get History Error:", error);
        res.status(500).json({ error: "Failed to fetch history" });
    }
};


export const getHeatmapData = async (req, res) => {
    try {
        const userId = req.user.id;
        
        
        const scores = await prisma.dailyScore.findMany({
            where: { userId },
            select: {
                date: true,
                score: true,
                timeTaken: true,
                puzzleId: true
            }
        });

        res.json(scores);
    } catch (error) {
        console.error("Heatmap Error:", error);
        res.status(500).json({ error: "Failed to fetch heatmap data" });
    }
};


export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ error: "Name is required" });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { name: name.trim() }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
};
