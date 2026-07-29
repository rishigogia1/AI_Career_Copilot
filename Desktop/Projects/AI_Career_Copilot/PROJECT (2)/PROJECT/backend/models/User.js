import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      minlength: 6
    },

    avatar: {
      type: String,
      default: null  // 🔹 Profile picture URL
    },

    isVerified: {
      type: Boolean,
      default: false  // 🔹 Account inactive until email verified
    },

    verificationToken: {
      type: String,
      default: null  // 🔹 Token sent in verification email
    },

    verificationTokenExpiry: {
      type: Date,
      default: null  // 🔹 Token expires in 24 hours
    },

    resetPasswordToken: {
      type: String,
      default: null  // 🔹 For forgot password (optional but good)
    },

    resetPasswordExpiry: {
      type: Date,
      default: null
    },

    otp: {
      type: String,
      default: null  // 🔹 OTP for login
    },

    otpExpiry: {
      type: Date,
      default: null  // 🔹 OTP expires in 5 minutes
    },

    otpAttempts: {
      type: Number,
      default: 0  // 🔹 Track failed OTP attempts
    },

    loginProvider: {
      type: String,
      enum: ["otp", "google"],
      default: "otp"
    },

    lastLogin: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true  // 🔹 Adds createdAt + updatedAt automatically
  }
);

// 🔹 Hash password before saving (VERY IMPORTANT)
userSchema.pre("save", async function (next) {
  // Only hash if password was modified
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔹 Method to compare passwords during login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;