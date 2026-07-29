import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  identifier: {
    type: String, // email or phone
    required: true
  },
  otp: {
    type: String, // hashed OTP
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  }
});

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;