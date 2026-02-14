import express from "express";
import { login } from "../controllers/authController.js";
import passport from "../config/passport.js";

const router = express.Router();

router.post("/login", login);


   

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    res.json(req.user); 
  }
);

export default router;
