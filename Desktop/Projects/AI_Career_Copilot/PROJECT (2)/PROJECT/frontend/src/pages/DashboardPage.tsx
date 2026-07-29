import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  Zap,
  Target,
  Sparkles,
  ClipboardList,
  Lightbulb,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  Wand2,
  Download,
  AlertCircle,
  Briefcase,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "@/hooks/useAppState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "../context/AuthContext";
import API from "@/api/api";
import { CircularScore } from "@/components/CircularScore";
import { startNewSession } from "@/lib/appState";
import { toast } from "sonner";

interface TimelineEvent {
  type: string;
  title: string;
  subtitle: string;
  date: Date;
}

interface ProfileData {
  fullName?: string;
  targetRole?: string;
  college?: string;
  graduationYear?: string;
  linkedin?: string;
  github?: string;
  bio?: string;
}

function calculateProfileCompletion(profile: ProfileData, isResumeUploaded: boolean) {
  let completion = 0;
  
  const checklist = [
    { label: "Resume Uploaded", checked: isResumeUploaded, value: 10 },
    { label: "Full Name", checked: !!(profile.fullName && profile.fullName.trim()), value: 10 },
    { label: "Target Role", checked: !!(profile.targetRole && profile.targetRole.trim()), value: 20 },
    { label: "College", checked: !!(profile.college && profile.college.trim()), value: 10 },
    { label: "Graduation Year", checked: !!(profile.graduationYear && profile.graduationYear.trim()), value: 10 },
    { label: "LinkedIn", checked: !!(profile.linkedin && profile.linkedin.trim()), value: 15 },
    { label: "GitHub", checked: !!(profile.github && profile.github.trim()), value: 15 },
    { label: "Bio", checked: !!(profile.bio && profile.bio.trim()), value: 10 },
  ];

  checklist.forEach((item) => {
    if (item.checked) {
      completion += item.value;
    }
  });

  const finalScore = Math.min(completion, 100);
  const missingCount = checklist.filter(item => !item.checked).length;

  return {
    completion: finalScore,
    checklist,
    missingCount,
  };
}

