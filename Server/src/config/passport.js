import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma.js";
import { generateToken } from "../utils/jwt.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        let user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              provider: "google",
              name
            }
          });

          await prisma.userStats.create({
            data: { userId: user.id }
          });
        }

        const token = generateToken(user);

        return done(null, { user, token });

      } catch (error) {
        return done(error, null);
      }
    }
  )
);

//trueccaller login has to be implemented in the future, but for now we will only use google login
export const truecallerLogin = (req, res) => {
  res.status(501).json({ error: "Truecaller login not implemented yet" });
};

export default passport;
