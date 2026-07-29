import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

// ✅ FIX 1: correct function name
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
});

// ✅ FIX 2: use correct env variable name
let twilioClient = null;
if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER
) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

export const sendOTP = async (identifier, otp) => {
  const isEmail = identifier.includes('@');

  // If delivery services aren't configured, don't crash auth flow.
  // AuthController will still create OTP and return a response.
  const canSendEmail = Boolean(process.env.SMTP_EMAIL && process.env.SMTP_PASS);

  if (isEmail) {
    if (!canSendEmail) {
      console.warn('⚠️ SMTP not configured. Skipping OTP email send.');
      return { delivered: false, channel: 'email' };
    }

    const mailOptions = {
      from: `"ResumeMatch OTP" <${process.env.SMTP_EMAIL || 'noreply@resumematch.com'}>`,
      to: identifier,
      subject: 'Your Verification OTP Code',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>OTP Verification</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2563eb;">Your OTP Code</h2>
    <div style="background: #f8fafc; padding: 30px; text-align: center; border-radius: 8px; border: 2px solid #e2e8f0;">
      <h1 style="font-size: 48px; font-weight: bold; color: #1e293b; letter-spacing: 5px; margin: 0;">${otp}</h1>
    </div>
    <p style="margin-top: 20px;">This code will expire in <strong>5 minutes</strong>.</p>
    <p>If you didn't request this, please ignore this email.</p>
  </div>
</body>
</html>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email OTP sent to ${identifier}`);
      return { delivered: true, channel: 'email' };
    } catch (err) {
      console.error('❌ Failed to send OTP email:', err?.message || err);
      return { delivered: false, channel: 'email' };
    }
  } else {
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
      console.warn('⚠️ Twilio not configured. Skipping OTP SMS send.');
      return { delivered: false, channel: 'sms' };
    }

    try {
      await twilioClient.messages.create({
        body: `ResumeMatch OTP: ${otp}. Expires in 5 minutes. Do not share.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: identifier,
      });

      console.log(`✅ SMS OTP sent to ${identifier}`);
      return { delivered: true, channel: 'sms' };
    } catch (err) {
      console.error('❌ Failed to send OTP SMS:', err?.message || err);
      return { delivered: false, channel: 'sms' };
    }
  }
};
