import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import API from "@/api/api"; 

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get("token");

        if (!token) {
          setStatus("error");
          setMessage("Verification link is invalid or missing.");
          return;
        }

        const res = await API.get(`/auth/verify-email?token=${token}`);

        setStatus("success");
        setMessage(res.data.message || "Email verified successfully!");

      } catch (err: unknown) {
        const errObj = err as { response?: { data?: { message?: string } } };
        setStatus("error");
        setMessage(
          errObj?.response?.data?.message ||
          "Verification failed. Link may be expired or invalid."
        );
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">AI Career Copilot</h1>
          <p className="text-muted-foreground text-sm mt-1">Your intelligent job search assistant</p>
        </div>

        <div className="glass-card rounded-2xl p-8">

          {/* LOADING */}
          {status === "loading" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-4"
            >
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <h2 className="text-lg font-semibold text-foreground">
                Verifying your email...
              </h2>
              <p className="text-sm text-muted-foreground">
                Please wait a moment.
              </p>
            </motion.div>
          )}

          {/* SUCCESS */}
          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>

              <h2 className="text-lg font-semibold text-foreground">
                Email Verified!
              </h2>

              <p className="text-sm text-muted-foreground">
                {message}
              </p>

              <Button
                onClick={() => navigate("/auth")}
                className="w-full h-12 gradient-primary text-primary-foreground font-medium"
              >
                Continue to Login
              </Button>
            </motion.div>
          )}

          {/* ERROR */}
          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>

              <h2 className="text-lg font-semibold text-foreground">
                Verification Failed
              </h2>

              <p className="text-sm text-muted-foreground">
                {message}
              </p>

              <Button
                onClick={() => navigate("/auth")}
                className="w-full h-12 gradient-primary text-primary-foreground font-medium"
              >
                Back to Login
              </Button>
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;