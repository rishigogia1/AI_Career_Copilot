import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import { inMemoryDB, saveInMemoryDB } from "../config/db.js";
import nodemailer from "nodemailer";
import axios from "axios";
import { generateOTP } from "../utils/generateOTP.js";
import { sendOTP } from "../utils/sendOTP.js";

// 🔹 Demo mode storage (when MongoDB is unavailable)
const demoUsers = new Map();
const demoOTPs = new Map();

// 🔹 Generate a deterministic, stable MongoDB ObjectId from an email.
// This ensures the same user always gets the same _id when using OTP flow,
// preventing duplicate user documents across multiple OTP sign-up attempts.
const getDeterministicUserId = (email) => {
  const hash = crypto.createHash("md5").update(email.toLowerCase().trim()).digest("hex");
  // MongoDB ObjectId is 24 hex chars — take the first 24 chars of the md5 hash
  return new mongoose.Types.ObjectId(hash.substring(0, 24));
};


// 🔹 Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
});

// 🔹 Send verification email helper
const sendVerificationEmail = async (email, token, name) => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"AI Career Copilot" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: "Verify Your Email — AI Career Copilot",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <h2 style="color: #6366f1;">Welcome to AI Career Copilot 🚀</h2>
        
        <p>Hi ${name},</p>
        
        <p>Thanks for signing up! Please verify your email address to activate your account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background: #6366f1; color: white; padding: 12px 30px; 
                    border-radius: 8px; text-decoration: none; font-weight: bold;">
            Verify Email
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This link expires in 24 hours. If you didn't create an account, ignore this email.
        </p>

        <p style="color: #666; font-size: 12px;">
          Or copy this link: ${verificationLink}
        </p>
        
      </body>
      </html>
    `
  });
};

// 🔹 Send password reset email helper
const sendResetEmail = async (email, token, name) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"AI Career Copilot" <${process.env.SMTP_EMAIL}>`,
    to: email,
    subject: "Reset Your Password — AI Career Copilot",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <h2 style="color: #6366f1;">Password Reset Request</h2>
        
        <p>Hi ${name},</p>
        
        <p>We received a request to reset your password. Click the button below to proceed.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background: #6366f1; color: white; padding: 12px 30px; 
                    border-radius: 8px; text-decoration: none; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This link expires in 1 hour. If you didn't request this, ignore this email.
        </p>
        
      </body>
      </html>
    `
  });
};

// ─────────────────────────────────────────
// 🔐 REGISTER
// ─────────────────────────────────────────
export const registerController = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 🔹 Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    // 🔹 Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // If exists but not verified → resend verification
      if (!existingUser.isVerified) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

        existingUser.verificationToken = token;
        existingUser.verificationTokenExpiry = expiry;
        await existingUser.save();

        await sendVerificationEmail(email, token, existingUser.name);

        return res.status(200).json({
          message: "Verification email resent. Please check your inbox."
        });
      }

      return res.status(400).json({
        message: "Email already registered. Please login."
      });
    }

    // 🔹 Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 🔹 Create user (password auto-hashed by model)
    const user = await User.create({
      name,
      email,
      password,
      verificationToken,
      verificationTokenExpiry,
      isVerified: false
    });

    // 🔹 Send verification email
    await sendVerificationEmail(email, verificationToken, name);

    res.status(201).json({
      message: "Account created! Please check your email to verify your account."
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// ✅ VERIFY EMAIL
// ─────────────────────────────────────────
export const verifyEmailController = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Verification token missing" });
    }

    // 🔹 Find user with this token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() } // not expired
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification link. Please register again."
      });
    }

    // 🔹 Activate account
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    res.json({
      message: "Email verified successfully! You can now login."
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// 🔑 LOGIN
// ─────────────────────────────────────────
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔹 Validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // 🔹 Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "No account found with this email. Please register."
      });
    }

    // 🔹 Check if verified
    if (!user.isVerified) {
      return res.status(400).json({
        message: "Please verify your email before logging in. Check your inbox."
      });
    }

    // 🔹 Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect password. Please try again."
      });
    }

    // 🔹 Generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        name: user.name,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// 🔒 FORGOT PASSWORD
// ─────────────────────────────────────────
export const forgotPasswordController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    // 🔹 Don't reveal if email exists (security best practice)
    if (!user) {
      return res.json({
        message: "If this email exists, a reset link has been sent."
      });
    }

    // 🔹 Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetExpiry;
    await user.save();

    await sendResetEmail(email, resetToken, user.name);

    res.json({
      message: "If this email exists, a reset link has been sent."
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// 🔄 RESET PASSWORD
// ─────────────────────────────────────────
export const resetPasswordController = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and new password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    // 🔹 Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset link. Please request a new one."
      });
    }

    // 🔹 Update password (pre-save hook will hash it)
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    res.json({
      message: "Password reset successful. You can now login."
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// 👤 GET CURRENT USER
// ─────────────────────────────────────────
export const getMeController = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password -verificationToken -resetPasswordToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// 📧 SEND OTP (NEW)
// ─────────────────────────────────────────
export const sendOTPController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // 🔹 Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // 🔹 Try to save to MongoDB, fall back to demo mode
    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: "Account not found. Please sign up first." });
      }

      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.otpAttempts = 0;
      await user.save();

    } catch (dbError) {
      // 🔹 Fall back to demo mode (in-memory)
      console.log("⚠️ Using demo mode for OTP (MongoDB unavailable)");
      const demoUser = inMemoryDB.users.find(u => u.email === email);
      if (!demoUser) {
        return res.status(404).json({ message: "Account not found. Please sign up first." });
      }
      demoOTPs.set(email, { otp, otpExpiry, attempts: 0 });
    }

    // 🔹 Send OTP via email
    await sendOTP(email, otp);

    res.json({
      message: "OTP sent to your email. Valid for 5 minutes.",
      email,
      demo: process.env.NODE_ENV !== 'production' ? `🧪 Demo Mode: OTP is ${otp}` : undefined
    });

  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// ✅ VERIFY OTP & LOGIN (NEW)
// ─────────────────────────────────────────
export const verifyOTPController = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    if (otp.length !== 6) {
      return res.status(400).json({ message: "OTP must be 6 digits" });
    }

    let user;
    let isDemoMode = false;

    // 🔹 Try to find user in MongoDB
    try {
      user = await User.findOne({ email });
    } catch (dbError) {
      // 🔹 Fall back to demo mode
      isDemoMode = true;
      console.log("⚠️ Using demo mode for OTP verification");
      
      const demoOTP = demoOTPs.get(email);
      if (!demoOTP) {
        return res.status(400).json({
          message: "No OTP found. Please request a new one."
        });
      }

      // Check OTP expiry
      if (new Date() > demoOTP.otpExpiry) {
        demoOTPs.delete(email);
        return res.status(400).json({
          message: "OTP expired. Please request a new one."
        });
      }

      // Check attempts
      if (demoOTP.attempts >= 3) {
        demoOTPs.delete(email);
        return res.status(400).json({
          message: "Too many wrong attempts. Please request a new OTP."
        });
      }

      // Verify OTP
      if (demoOTP.otp !== otp) {
        demoOTP.attempts += 1;
        return res.status(400).json({
          message: `Incorrect OTP. ${3 - demoOTP.attempts} attempts remaining.`
        });
      }

      // OTP verified!
      demoOTPs.delete(email);
      
      // Create or reuse a demo user object
      let savedDemoUser = inMemoryDB.users.find(u => u.email === email);
      if (!savedDemoUser) {
        savedDemoUser = {
          _id: new mongoose.Types.ObjectId().toString(),
          name: email.split("@")[0],
          email: email,
          avatar: null,
          loginProvider: "otp",
          lastLogin: new Date()
        };
        inMemoryDB.users.push(savedDemoUser);
        saveInMemoryDB();
      } else {
        savedDemoUser.lastLogin = new Date();
        saveInMemoryDB();
      }
      user = savedDemoUser;
      
      // Ensure demo profile exists
      let demoProfile = inMemoryDB.profiles.find(p => p.userId === user._id);
      if (!demoProfile) {
        demoProfile = {
          userId: user._id,
          fullName: user.name,
          targetRole: "",
          careerGoal: "Software Engineer",
          college: "",
          graduationYear: "",
          linkedin: "",
          github: "",
          portfolio: "",
          bio: "",
          profilePicture: "",
          onboardingComplete: false
        };
        inMemoryDB.profiles.push(demoProfile);
        saveInMemoryDB();
      }
    }

    if (!isDemoMode && !user) {
      return res.status(400).json({
        message: "No account found. Please check your email."
      });
    }

    if (!isDemoMode) {
      // 🔹 Check if OTP expired (MongoDB mode)
      if (!user.otpExpiry || new Date() > user.otpExpiry) {
        return res.status(400).json({
          message: "OTP expired. Please request a new one."
        });
      }

      // 🔹 Check OTP attempts (max 3)
      if (user.otpAttempts >= 3) {
        return res.status(400).json({
          message: "Too many wrong attempts. Please request a new OTP."
        });
      }

      // 🔹 Verify OTP
      if (user.otp !== otp) {
        user.otpAttempts += 1;
        await user.save();
        
        return res.status(400).json({
          message: `Incorrect OTP. ${3 - user.otpAttempts} attempts remaining.`
        });
      }

      // ✅ OTP verified! Mark user as verified, clear OTP, update login metrics
      user.isVerified = true;
      user.otp = null;
      user.otpExpiry = null;
      user.otpAttempts = 0;
      user.loginProvider = "otp";
      user.lastLogin = new Date();
      await user.save();

      // Ensure profile exists
      let profile = await Profile.findOne({ userId: user._id });
      if (!profile) {
        await Profile.create({
          userId: user._id,
          fullName: user.name,
          targetRole: "",
          careerGoal: "Software Engineer",
          college: "",
          graduationYear: "",
          linkedin: "",
          github: "",
          portfolio: "",
          bio: "",
          profilePicture: user.avatar || "",
          onboardingComplete: false
        });
      }
    }

    // 🔹 Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        name: user.name,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(`\n========================================\n[AUTH] Login Success\nEmail: ${user.email}\nUserId: ${user._id}\nWorkspace: appState_${user._id}\n========================================\n`);

    res.json({
      message: "✅ Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        loginProvider: user.loginProvider,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// 📧 REGISTER OTP (NEW)
// ─────────────────────────────────────────
export const registerOTPController = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    try {
      let user = await User.findOne({ email });
      if (user && user.isVerified) {
        return res.status(400).json({ message: "Email is already registered. Please sign in instead." });
      }

      if (!user) {
        user = await User.create({
          _id: getDeterministicUserId(email),
          name,
          email,
          password: crypto.randomBytes(16).toString("hex"),
          isVerified: false,
          loginProvider: "otp"
        });
      } else {
        user.name = name;
      }

      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.otpAttempts = 0;
      await user.save();
    } catch (dbError) {
      console.log("⚠️ Using demo mode for Register OTP (MongoDB unavailable)");
      demoOTPs.set(email, { otp, otpExpiry, attempts: 0 });
      let demoUser = inMemoryDB.users.find(u => u.email === email);
      if (!demoUser) {
        demoUser = {
          _id: new mongoose.Types.ObjectId().toString(),
          name,
          email,
          isVerified: false
        };
        inMemoryDB.users.push(demoUser);
        saveInMemoryDB();
      } else {
        demoUser.name = name;
        saveInMemoryDB();
      }
    }

    await sendOTP(email, otp);

    res.json({
      message: "OTP sent to your email. Valid for 5 minutes.",
      email,
      demo: process.env.NODE_ENV !== 'production' ? `🧪 Demo Mode: OTP is ${otp}` : undefined
    });
  } catch (error) {
    console.error("Register OTP Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────
// 🌐 GOOGLE SIGN-IN (NEW)
// ─────────────────────────────────────────
export const googleLoginController = async (req, res) => {
  try {
    const { idToken, email, name, avatar, isSignUp } = req.body;
    if (!idToken && !email) {
      return res.status(400).json({ message: "Google ID token or email is required" });
    }

    let userEmail = email;
    let userName = name;
    let userAvatar = avatar;

    // Verify token with Google's API if token is provided
    if (idToken) {
      try {
        const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (response.data && response.data.email) {
          userEmail = response.data.email;
          userName = response.data.name || userName;
          userAvatar = response.data.picture || userAvatar;
        }
      } catch (err) {
        console.warn("Failed to verify Google token via API, falling back to request body:", err.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({ message: "Invalid token or email missing" });
    }

    let user;
    let isInMemory = false;

    try {
      user = await User.findOne({ email: userEmail });
      
      if (isSignUp) {
        if (user) {
          return res.status(400).json({ message: "Account already exists. Please sign in instead." });
        }
        // Create user
        user = await User.create({
          name: userName || userEmail.split("@")[0],
          email: userEmail,
          password: crypto.randomBytes(16).toString("hex"),
          avatar: userAvatar || null,
          isVerified: true,
          loginProvider: "google",
          lastLogin: new Date()
        });
      } else {
        // Sign In Flow (isSignUp is false/undefined)
        if (!user) {
          return res.status(400).json({ message: "Account not found. Please create an account first." });
        }
        user.loginProvider = "google";
        user.lastLogin = new Date();
        if (userAvatar && !user.avatar) {
          user.avatar = userAvatar;
        }
        await user.save();
      }

      // Ensure profile exists
      let profile = await Profile.findOne({ userId: user._id });
      if (!profile) {
        await Profile.create({
          userId: user._id,
          fullName: user.name,
          targetRole: "",
          careerGoal: "Software Engineer",
          college: "",
          graduationYear: "",
          linkedin: "",
          github: "",
          portfolio: "",
          bio: "",
          profilePicture: user.avatar || "",
          onboardingComplete: false
        });
      }
    } catch (dbError) {
      isInMemory = true;
      console.log("⚠️ Using demo mode for Google Login");
      
      // Check in memory users
      user = inMemoryDB.users.find(u => u.email === userEmail);
      if (isSignUp) {
        if (user) {
          return res.status(400).json({ message: "Account already exists. Please sign in instead." });
        }
        user = {
          _id: new mongoose.Types.ObjectId().toString(),
          name: userName || userEmail.split("@")[0],
          email: userEmail,
          avatar: userAvatar || null,
          isVerified: true,
          loginProvider: "google",
          lastLogin: new Date()
        };
        inMemoryDB.users.push(user);
        saveInMemoryDB();
      } else {
        if (!user) {
          return res.status(400).json({ message: "Account not found. Please create an account first." });
        }
        user.loginProvider = "google";
        user.lastLogin = new Date();
        saveInMemoryDB();
      }

      // Check/create demo profile
      let demoProfile = inMemoryDB.profiles.find(p => p.userId === user._id);
      if (!demoProfile) {
        demoProfile = {
          userId: user._id,
          fullName: user.name,
          targetRole: "",
          careerGoal: "Software Engineer",
          college: "",
          graduationYear: "",
          linkedin: "",
          github: "",
          portfolio: "",
          bio: "",
          profilePicture: user.avatar || "",
          onboardingComplete: false
        };
        inMemoryDB.profiles.push(demoProfile);
        saveInMemoryDB();
      }
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        name: user.name,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log(`\n========================================\n[AUTH] Google Login Success\nEmail: ${user.email}\nUserId: ${user._id}\nWorkspace: appState_${user._id}\n========================================\n`);

    res.json({
      message: "✅ Google Sign In successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        loginProvider: "google"
      }
    });

  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ message: error.message });
  }
};