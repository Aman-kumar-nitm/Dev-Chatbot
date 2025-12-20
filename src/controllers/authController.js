const User = require("../models/user")
const jwt = require("jsonwebtoken");
const crypto = require("crypto");//for better and unpredictable otp
const sendEmail = require("../utils/sendEmail"); // Helper to send OTP emails

// Register User
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) return res.status(409).json({success:false, message: "Email already registered" });
  
    // Create new user
    user = new User({ name, email, password });

    // Generate OTP
    const otp = crypto.randomInt(100000, 1000000).toString(); 
    const hashedOtp = crypto
  .createHash("sha256")
  .update(otp)
  .digest("hex");
    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();

    // Send OTP via email
    
    await sendEmail({
    to: email,
    subject: "Verify your DevConnect account",
    text: `Your OTP is ${otp}`,
    html: `<h2>Your OTP is ${otp}</h2>`
    });

   
    res.status(201).json({ success:true,message: "User registered. Check email for OTP verification." });
  } catch (error) {
    console.error(error);
    res.status(500).json({success:false, message: "Server error" });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success:false,message: "User not found" });

    if (user.isVerified) return res.status(400).json({success:false, message: "User already verified" });
    const hashedOtp = crypto
  .createHash("sha256")
  .update(otp)
  .digest("hex");
    if (user.otp !== hashedOtp) return res.status(400).json({ success:false,message: "Invalid OTP" });
    if (user.otpExpires < Date.now()) return res.status(400).json({success:false, message: "OTP expired" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

  res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

res.status(200).json({
  success: true,
  message: "Email verified successfully",
  user: { id: user._id, name: user.name, email: user.email },
});
    
  } catch (error) {
    console.error(error);
    res.status(500).json({success:false, message: "Unable to register" });
  }
};

// Login User
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({success:false, message: "Invalid email or password" });

    if (!user.isVerified) return res.status(400).json({success:false, message: "Email not verified" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({success:false, message: "Invalid email or password" });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only https in production
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({success:true, message: "Login successful", user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({success:false, message: "Server error" });
  }
};

// Logout User
const logout = (req, res) => {
  res.cookie("token", "", { maxAge: 0 });
  res.status(200).json({success:true, message: "Logged out successfully" });
};


const checkAuth=async(req,res)=>{
try {
    const userId=req.user._id;
    // find user with this id and send
    const user=await User.findOne({_id:userId});
    res.json({success:true,user});

} catch (error) {
    return res.status(401).json({
  success: false,
  message: "Not authenticated"
});

}
} 

const forgetPassword = async (req, res) => {
  try {
    console.log(1);
    const { email } = req.body;

    const user = await User.findOne({ email });

    // 🔒 Optional security (recommended)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "User is not registered or Email is wrong",
      });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    const hashedOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendEmail({
      to: email,
      subject: "Reset your DevConnect password",
      text: `Your password reset OTP is ${otp}`,
      html: `<h2>Password Reset OTP</h2><p>${otp}</p>`,
    });

    res.status(200).json({
      success: true,
      message: "If the email exists, an OTP has been sent",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Unable to process request",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
      });
    }

    const hashedOtp = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    if (!user.otp || user.otp !== hashedOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // 🔐 Overwrite password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    // ✅ AUTO LOGIN AFTER RESET
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  }
};

const getMe=async(req,res)=>{
   res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    avatar: req.user.avatar,
    tokenBalance: req.user.tokenBalance
  });
}
module.exports={login,logout,register,verifyOtp,checkAuth,forgetPassword,resetPassword,getMe}