const DashboardPage = () => {
  const { appState, updateAppState } = useAppState();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Metrics (Overview)
  const [totalApplications, setTotalApplications] = useState(0);
  const [totalInterviews, setTotalInterviews] = useState(0);
  const [totalOffers, setTotalOffers] = useState(0);
  const [successRate, setSuccessRate] = useState(0);

  // Resume details from session
  const latestAnalysis = appState.analyses.latestAnalysis;
  const isResumeUploaded = appState.resume.uploaded;
  const isJdUploaded = !!appState.analyses.jobDesc;
  const isAtsAnalyzed = !!latestAnalysis;
  const isResumeTailored = !!latestAnalysis?.tailored;
  const isDownloaded = isResumeTailored; // Standardized trigger

  // Activity Feed
  const [activityFeed, setActivityFeed] = useState<TimelineEvent[]>([]);

  // Profile State
  const [profile, setProfile] = useState<any>({
    fullName: "",
    targetRole: "",
    careerGoal: "",
  });
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const displayGreetingName = profile.fullName ? profile.fullName.split(" ")[0] : (user?.name?.split(" ")[0] || "User");

  // Fetch Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/profile");
        const data = res.data;
        setProfile(data);
        
        if (data.onboardingComplete === false) {
          const dismissed = sessionStorage.getItem("dismissed_welcome_overlay");
          if (!dismissed) {
            setShowWelcomeOverlay(true);
          }
        }
        localStorage.setItem(`profileCache_${user?.id || "guest"}`, JSON.stringify(data));
      } catch (err) {
        console.error("Dashboard profile fetch failed", err);
        const cached = localStorage.getItem(`profileCache_${user?.id || "guest"}`);
        if (cached) {
          setProfile(JSON.parse(cached));
        }
      }
    };
    fetchProfile();
  }, [user?.id]);

  // Compute profile completeness
  const { completion: profileCompletion, checklist, missingCount } = calculateProfileCompletion(profile, isResumeUploaded);

  // Dynamic activity builder
  useEffect(() => {
    const timeline: TimelineEvent[] = [];
    const history = appState.analyses.history || [];

    if (appState.resume.uploaded) {
      timeline.push({
        type: "upload",
        title: "Uploaded Resume File",
        subtitle: `Registered file: ${appState.resume.fileName}`,
        date: new Date(appState.resume.uploadedAt || Date.now())
      });
    }

    history.forEach((h: any) => {
      timeline.push({
        type: "job",
        title: `ATS Match: ${h.role || 'Job Profile'}`,
        subtitle: `Score for ${h.company || 'Not Specified'}: ${h.matchScore}%`,
        date: new Date(h.timestamp || h.createdAt || Date.now())
      });
    });

    timeline.sort((a, b) => b.date.getTime() - a.date.getTime());
    setActivityFeed(timeline.slice(0, 5));
  }, [appState]);

  const handleSkipWelcomeOverlay = () => {
    setShowWelcomeOverlay(false);
    sessionStorage.setItem("dismissed_welcome_overlay", "true");
  };

  // Progression scores
  const originalScore = latestAnalysis?.match?.matchScore || 0;
  const improvedScore = latestAnalysis?.tailored?.improvedScore || 0;
  const scoreDelta = improvedScore > originalScore ? improvedScore - originalScore : 0;

  // State machine for "Continue where you left off"
  const getContinueAction = () => {
    if (!isResumeUploaded) {
      return {
        label: "Upload Resume",
        description: "Start by uploading and parsing your resume file.",
        link: "/upload",
        icon: FileText
      };
    }
    if (!isJdUploaded) {
      return {
        label: "Continue to ATS Analysis",
        description: "Paste a target job description to match your skills.",
        link: "/analysis",
        icon: Briefcase
      };
    }
    if (!isAtsAnalyzed) {
      return {
        label: "Analyze Score",
        description: "Run ATS matching to identify skill and keyword gaps.",
        link: "/analysis",
        icon: Target
      };
    }
    if (!isResumeTailored) {
      return {
        label: "Tailor Resume with AI",
        description: "Optimize wording and align your resume bullets with the JD.",
        link: "/tailor",
        icon: Wand2
      };
    }
    return {
      label: "Explore AI Suggestions",
      description: "Review tailored interview questions and confidence roadmaps.",
      link: "/suggestions",
      icon: Lightbulb
    };
  };

  const currentAction = getContinueAction();
  const ActiveActionIcon = currentAction.icon;

  const handleConfirmResetSession = () => {
    updateAppState((prev) => startNewSession(prev), true);
    setShowResetConfirm(false);
    toast.success("Session reset! You can now start a new analysis.");
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* WELCOME OVERLAY MODAL */}
        <AnimatePresence>
          {showWelcomeOverlay && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-[#0c0c0e] border border-neutral-800 rounded-2xl p-8 max-w-[440px] w-full text-center shadow-2xl relative"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <Sparkles className="w-7 h-7 text-indigo-400" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2.5">
                  Welcome to AI Career Copilot 👋
                </h2>
                
                <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                  Let's personalize your career dashboard. Complete onboarding to analyze resume gaps and align target role suggestions.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSkipWelcomeOverlay}
                    variant="outline"
                    className="flex-1 h-11 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Skip for Now
                  </Button>
                  <Button
                    onClick={() => {
                      handleSkipWelcomeOverlay();
                      navigate("/onboarding");
                    }}
                    className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer"
                  >
                    Complete Profile
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* START NEW ANALYSIS CONFIRMATION MODAL */}
        <AnimatePresence>
          {showResetConfirm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-[#0c0c0e] border border-neutral-800 rounded-2xl p-6 max-w-[440px] w-full shadow-2xl relative text-white"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Start a New Analysis?</h3>
                </div>
                
                <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                  This will clear your current resume, job description, ATS analysis, AI tailored resume, and temporary session data. Your saved History will remain unchanged.
                </p>

                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => setShowResetConfirm(false)}
                    variant="outline"
                    className="h-10 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmResetSession}
                    className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer"
                  >
                    Start New Analysis
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* TOP WELCOME HEADER & TIME-OF-DAY GREETING */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {getGreeting()}, {displayGreetingName} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Here is the live status of your resume optimization and career application roadmap.
            </p>
          </div>
          {isResumeUploaded && (
            <Button
              onClick={() => setShowResetConfirm(true)}
              className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl px-4 py-2 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-md self-start md:self-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Start Fresh
            </Button>
          )}
        </motion.div>

        {/* ─── FUTURISTIC WORKFLOW COMMAND STATION ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Active Target Module Hub (Left Column, spans 2 cols on lg) */}
          <Card className="lg:col-span-2 border-indigo-500/20 bg-gradient-to-b from-[#0e0d16] to-[#0c0c0e] backdrop-blur-xl relative overflow-hidden flex flex-col justify-between p-6 min-h-[320px] shadow-2xl rounded-2xl">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full filter blur-[60px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full filter blur-[60px] pointer-events-none" />
            
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <Badge className="bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-semibold text-[10px] uppercase tracking-wider">
                  Active Mission
                </Badge>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Step {!isResumeUploaded ? "1" : !isJdUploaded ? "2" : !isAtsAnalyzed ? "3" : !isResumeTailored ? "4" : "5"} of 5
                </span>
              </div>
              
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {currentAction.label}
                </h2>
                <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                  {currentAction.description}
                </p>
              </div>

              {/* Progress visual indicator inside command hub */}
              <div className="pt-2">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-neutral-400 font-medium">Pipeline Optimization</span>
                  <span className="font-bold text-white">
                    {isDownloaded ? 100 : isResumeTailored ? 80 : isAtsAnalyzed ? 60 : isResumeUploaded ? 40 : 20}%
                  </span>
                </div>
                <div className="w-full bg-neutral-900/80 rounded-full h-2 border border-neutral-800/40 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700 ease-in-out" 
                    style={{ 
                      width: `${isDownloaded ? 100 : isResumeTailored ? 80 : isAtsAnalyzed ? 60 : isResumeUploaded ? 40 : 20}%` 
                    }} 
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={() => navigate(currentAction.link)}
              className="w-full h-11 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/10 z-10 transition-all active:scale-[0.98] mt-6"
            >
              <ActiveActionIcon className="w-4 h-4 animate-bounce" />
              Launch Active Module
            </Button>
          </Card>

          {/* Module Track Grid (Right Column, spans 3 cols on lg) */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            
            {/* Module 1: Resume Ingest */}
            <div 
              onClick={() => navigate("/upload")} 
              className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[140px] group ${
                isResumeUploaded 
                  ? "bg-neutral-950/40 border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.02)]" 
                  : "bg-[#09090b]/80 border-border/40 hover:border-indigo-500/30"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl border ${
                  isResumeUploaded ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-neutral-900 border-neutral-800 text-neutral-500"
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <Badge variant="outline" className={`text-[9px] uppercase tracking-wider font-semibold border-none px-0 ${
                  isResumeUploaded ? "text-emerald-400" : "text-indigo-400 font-bold animate-pulse"
                }`}>
                  {isResumeUploaded ? "Completed" : "Ready"}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">1. Resume Upload</p>
                <p className="text-[10px] text-neutral-400 mt-1 truncate">
                  {isResumeUploaded ? appState.resume.fileName : "Select your PDF/DOCX"}
                </p>
              </div>
            </div>

            {/* Module 2: Job Aligner */}
            <div 
              onClick={() => navigate("/analysis")} 
              className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[140px] group ${
                isJdUploaded 
                  ? "bg-neutral-950/40 border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.02)]" 
                  : isResumeUploaded 
                    ? "bg-[#09090b]/80 border-indigo-500/20 hover:border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.03)]" 
                    : "bg-neutral-950/10 border-neutral-900/60 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl border ${
                  isJdUploaded ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : isResumeUploaded ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-neutral-900 border-neutral-800 text-neutral-500"
                }`}>
                  <Target className="w-4 h-4" />
                </div>
                <Badge variant="outline" className={`text-[9px] uppercase tracking-wider font-semibold border-none px-0 ${
                  isJdUploaded ? "text-emerald-400" : isResumeUploaded ? "text-indigo-400 font-bold animate-pulse" : "text-neutral-600"
                }`}>
                  {isJdUploaded ? "Completed" : isResumeUploaded ? "Active" : "Locked"}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">2. JD Alignment</p>
                <p className="text-[10px] text-neutral-400 mt-1 truncate">
                  {isJdUploaded ? "Target JD parsed" : isResumeUploaded ? "Paste target JD" : "Upload resume first"}
                </p>
              </div>
            </div>

            {/* Module 3: ATS Diagnostics */}
            <div 
              onClick={() => isJdUploaded && navigate("/analysis")} 
              className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[140px] group ${
                isAtsAnalyzed 
                  ? "bg-neutral-950/40 border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.02)]" 
                  : isJdUploaded 
                    ? "bg-[#09090b]/80 border-indigo-500/20 hover:border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.03)]" 
                    : "bg-neutral-950/10 border-neutral-900/60 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl border ${
                  isAtsAnalyzed ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : isJdUploaded ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-neutral-900 border-neutral-800 text-neutral-500"
                }`}>
                  <Award className="w-4 h-4" />
                </div>
                <Badge variant="outline" className={`text-[9px] uppercase tracking-wider font-semibold border-none px-0 ${
                  isAtsAnalyzed ? "text-emerald-400" : isJdUploaded ? "text-indigo-400 font-bold animate-pulse" : "text-neutral-600"
                }`}>
                  {isAtsAnalyzed ? "Completed" : isJdUploaded ? "Active" : "Locked"}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">3. ATS Check</p>
                <p className="text-[10px] text-neutral-400 mt-1 truncate">
                  {isAtsAnalyzed ? `Match: ${originalScore}%` : isJdUploaded ? "Ready to analyze" : "Align JD first"}
                </p>
              </div>
            </div>

            {/* Module 4: AI Resume Rewriter */}
            <div 
              onClick={() => isAtsAnalyzed && navigate("/tailor")} 
              className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[140px] group ${
                isResumeTailored 
                  ? "bg-neutral-950/40 border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.02)]" 
                  : isAtsAnalyzed 
                    ? "bg-[#09090b]/80 border-indigo-500/20 hover:border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.03)]" 
                    : "bg-neutral-950/10 border-neutral-900/60 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl border ${
                  isResumeTailored ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : isAtsAnalyzed ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-neutral-900 border-neutral-800 text-neutral-500"
                }`}>
                  <Wand2 className="w-4 h-4" />
                </div>
                <Badge variant="outline" className={`text-[9px] uppercase tracking-wider font-semibold border-none px-0 ${
                  isResumeTailored ? "text-emerald-400" : isAtsAnalyzed ? "text-indigo-400 font-bold animate-pulse" : "text-neutral-600"
                }`}>
                  {isResumeTailored ? "Completed" : isAtsAnalyzed ? "Active" : "Locked"}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">4. AI Resume Tailor</p>
                <p className="text-[10px] text-neutral-400 mt-1 truncate">
                  {isResumeTailored ? `Optimized: ${improvedScore}%` : isAtsAnalyzed ? "Ready to optimize" : "Check ATS first"}
                </p>
              </div>
            </div>

            {/* Module 5: Resume Exporter */}
            <div 
              onClick={() => isResumeTailored && navigate("/tailor")} 
              className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[140px] group ${
                isDownloaded 
                  ? "bg-neutral-950/40 border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.02)]" 
                  : isResumeTailored 
                    ? "bg-[#09090b]/80 border-indigo-500/20 hover:border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.03)]" 
                    : "bg-neutral-950/10 border-neutral-900/60 opacity-50 cursor-not-allowed"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl border ${
                  isDownloaded ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : isResumeTailored ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-neutral-900 border-neutral-800 text-neutral-500"
                }`}>
                  <Download className="w-4 h-4" />
                </div>
                <Badge variant="outline" className={`text-[9px] uppercase tracking-wider font-semibold border-none px-0 ${
                  isDownloaded ? "text-emerald-400" : isResumeTailored ? "text-indigo-400 font-bold animate-pulse" : "text-neutral-600"
                }`}>
                  {isDownloaded ? "Completed" : isResumeTailored ? "Active" : "Locked"}
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">5. Export Resume</p>
                <p className="text-[10px] text-neutral-400 mt-1 truncate">
                  {isDownloaded ? "Word/Text compiled" : isResumeTailored ? "Ready to download" : "Tailor resume first"}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Grid: ATS Health Progression, Latest Suggestions & Command Center */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ATS Score Progress Card */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" /> Score Progression
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {latestAnalysis ? (
                <div className="space-y-4">
                  {/* Circular scores side-by-side */}
                  <div className="flex items-center justify-around bg-neutral-950 p-4 rounded-xl border border-neutral-900">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] text-neutral-500 uppercase font-bold">Original</span>
                      <CircularScore score={originalScore} size={60} />
                    </div>

                    <ArrowRight className="w-4 h-4 text-neutral-700" />

                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] text-success uppercase font-bold">Optimized</span>
                      <CircularScore score={improvedScore || originalScore} size={60} />
                    </div>
                  </div>

                  {/* Improvement stats */}
                  <div className="bg-success/5 border border-success/15 p-3 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Score Improvement Delta:</span>
                    <span className="font-bold text-success">+{scoreDelta}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-neutral-600" />
                  <p className="text-xs">No match history in session yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Suggestions Card */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" /> AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {latestAnalysis?.ai?.suggestions?.length > 0 ? (
                <div className="space-y-3">
                  <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                    {latestAnalysis.ai.suggestions.slice(0, 3).map((suggestion: string, idx: number) => (
                      <div key={idx} className="flex gap-2 text-xs text-neutral-300 items-start">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => navigate("/suggestions")} size="sm" variant="ghost" className="w-full mt-2 text-xs text-indigo-400 hover:bg-indigo-500/5 cursor-pointer">
                    Open Suggestions →
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-neutral-700" />
                  <p className="text-xs">No roadmap suggestions extracted yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Command Center Card */}
          <Card className="glass-card border-indigo-500/20 shadow-lg shadow-indigo-500/5">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" /> AI Command Center
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="text-xs space-y-2.5">
                <div className="flex justify-between items-center bg-[#0c0c0e]/80 p-2.5 rounded-lg border border-neutral-900">
                  <span className="text-neutral-400 font-medium">Session Status:</span>
                  <Badge variant="outline" className={isResumeUploaded ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[10px]" : "bg-neutral-800 border-neutral-700 text-neutral-500 text-[10px]"}>
                    {isResumeUploaded ? "Active Session" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center bg-[#0c0c0e]/80 p-2.5 rounded-lg border border-neutral-900">
                  <span className="text-neutral-400 font-medium">Current Resume:</span>
                  <span className="font-semibold text-white truncate max-w-[130px]">{isResumeUploaded ? appState.resume.fileName : "—"}</span>
                </div>
                <div className="flex justify-between items-center bg-[#0c0c0e]/80 p-2.5 rounded-lg border border-neutral-900">
                  <span className="text-neutral-400 font-medium">Resume Tailored:</span>
                  <Badge variant="outline" className={isResumeTailored ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[10px]" : "bg-neutral-800 border-neutral-700 text-neutral-500 text-[10px]"}>
                    {isResumeTailored ? "Tailored ✓" : "Pending"}
                  </Badge>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-900">
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block mb-1">
                  Continue where you left off
                </span>
                <p className="text-[11px] text-neutral-400 leading-normal mb-3">
                  {currentAction.description}
                </p>
                <Button
                  onClick={() => navigate(currentAction.link)}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10"
                >
                  <ActiveActionIcon className="w-3.5 h-3.5" />
                  {currentAction.label}
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Grid: Profile Completion & Activity Logs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* PROFILE COMPLETION CHECKLIST CARD */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Profile Strength Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">Completeness Ratio</span>
                <span className="font-bold text-white">{profileCompletion}%</span>
              </div>
              <div className="w-full bg-neutral-900 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${profileCompletion}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                {checklist.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className={item.checked ? "text-emerald-500 font-bold" : "text-neutral-600"}>
                      {item.checked ? "✓" : "○"}
                    </span>
                    <span className={item.checked ? "text-neutral-300" : "text-neutral-500"}>{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ACTIVITY TIMELINE CARD */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" /> Recent Session Logs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activityFeed.length === 0 ? (
                <p className="text-center text-muted-foreground text-xs py-10">
                  No activity history logged. Upload a resume to get started!
                </p>
              ) : (
                <div className="divide-y divide-border/20">
                  {activityFeed.map((event, idx) => (
                    <div key={idx} className="px-5 py-3.5 flex items-center justify-between text-xs hover:bg-[#0c0c0e]/30 transition-all">
                      <div className="space-y-0.5 min-w-0 pr-2">
                        <p className="font-medium text-slate-200 truncate">{event.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{event.subtitle}</p>
                      </div>
                      <span className="text-[9px] text-slate-500 font-medium flex-shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.date.toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;