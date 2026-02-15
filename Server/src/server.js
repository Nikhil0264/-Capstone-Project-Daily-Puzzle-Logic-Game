import "dotenv/config";
import app from "./app.js";
import { PORT, JWT_SECRET } from "./config/env.js";
import prisma from "./config/prisma.js";

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

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📍 API available at http://localhost:${PORT}/api`);
  });
}

start();
