const User = require("../models/user");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const limiter = require("../utils/ratelimiter");

const registerService = async (name, email, password) => {
  await limiter.checkLimit("register", email);

  let user = await User.findOne({ email });
  if (user) {
    await limiter.increment("register", email);
    throw new Error("Email already registered");
  }

  user = new User({ name, email, password });

  await limiter.increment("register", email);

  const otp = crypto.randomInt(100000, 1000000).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  user.otp = hashedOtp;
  user.otpExpires = Date.now() + 10 * 60 * 1000;

  await user.save();

  await sendEmail({
    to: email,
    subject: "Verify your DevConnect account",
    text: `Your OTP is ${otp}`,
    html: `<h2>Your OTP is ${otp}</h2>`,
  });

  return { user };
};

const loginService = async (email, password) => {
  await limiter.checkLimit("login", email);

  const user = await User.findOne({ email });

  if (!user) {
    await limiter.increment("login", email);
    throw new Error("Invalid email or password");
  }

  if (!user.isVerified) {
    await limiter.increment("login", email);
    throw new Error("Email not verified");
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    await limiter.increment("login", email);
    throw new Error("Invalid email or password");
  }

  await limiter.clear("login", email);

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return { token, user };
};

const verifyOtpService = async (email, otp) => {
  await limiter.checkLimit("verifyOtp", email);

  const user = await User.findOne({ email });

  if (!user) {
    await limiter.increment("verifyOtp", email);
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw new Error("User already verified");
  }

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  if (user.otp !== hashedOtp) {
    await limiter.increment("verifyOtp", email);
    throw new Error("Invalid OTP");
  }

  if (user.otpExpires < Date.now()) {
    await limiter.increment("verifyOtp", email);
    throw new Error("OTP expired");
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpires = null;

  await user.save();
  await limiter.clear("verifyOtp", email);

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return { token, user };
};
const forgetPasswordService = async (email) => {
  await limiter.checkLimit("forgetPassword", email);

  const user = await User.findOne({ email });

  if (!user) {
    await limiter.increment("forgetPassword", email);
    return; // same behavior as your controller (silent success)
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  await limiter.increment("forgetPassword", email);

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  user.otp = hashedOtp;
  user.otpExpires = Date.now() + 10 * 60 * 1000;

  await user.save();

  await sendEmail({
    to: email,
    subject: "Reset your DevConnect password",
    text: `Your password reset OTP is ${otp}`,
    html: `<h2>Password Reset OTP</h2><p>${otp}</p>`,
  });
};

const resetPasswordService = async (email, otp, newPassword) => {
  await limiter.checkLimit("resetPassword", email);

  const user = await User.findOne({ email });

  if (!user) {
    await limiter.increment("resetPassword", email);
    throw new Error("Invalid request");
  }

  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

  if (!user.otp || user.otp !== hashedOtp) {
    await limiter.increment("resetPassword", email);
    throw new Error("Invalid OTP");
  }

  if (user.otpExpires < Date.now()) {
    await limiter.increment("resetPassword", email);
    throw new Error("OTP expired");
  }

  user.password = newPassword;
  user.otp = null;
  user.otpExpires = null;

  await user.save();
  await limiter.clear("resetPassword", email);

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return { token, user };
};


module.exports = {
  registerService,
  loginService,
  verifyOtpService,
  forgetPasswordService,
  resetPasswordService
};
