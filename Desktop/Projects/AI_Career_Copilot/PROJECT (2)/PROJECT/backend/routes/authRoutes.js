import express from "express";
import {
  registerController,
  verifyEmailController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
  getMeController,
  sendOTPController,
  verifyOTPController,
  registerOTPController,
  googleLoginController
} from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔐 Register new user + send verification email
router.post("/register", registerController);

// 🔐 Register user + send OTP
router.post("/register-otp", registerOTPController);

// 🌐 Google Sign In
router.post("/google", googleLoginController);

// ✅ Verify email (clicked from email link)
router.get("/verify-email", verifyEmailController);

// 🔑 Send OTP to email (NEW)
router.post("/send-otp", sendOTPController);

// ✅ Verify OTP and login (NEW)
router.post("/verify-otp", verifyOTPController);

// 🔑 Login with email + password (LEGACY)
router.post("/login", loginController);

// 🔒 Forgot password
router.post("/forgot-password", forgotPasswordController);

// 🔄 Reset password
router.post("/reset-password", resetPasswordController);

// 👤 Get current logged in user (protected)
router.get("/me", authMiddleware, getMeController);

export default router;