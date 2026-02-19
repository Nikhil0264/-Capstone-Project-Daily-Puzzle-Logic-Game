import "dotenv/config";
import app from "./app.js";
import { PORT, JWT_SECRET, CLIENT_URL, SERVER_URL } from "./config/env.js";
import prisma from "./config/prisma.js";

let server;

async function start() {
  if (!JWT_SECRET || JWT_SECRET.length < 8) {
    console.error("❌ JWT_SECRET is missing or too short. Set it in Server/.env (e.g. JWT_SECRET=your-secret-at-least-8-chars)");
    process.exit(1);
  }
  try {
    await prisma.$connect();
    console.log("✅ Database connected");
  } catch (e) {
    console.error("❌ Database connection failed:", e.message);
    console.error("   Set DATABASE_URL in Server/.env (e.g. postgresql://user:pass@localhost:5432/dbname)");
    process.exit(1);
  }

  server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 API endpoint: ${SERVER_URL}/api`);
    console.log(`🔐 Frontend allowed: ${CLIENT_URL}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

start();

// Graceful shutdown helper
async function shutdown(exitCode = 1) {
  try {
    console.log("Shutting down server...");
    if (server) {
      server.close(() => {
        console.log("HTTP server closed");
      });
    }
    await prisma.$disconnect();
  } catch (e) {
    console.error("Error during shutdown:", e?.message || e);
  } finally {
    setTimeout(() => process.exit(exitCode), 1000);
  }
}

process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection at:", p, "reason:", reason && reason.message ? reason.message : reason);
  shutdown(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err && err.message ? err.message : err);
  shutdown(1);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received");
  shutdown(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received");
  shutdown(0);
});
