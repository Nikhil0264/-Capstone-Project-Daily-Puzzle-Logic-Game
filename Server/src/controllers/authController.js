import prisma from "../config/prisma.js";
import { generateToken } from "../utils/jwt.js";

export const login = async (req, res) => {
  try {
    const { email, provider, name } = req.body;

    if (!email || !provider) {
      return res.status(400).json({ error: "Missing fields" });
    }er

    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          provider,
          name
        }
      });

      await prisma.userStats.create({
        data: {
          userId: user.id
        }
      });
    }

    const token = generateToken(user);

    res.json({
      token,
      user
    });

  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
};
