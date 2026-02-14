import prisma from "../config/prisma.js";
import { generateToken } from "../utils/jwt.js";

export const login = async (req, res) => {
  try {
    const { email, provider, name } = req.body;

    // Validate input
    if (!email || !provider) {
      return res.status(400).json({ error: "Email and provider are required" });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email }
    });

    // If user doesn't exist, create one
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          provider,
          name
        }
      });

      // Create related UserStats record
      await prisma.userStats.create({
        data: {
          userId: user.id
        }
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
};
