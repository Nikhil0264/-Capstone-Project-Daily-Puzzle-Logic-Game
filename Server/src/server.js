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

app.use(cors());
app.use(express.json());
app.use(passport.initialize());


app.use("/api/auth", authLimiter);
app.use("/api/score/submit", scoreSubmissionLimiter);
app.use("/api", apiLimiter);

app.use("/api", userRouter); 
app.use("/api/leaderboard", leaderBoardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/score", scoreRoutes);


app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
