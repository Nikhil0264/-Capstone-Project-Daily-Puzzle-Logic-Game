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

// Helper to verify TrueCaller token with their profile API
const verifyTruecallerToken = async (accessToken) => {
  try {
    console.log("[TrueCaller] Verifying token with TrueCaller API...");
    const response = await fetch("https://profile4.truecaller.com/v1/default", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[TrueCaller] API Error:", response.status, errorData);
      throw new Error(errorData.message || `TrueCaller verification failed (${response.status})`);
    }

    const profileData = await response.json();
    console.log("[TrueCaller] Token verified successfully");

    return {
      phone: profileData.phoneNumbers?.[0] || profileData.phoneNumber,
      name: `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim() || "TrueCaller User",
      email: profileData.onlineIds?.find(id => id.type === "email")?.id || profileData.email,
      verified: true
    };
  } catch (error) {
    console.error("[TrueCaller] Verification error:", error.message);
    throw error;
  }
};

export const truecallerLogin = async (req, res) => {
  try {
    const { accessToken, phone: clientPhone, name: clientName, email: clientEmail } = req.body;

    // 1. If accessToken is provided, verify it with TrueCaller API (Secure flow)
    let verifiedData = null;
    if (accessToken) {
      try {
        verifiedData = await verifyTruecallerToken(accessToken);
      } catch (verifyErr) {
        return res.status(401).json({ error: "Invalid TrueCaller token: " + verifyErr.message });
      }
    } else {
      // 2. Fallback to trust-based flow if no token (Insecure - we should ideally require token)
      // For now, let's keep it but log a warning. In production, we'd enforce accessToken.
      console.warn("[TrueCaller] Login attempt without accessToken. Falling back to trust-based data.");

      // In a real production app, we would return 400 here:
      // return res.status(400).json({ error: "TrueCaller accessToken is required for secure login" });
    }

    // Use verified data if available, otherwise fallback to request body (for backward compatibility during migration)
    const phone = verifiedData?.phone || clientPhone;
    const name = verifiedData?.name || clientName;
    const email = verifiedData?.email || clientEmail;

    // Validate required fields
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Normalize and validate phone number
    const phoneTrimmed = String(phone).trim();
    if (phoneTrimmed.length < 10) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    // Create consistent email from phone number
    const phoneDigitsOnly = phoneTrimmed.replace(/\D/g, "");
    const emailToUse = (email || `tc_${phoneDigitsOnly}@truecaller.com`).trim().toLowerCase();
    const nameToUse = name ? String(name).trim() : "TrueCaller User";

    // Find or create user
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

      // Create user stats if not exists
      try {
        await prisma.userStats.create({
          data: { userId: user.id }
        });
      } catch (statsErr) {
        // Ignore unique constraint errors (P2002)
        if (statsErr.code !== "P2002") {
          throw statsErr;
        }
      }
    } else {
      // Update user info with verified data if provider matches or if it's a legacy user
      const updateData = { provider: "truecaller" };
      if (nameToUse !== "TrueCaller User" && user.name !== nameToUse) {
        updateData.name = nameToUse;
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });
    }

    // Generate JWT token
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
