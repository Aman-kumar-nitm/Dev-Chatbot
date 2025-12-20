const express = require("express");
const jwt = require("jsonwebtoken");
const authRouter = express.Router();
const passport = require("passport");
const  {login,logout,register,verifyOtp,checkAuth,forgetPassword,resetPassword,getMe}= require("../controllers/authController");
const authenticate = require("../middlewares/authMiddleware");
authRouter.get("/me",authenticate(),getMe);
authRouter.post("/register", register);
authRouter.post("/verify-otp",verifyOtp);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/check",authenticate("Dev-pro"),checkAuth);
authRouter.post("/forgetPassword",forgetPassword)
authRouter.post("/resetPassword",resetPassword)
authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.redirect("http://localhost:5173/app");
  }
);
module.exports=authRouter;