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
app.set("trust proxy", 1);
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:3000"
];

console.log("✅ CORS Allowed Origins:", allowedOrigins);

// app.use(cors({
//   origin: function (origin, callback) {
//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!origin) return callback(null, true);

//     if (allowedOrigins.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       console.warn(`CORS blocked origin: ${origin}`);
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true
// }));
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport initialization
app.use(passport.initialize());

// Health check (root and under /api for frontend)
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});
app.get("/api/health", (req, res) => {
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
