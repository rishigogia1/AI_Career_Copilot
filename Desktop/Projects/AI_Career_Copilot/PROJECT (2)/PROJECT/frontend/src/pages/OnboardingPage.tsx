import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ArrowLeft, RefreshCw, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import API from "@/api/api";
import { toast } from "sonner";

const CAREER_GOAL_OPTIONS = [
  "Software Engineer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "ML Engineer",
  "Cybersecurity Analyst",
  "Custom"
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || "guest";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [targetRole, setTargetRole] = useState("");
  const [careerGoal, setCareerGoal] = useState("Software Engineer");
  const [college, setCollege] = useState("");
  const [graduationYear, setGraduationYear] = useState("");

  // Check onboarding status on mount
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const res = await API.get("/profile");
        const data = res.data;
        if (data.onboardingComplete === true) {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Failed to check profile status on mount:", err);
      }
    };
    checkProfile();
  }, [navigate]);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      setLoading(true);

      const profileData = {
        targetRole: targetRole.trim(),
        careerGoal,
        college: college.trim(),
        graduationYear: graduationYear.trim(),
        onboardingComplete: true
      };

      const res = await API.put("/profile", profileData);
      const updatedProfile = res.data.profile;

      // Update the user-scoped profile cache
      localStorage.setItem(`profileCache_${userId}`, JSON.stringify(updatedProfile));

      // Also set the global "profile" key if other legacy components still check it fallback-style
      localStorage.setItem("profile", JSON.stringify(updatedProfile));

      toast.success("Onboarding completed!");
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Failed to complete onboarding:", err);
      toast.error("Unable to save your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => String(currentYear - 2 + i));

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-[#f8f9fa] relative overflow-hidden select-none font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]" />
      
      <div className="w-full max-w-[500px] px-6 z-10 py-12">
        {/* STEP PROGRESS */}
        <div className="flex items-center justify-between mb-8 px-2">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center flex-1 last:flex-initial">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                step >= stepNumber 
                  ? "bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-500"
              }`}>
                {stepNumber}
              </div>
              {stepNumber < 4 && (
                <div className={`h-[2px] flex-grow mx-3 transition-all duration-300 ${
                  step > stepNumber ? "bg-indigo-600" : "bg-neutral-900"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* CONTAINER CARD */}
        <div className="bg-[#0c0c0e] border border-neutral-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Target Role & Career Goal */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <div className="text-xs font-semibold text-indigo-400 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Step 1 of 4
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Define your goal</h2>
                  <p className="text-sm text-neutral-400">
                    What is the job role and career path you are targeting?
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Target Job Role</label>
                    <Input
                      placeholder="e.g. Senior Software Engineer"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="h-11 bg-[#121214] border-neutral-800 focus:border-neutral-700 text-white rounded-lg text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Career Track</label>
                    <select
                      value={careerGoal}
                      onChange={(e) => setCareerGoal(e.target.value)}
                      className="w-full h-11 bg-[#121214] border border-neutral-800 rounded-lg text-white px-3 focus:outline-none focus:border-neutral-700 text-sm"
                    >
                      {CAREER_GOAL_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleNext}
                    disabled={!targetRole}
                    className="h-10 px-5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    Next Step <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: College / University */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <div className="text-xs font-semibold text-indigo-400 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Step 2 of 4
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Academic background</h2>
                  <p className="text-sm text-neutral-400">
                    Which college or university did/do you attend? (Optional)
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">College Name</label>
                    <Input
                      placeholder="e.g. Harvard University"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="h-11 bg-[#121214] border-neutral-800 focus:border-neutral-700 text-white rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="h-10 px-4 bg-transparent border-neutral-800 text-neutral-300 hover:bg-[#121214] text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="h-10 px-5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    Next Step <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Graduation Year */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <div className="text-xs font-semibold text-indigo-400 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Step 3 of 4
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Graduation details</h2>
                  <p className="text-sm text-neutral-400">
                    What is your graduation or target graduation year? (Optional)
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Graduation Year</label>
                    <select
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      className="w-full h-11 bg-[#121214] border border-neutral-800 rounded-lg text-white px-3 focus:outline-none focus:border-neutral-700 text-sm"
                    >
                      <option value="">Select Year</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="h-10 px-4 bg-transparent border-neutral-800 text-neutral-300 hover:bg-[#121214] text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="h-10 px-5 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    Next Step <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Completion Screen */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <div className="text-xs font-semibold text-indigo-400 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" /> Step 4 of 4
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">🎉 Welcome to AI Career Copilot</h2>
                  <p className="text-sm text-neutral-400">
                    Your profile has been created successfully.
                  </p>
                </div>

                <div className="bg-[#121214] border border-neutral-800/80 rounded-xl p-5 text-left space-y-3">
                  <p className="text-xs text-neutral-400 font-medium">
                    Your next step is to upload your resume from the dedicated Upload Resume page to unlock:
                  </p>
                  <ul className="space-y-2 text-sm text-neutral-200">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✔</span> ATS Score Analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✔</span> AI Job Matching
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✔</span> AI Skill Gap Analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500 font-bold">✔</span> Career Analytics
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    onClick={handleCompleteOnboarding}
                    className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        Go To Dashboard <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                  {!loading && (
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      className="w-full h-10 bg-transparent border-neutral-800 text-neutral-300 hover:bg-[#121214] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
