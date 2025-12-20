const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: function () {
    return this.provider === "local";
  },
    minlength: 6,
    match: [/(?=.*[!@#$%^&*])/, "Password must contain at least one special character"],
  },
  role: {
  type: String,
  enum: ["user", "Dev-Pro"],
  default: "user",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  lastLogin: {
    type: Date,
  },
  googleId: {
  type: String,
  },
  githubId: {
  type: String,
},
provider: {
  type: String,
  enum: ["local", "google", "github"],
  default: "local",
},
avatar: {
  type: String,
},
  tokenBalance: {
      type: Number,
      default: 1000
    }

}, { timestamps: true });

//otp deletion logic keep eyes on that 

// Hash password
userSchema.pre("save", async function () {
  if (!this.isModified("password")|| !this.password) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});


// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
