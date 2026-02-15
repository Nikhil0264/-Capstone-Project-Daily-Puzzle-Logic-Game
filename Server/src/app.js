import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import scoreRoutes from "./routes/scoreRoutes.js";
import userRouter from "./routes/userRoutes.js";
import leaderBoardRoutes from "./routes/leaderBoardRoutes.js";
import passport from "./config/passport.js";
import { apiLimiter, authLimiter, scoreSubmissionLimiter } from "./middleware/rateLimitMiddleware.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport initialization
app.use(passport.initialize());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Rate limiting middleware
app.use("/api/auth", authLimiter);
app.use("/api/score/submit", scoreSubmissionLimiter);
app.use("/api", apiLimiter);

// Routes
app.use("/api/user", userRouter);
app.use("/api/leaderboard", leaderBoardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/score", scoreRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use(errorHandler);

export default app;
