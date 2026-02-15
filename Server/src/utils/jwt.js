import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

export const generateToken = (user) => {
  if (!JWT_SECRET || JWT_SECRET.length < 8) {
    throw new Error("JWT_SECRET is not configured (set in .env)");
  }
  return jwt.sign(
    {
      id: user.id,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};
