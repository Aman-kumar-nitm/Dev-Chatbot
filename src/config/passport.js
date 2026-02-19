const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error("Email not provided"), null);

        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          return done(null, user);
        }
         user = await User.findOne({ email });
         if (user) {
          // 🔗 Link Google account to existing user
          user.googleId = profile.id;
          user.provider = "google";
          user.isVerified = true;
          user.avatar = user.avatar || profile.photos[0]?.value;

          await user.save();
          return done(null, user);
        }
        // 3️⃣ Create new user if none exists
        user = await User.create({
          name: profile.displayName,
          email,
          googleId: profile.id,
          provider: "google",
          isVerified: true,
          avatar: profile.photos?.[0]?.value,
        });

        return done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);




module.exports = passport;
