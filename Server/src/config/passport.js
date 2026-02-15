import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma.js";
import { generateToken } from "../utils/jwt.js";
import { GOOGLE_CALLBACK_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "./env.js";

passport.use(
  new GoogleStrategy(
    {
      clientID:GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || profile.name?.givenName || "User";
        if (!email) {
          return done(new Error("Google did not provide an email"), null);
        }

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

          try {
            await prisma.userStats.create({
              data: { userId: user.id }
            });
          } catch (statsErr) {
            if (statsErr.code !== "P2002") throw statsErr;
          }
        }

        const token = generateToken(user);

        return done(null, { user, token });

      } catch (error) {
        return done(error, null);
      }
    }
  )
);


export const truecallerLogin = (req, res) => {
  res.status(501).json({ error: "Truecaller login not implemented yet" });
};

export default passport;
