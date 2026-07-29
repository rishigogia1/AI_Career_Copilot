import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, RefreshCw, Mail, Lock, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import API from "@/api/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { auth as firebaseAuth, googleProvider, isFirebaseConfigured } from "../lib/firebase";
import { signInWithRedirect, getRedirectResult } from "firebase/auth";

const AuthPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // 🔹 Sub-flows: "signin" | "signup"
  const [flow, setFlow] = useState<"signin" | "signup">("signin");
  // 🔹 Steps: email → otp-verification
  const [step, setStep] = useState<"email" | "otp-verification">("email");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(false);

  // ─────────────────────────────────────────
  // ⏱️ OTP Timer
  // ─────────────────────────────────────────
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && step === "otp-verification") {
      setCanResendOtp(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpTimer, step]);

  // ─────────────────────────────────────────
  // 🌐 Handle Google Redirect Result on mount
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured || !firebaseAuth) return;

    getRedirectResult(firebaseAuth)
      .then(async (result) => {
        if (!result) return; // No redirect in progress
        const idToken = await result.user.getIdToken();
        const res = await API.post("/auth/google", {
          idToken,
          email: result.user.email,
          name: result.user.displayName,
          avatar: result.user.photoURL,
          isSignUp: flow === "signup"
        });
        login(res.data.user, res.data.token);
        toast.success(`Welcome, ${res.data.user.name}!`);
        navigate("/dashboard");
      })
      .catch((err) => {
        if (err?.code === "auth/no-auth-event") return; // Not a redirect
        console.error("Google Redirect Error:", err);
        if (err?.message) {
          setError(err.message);
          toast.error("Google login failed");
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────
  // 📧 SEND OTP (Sign In / Sign Up)
  // ─────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    if (flow === "signup" && !name.trim()) {
      setError("Please enter your full name");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      let res;
      if (flow === "signup") {
        // Create Account Flow
        res = await API.post("/auth/register-otp", { name: name.trim(), email: email.trim() });
      } else {
        // Sign In Flow
        res = await API.post("/auth/send-otp", { email: email.trim() });
      }

      setSuccess(res.data.message);
      setStep("otp-verification");
      setOtpTimer(300); // 5 minutes
      setCanResendOtp(false);

      if (res.data.demo) {
        toast.info(res.data.demo, { duration: 10000 });
      }

    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send verification code");
      toast.error(err?.response?.data?.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // ✅ VERIFY OTP & LOGIN
  // ─────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (!otp) {
      setError("Please enter the OTP");
      return;
    }

    if (otp.length !== 6) {
      setError("OTP must be 6 digits");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await API.post("/auth/verify-otp", { email: email.trim(), otp });

      // ✅ Login globally via AuthContext
      login(res.data.user, res.data.token);

      toast.success(flow === "signup" ? "Account created successfully!" : "Logged in successfully!");
      navigate("/dashboard");

    } catch (err: any) {
      setError(err?.response?.data?.message || "OTP verification failed");
      toast.error(err?.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // 🔄 RESEND OTP
  // ─────────────────────────────────────────
  const handleResendOTP = async () => {
    if (!canResendOtp) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      let res;
      if (flow === "signup") {
        res = await API.post("/auth/register-otp", { name: name.trim(), email: email.trim() });
      } else {
        res = await API.post("/auth/send-otp", { email: email.trim() });
      }

      setSuccess(res.data.message);
      setOtpTimer(300); // 5 minutes
      setCanResendOtp(false);
      setOtp("");

      if (res.data.demo) {
        toast.info(res.data.demo, { duration: 10000 });
      }

    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // 🌐 GOOGLE SIGN-IN (redirect flow — avoids popup-blocked)
  // ─────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured) {
      toast.error("Google Authentication is not configured.");
      return;
    }
    if (!firebaseAuth || !googleProvider) {
      toast.error("Firebase is not initialized.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      // Redirect to Google's OAuth page — browser navigates away and returns with result.
      // getRedirectResult() in the mount useEffect picks up the result on return.
      await signInWithRedirect(firebaseAuth, googleProvider);
      // Control flow ends here — page will reload after redirect
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError(err?.response?.data?.message || err?.message || "Google Authentication failed");
      toast.error(err?.response?.data?.message || "Google login failed");
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-[#f8f9fa] relative overflow-hidden select-none font-sans">
      {/* Sleek Radial Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] px-6 z-10"
      >
        {/* LOGO & TITLE */}
        <div className="text-center mb-8">
          <motion.div
            className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            animate={{ rotate: [0, 90, 180, 270, 360] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-b from-[#ffffff] to-[#a3a3a3] bg-clip-text text-transparent">
            AI Career Copilot
          </h1>
          <p className="text-sm text-neutral-400 mt-1.5 font-normal">
            Your intelligence-backed career advancement suite
          </p>
        </div>

        {/* AUTH BOX */}
        <div className="bg-[#0c0c0e] border border-neutral-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative">
          
          {step === "email" && (
            <>
              {/* Google Button (Primary Action) */}
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                variant="outline"
                className="w-full h-10.5 bg-transparent border-neutral-800 text-white hover:bg-[#121214] hover:text-white font-medium text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="relative my-5 flex items-center">
                <div className="flex-grow border-t border-neutral-800/80"></div>
                <span className="flex-shrink mx-3 text-[9px] text-neutral-500 uppercase tracking-widest font-semibold">
                  OR
                </span>
                <div className="flex-grow border-t border-neutral-800/80"></div>
              </div>

              {/* TAB BUTTONS (Secondary Actions) */}
              <div className="flex bg-[#16161a] p-1 rounded-lg border border-neutral-800/60 mb-6">
                <button
                  onClick={() => { setFlow("signin"); setError(""); setSuccess(""); }}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all duration-200 ${
                    flow === "signin"
                      ? "bg-[#27272a] text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setFlow("signup"); setError(""); setSuccess(""); }}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all duration-200 ${
                    flow === "signup"
                      ? "bg-[#27272a] text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Create Account
                </button>
              </div>
            </>
          )}

          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">
                    {flow === "signin" ? "Welcome back" : "Get started"}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    {flow === "signin" 
                      ? "Enter your email to receive a passwordless sign-in code." 
                      : "Create your workspace account using email."}
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Name field for Sign Up */}
                  {flow === "signup" && (
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 w-4.5 h-4.5 text-neutral-500" />
                      <Input
                        placeholder="Full Name"
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setError("");
                          setSuccess("");
                        }}
                        disabled={loading}
                        className="h-10.5 pl-10 bg-[#121214] border-neutral-800 text-white focus:border-neutral-700 focus:ring-0 text-sm placeholder:text-neutral-600 rounded-lg"
                      />
                    </div>
                  )}

                  {/* Email field */}
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4.5 h-4.5 text-neutral-500" />
                    <Input
                      placeholder="name@example.com"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                        setSuccess("");
                      }}
                      onKeyPress={(e) => e.key === "Enter" && handleSendOTP()}
                      disabled={loading}
                      className="h-10.5 pl-10 bg-[#121214] border-neutral-800 text-white focus:border-neutral-700 focus:ring-0 text-sm placeholder:text-neutral-600 rounded-lg"
                    />
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-rose-500 font-medium"
                    >
                      {error}
                    </motion.p>
                  )}

                  <Button
                    onClick={handleSendOTP}
                    disabled={loading || !email || (flow === "signup" && !name)}
                    className="w-full h-10.5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-lg transition-all flex items-center justify-center shadow-md cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="otp-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">Verify email</h2>
                  <p className="text-xs text-neutral-400">
                    We sent a 6-digit confirmation code to: <br />
                    <span className="font-semibold text-neutral-200">{email}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4.5 h-4.5 text-neutral-500" />
                    <Input
                      placeholder="000000"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, ""));
                        setError("");
                      }}
                      onKeyPress={(e) => e.key === "Enter" && handleVerifyOTP()}
                      disabled={loading}
                      className="h-10.5 pl-10 text-center text-base font-bold tracking-[0.3em] bg-[#121214] border-neutral-800 text-white focus:border-neutral-700 focus:ring-0 rounded-lg placeholder:tracking-normal placeholder:font-normal placeholder:text-neutral-700"
                    />
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-rose-500 font-medium"
                    >
                      {error}
                    </motion.p>
                  )}

                  <Button
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="w-full h-10.5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-md"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Confirm Code
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </>
                    )}
                  </Button>

                  {/* Timer & Resend */}
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 px-0.5">
                    <span>
                      Expires in: <span className="font-semibold text-neutral-300">{formatTime(otpTimer)}</span>
                    </span>
                    <button
                      onClick={handleResendOTP}
                      disabled={!canResendOtp || loading}
                      className={`font-semibold transition-all ${
                        canResendOtp
                          ? "text-indigo-400 hover:text-indigo-300 cursor-pointer"
                          : "text-neutral-600 cursor-not-allowed"
                      }`}
                    >
                      Resend code
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                    setError("");
                    setSuccess("");
                  }}
                  className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 transition-colors py-1.5"
                >
                  ← Use different email
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER TERMS */}
        <p className="text-center text-[10px] text-neutral-600 mt-6 leading-relaxed">
          By signing in, you agree to our Terms of Service <br /> and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;