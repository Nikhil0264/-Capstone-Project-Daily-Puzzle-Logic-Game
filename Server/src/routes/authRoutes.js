import express from "express";
import { login, truecallerLogin } from "../controllers/authController.js";
import passport from "../config/passport.js";
import { CLIENT_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "../config/env.js";

const router = express.Router();

router.post("/login", login);

// TrueCaller login endpoint
router.post("/truecaller/login", truecallerLogin);

// Ensure Google OAuth is configured before starting the flow
router.get("/google", (req, res, next) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    const errorMsg = "Google login is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Server/.env";
    console.error(errorMsg);
    return res.redirect(
      `${CLIENT_URL}/login?error=${encodeURIComponent(errorMsg)}`
    );
  }
  console.log("[Google OAuth] Starting authentication flow");
  next();
}, passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user) => {
      if (err) {
        console.error("[Google OAuth] Authentication error:", err.message);
        return res.redirect(`${CLIENT_URL}/login?error=${encodeURIComponent(err.message || "Google login failed")}`);
      }
      if (!user || !user.token) {
        console.error("[Google OAuth] No user or token returned");
        return res.redirect(`${CLIENT_URL}/login?error=${encodeURIComponent("Google login failed")}`);
      }
      const { token, user: userData } = user;
      console.log(`[Google OAuth] Success for user: ${userData.email}`);
      return res.redirect(`${CLIENT_URL}/auth/callback?token=${encodeURIComponent(token)}`);
    })(req, res, next);
  }
);

export default router;
