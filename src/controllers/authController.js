const normalizeEmail = require("../utils/emailUtil");
const { setAuthCookie, clearAuthCookie } = require("../utils/cookieUtil");
const {
  registerService,
  loginService,
  verifyOtpService,
  forgetPasswordService,
  resetPasswordService
} = require("../Services/authServices");

const register = async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);

    await registerService(name, email, password);

    res.status(201).json({
      success: true,
      message: "User registered. Check email for OTP verification.",
    });
  } catch (error) {
    handleError(error, res);
  }
};

const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    const { token, user } = await loginService(email, password);

    setAuthCookie(res, token);

    res.json({
      success: true,
      message: "Login successful",
      user,
    });
  } catch (error) {
    handleError(error, res);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp } = req.body;

    const { token, user } = await verifyOtpService(email, otp);

    setAuthCookie(res, token);

    res.json({
      success: true,
      message: "Email verified successfully",
      user,
    });
  } catch (error) {
    handleError(error, res);
  }
};

const forgetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    await forgetPasswordService(email);

    res.status(200).json({
      success: true,
      message: "If the email exists, an OTP has been sent",
    });
  } catch (error) {
    handleError(error, res);
  }
};

const resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp, newPassword } = req.body;

    const { token, user } = await resetPasswordService(
      email,
      otp,
      newPassword
    );

    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
};


const logout = (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, message: "Logged out successfully" });
};

const checkAuth = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }
};

const getMe = async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    avatar: req.user.avatar,
    tokenBalance: req.user.tokenBalance,
  });
};


const handleError = (error, res) => {
  if (error.message.includes("Too many attempts")) {
    return res.status(429).json({ success: false, message: error.message });
  }

  if (
    error.message === "Invalid email or password" ||
    error.message === "Email already registered" ||
    error.message === "Email not verified" ||
    error.message.includes("OTP")
  ) {
    return res.status(400).json({ success: false, message: error.message });
  }

  res.status(500).json({ success: false, message: "Server error" });
};

module.exports = { register, login, verifyOtp, logout ,forgetPassword, resetPassword , checkAuth , getMe};
