import prisma from "../config/prisma.js";
import { generateToken } from "../utils/jwt.js";

export const login = async (req, res) => {
  try {
    const { email, provider, name } = req.body;

    if (!email || !provider) {
      return res.status(400).json({ error: "Email and provider are required" });
    }

    const emailTrimmed = String(email).trim().toLowerCase();
    if (!emailTrimmed) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    let user = await prisma.user.findUnique({
      where: { email: emailTrimmed }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: emailTrimmed,
          provider: String(provider),
          name: name ? String(name).trim() : emailTrimmed.split("@")[0]
        }
      });

      try {
        await prisma.userStats.create({
          data: { userId: user.id }
        });
      } catch (statsErr) {
        if (statsErr.code !== "P2002") {
          throw statsErr;
        }
      }
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    const message =
      error.message ||
      (error.code === "P2002" ? "An account with this email already exists." : "Login failed");
    return res.status(500).json({ error: message });
  }
};

export const truecallerLogin = async (req, res) => {
  try {
    const { phone, name, email } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Normalize phone number (remove spaces, dashes, etc.)
    const phoneTrimmed = String(phone).replace(/\D/g, "");
    const emailToUse = (email || `truecaller_${phoneTrimmed}@truecaller.com`).trim().toLowerCase();
    const nameToUse = name ? String(name).trim() : "TrueCaller User";

    let user = await prisma.user.findUnique({
      where: { email: emailToUse }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: emailToUse,
          provider: "truecaller",
          name: nameToUse
        }
      });

      try {
        await prisma.userStats.create({
          data: { userId: user.id }
        });
      } catch (statsErr) {
        if (statsErr.code !== "P2002") {
          throw statsErr;
        }
      }
    } else {
      // Update user if new information is provided
      if (nameToUse !== "TrueCaller User" && user.name !== nameToUse) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { name: nameToUse, provider: "truecaller" }
        });
      }
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "TrueCaller login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider
      }
    });
  } catch (error) {
    console.error("TrueCaller login error:", error);
    const message = error.message || "TrueCaller login failed";
    return res.status(500).json({ error: message });
  }
};
