import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, CheckCircle, XCircle, Zap, TrendingUp, RefreshCw, ChevronRight, AlertCircle } from "lucide-react";
import API from "@/api/api";
import { useAppState } from "@/hooks/useAppState";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type ATSReport = {
  overallScore: number;
  sections: {
    keywordMatch: { score: number; matched: string[]; missing: string[] };
    skillsMatch: { score: number; matched: string[]; missing: string[] };
    experienceMatch: { score: number; feedback: string };
    educationMatch: { score: number; feedback: string };
  };
  quickWins: string[];
  verdict: "Strong Match" | "Good Match" | "Moderate Match" | "Weak Match";
};

const verdictColor = (v: string) => {
  if (v === "Strong Match") return "text-green-600 bg-green-50 border-green-200";
  if (v === "Good Match") return "text-blue-600 bg-blue-50 border-blue-200";
  if (v === "Moderate Match") return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-red-600 bg-red-50 border-red-200";
};

const scoreColor = (s: number) => {
  if (s >= 75) return "text-green-600";
  if (s >= 50) return "text-yellow-600";
  return "text-red-500";
};

const ATSScorePage = () => {
  const { appState, updateAppState } = useAppState();
  const navigate = useNavigate();
  
  useEffect(() => {
    const latestMatch = appState.analyses?.latestAnalysis?.match;
    console.log({
        stage: "9. ATSScorePage (Read AppState)",
        matchedSkills: latestMatch?.matchedSkills?.length,
        missingSkills: latestMatch?.missingSkills?.length,
        strengths: latestMatch?.strengths?.length,
        weaknesses: latestMatch?.weaknesses?.length,
        atsScore: latestMatch?.matchScore,
        keys: latestMatch ? Object.keys(latestMatch) : []
    });
  }, [appState.analyses?.latestAnalysis]);
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ATSReport | null>(null);
  const [error, setError] = useState("");
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);

  const handleAddToTracker = () => {
    // Attempt to extract company and role from job description or fallback
    const firstLine = jobDescription.trim().split("\n")[0] || "";
    let company = "Not Specified";
    let role = "Software Engineer";
    
    // Simple heuristic parsing (e.g. "Google - Software Engineer" or "Software Engineer at Google")
    if (firstLine.includes("-")) {
      const parts = firstLine.split("-");
      company = parts[0]?.trim() || company;
      role = parts[1]?.trim() || role;
    } else if (firstLine.toLowerCase().includes(" at ")) {
      const parts = firstLine.split(/ at /i);
      role = parts[0]?.trim() || role;
      company = parts[1]?.trim() || company;
    } else if (firstLine.length > 0 && firstLine.length < 50) {
      role = firstLine.trim();
    }

    const newApp = {
      id: Math.random().toString(36).substring(2, 9),
      company: company,
      role: role,
      status: "Applied" as const,
      atsScore: report?.overallScore,
      jobDescription: jobDescription,
      resumeVersion: appState.resume.fileName || "Version 1",
      source: "ATS Score" as const,
      priority: "Medium" as const,
      lastStatusChange: new Date().toISOString(),
      history: [
        {
          from: "None",
          to: "Applied",
          date: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    updateAppState((prev) => ({
      ...prev,
      applications: [...(prev.applications || []), newApp]
    }), true);

    toast.success("Application added successfully!", {
      action: {
        label: "View Tracker",
        onClick: () => navigate("/applications")
      }
    });
  };

  // Restore state on mount
  useEffect(() => {
    const savedResume = appState.atsScore.resumeText || "";
    const savedJD = appState.atsScore.jobDescription || "";
    setResumeText(savedResume);
    setJobDescription(savedJD);

    const savedReport = appState.atsScore.atsReport;
    if (savedReport) {
      setReport(savedReport);
      setShowRestoreBanner(true);
    } else {
      setReport(null);
      setShowRestoreBanner(false);
    }
  }, [appState.atsScore.resumeText, appState.atsScore.jobDescription, appState.atsScore.atsReport]);

  const handleResumeChange = (val: string) => {
    setResumeText(val);
    updateAppState((prev) => ({
      ...prev,
      atsScore: {
        ...prev.atsScore,
        resumeText: val
      }
    }), false); // debounced
  };

  const handleJDChange = (val: string) => {
    setJobDescription(val);
    updateAppState((prev) => ({
      ...prev,
      atsScore: {
        ...prev.atsScore,
        jobDescription: val
      }
    }), false); // debounced
  };

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      setError("Both resume text and job description are required");
      return;
    }
    setError("");
    setReport(null);
    try {
      setLoading(true);
      const res = await API.post("/ai/ats-score", { resumeText, jobDescription });
      const atsReport = res.data.atsReport;
      setReport(atsReport);

      // Save immediately
      updateAppState((prev) => ({
        ...prev,
        atsScore: {
          resumeText,
          jobDescription,
          atsReport
        }
      }), true);
      
      setShowRestoreBanner(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "ATS analysis failed");
    } finally {
      setLoading(false);
    }
  };

  // Prefill from appState.resume.skills if available
  const prefillResume = () => {
    const skills = appState.resume.skills || [];
    if (skills.length > 0) {
      const text = "Skills: " + skills.join(", ");
      handleResumeChange(text);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {showRestoreBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3 text-sm rounded-xl bg-primary/10 border border-primary/20 text-primary"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Previous session restored</span>
            </div>
            <button
              onClick={() => setShowRestoreBanner(false)}
              className="text-xs font-semibold hover:underline"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">ATS Score Analyzer</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Get a detailed ATS compatibility score and discover exactly what's missing from your resume.
              </p>
            </div>
          </div>
          {(resumeText || jobDescription || report) && (
            <Button
              onClick={() => {
                setResumeText("");
                setJobDescription("");
                setReport(null);
                setShowRestoreBanner(false);
                updateAppState((prev) => ({
                  ...prev,
                  atsScore: {
                    resumeText: "",
                    jobDescription: "",
                    atsReport: null
                  }
                }), true);
              }}
              variant="outline"
              size="sm"
              className="text-xs text-muted-foreground hover:text-white self-start sm:self-center"
            >
              Clear Page Only
            </Button>
          )}
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Your Resume</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={prefillResume}>
                  Use saved skills
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste your full resume text here..."
                value={resumeText}
                onChange={(e) => handleResumeChange(e.target.value)}
                className="min-h-[200px] bg-background text-sm resize-none"
              />
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste the job description you're applying to..."
                value={jobDescription}
                onChange={(e) => handleJDChange(e.target.value)}
                className="min-h-[200px] bg-background text-sm resize-none"
              />
            </CardContent>
          </Card>
        </motion.div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex-1 h-12 gradient-primary text-primary-foreground text-sm font-semibold"
          >
            {loading ? (
              <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Analyzing with AI...</>
            ) : (
              <><Target className="w-4 h-4 mr-2" /> Analyze ATS Score</>
            )}
          </Button>

          {(resumeText || jobDescription) && (
            <Button
              onClick={() => {
                setResumeText("");
                setJobDescription("");
                updateAppState((prev) => ({
                  ...prev,
                  atsScore: {
                    ...prev.atsScore,
                    resumeText: "",
                    jobDescription: ""
                  }
                }), true);
              }}
              variant="outline"
              className="h-12 border-border text-sm font-medium hover:bg-slate-800"
            >
              Clear Inputs
            </Button>
          )}

          {(resumeText || jobDescription || report) && (
            <Button
              onClick={() => {
                setResumeText("");
                setJobDescription("");
                setReport(null);
                setShowRestoreBanner(false);
                updateAppState((prev) => ({
                  ...prev,
                  atsScore: {
                    resumeText: "",
                    jobDescription: "",
                    atsReport: null
                  }
                }), true);
              }}
              variant="outline"
              className="h-12 border-border text-sm font-medium hover:bg-slate-800"
            >
              Analyze New Resume
            </Button>
          )}
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {report && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Overall Score */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-card md:col-span-1 border-primary/20">
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                    <div className={`text-6xl font-bold mb-2 ${scoreColor(report.overallScore)}`}>
                      {report.overallScore}
                    </div>
                    <div className="text-muted-foreground text-sm">ATS Score</div>
                    <Badge className={`mt-3 border ${verdictColor(report.verdict)}`}>
                      {report.verdict}
                    </Badge>
                    <Progress value={report.overallScore} className="mt-4 h-2 w-full" />
                    <Button
                      onClick={handleAddToTracker}
                      variant="secondary"
                      size="sm"
                      className="mt-4 w-full bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 font-medium"
                    >
                      Add to Tracker
                    </Button>
                  </CardContent>
                </Card>

                {/* Score breakdown */}
                <Card className="glass-card md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" /> Score Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "Keyword Match", score: report.sections.keywordMatch.score },
                      { label: "Skills Match", score: report.sections.skillsMatch.score },
                      { label: "Experience Match", score: report.sections.experienceMatch.score },
                      { label: "Education Match", score: report.sections.educationMatch.score },
                    ].map(({ label, score }) => (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{label}</span>
                          <span className={`font-semibold ${scoreColor(score)}`}>{score}%</span>
                        </div>
                        <Progress value={score} className="h-1.5" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Keywords & Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Keyword Match */}
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Keywords</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-green-600 flex items-center gap-1 mb-2 font-medium">
                        <CheckCircle className="w-3. h-3 inline mr-1" /> Matched ({report.sections.keywordMatch.matched.length})
                      </Label>
                      <div className="flex flex-wrap gap-1">
                        {report.sections.keywordMatch.matched.map((k) => (
                          <Badge key={k} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">{k}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-red-500 flex items-center gap-1 mb-2 font-medium">
                        <XCircle className="w-3.5 h-3.5 inline mr-1" /> Missing ({report.sections.keywordMatch.missing.length})
                      </Label>
                      <div className="flex flex-wrap gap-1">
                        {report.sections.keywordMatch.missing.map((k) => (
                          <Badge key={k} variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">{k}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Skills Match */}
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Skills</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-green-600 flex items-center gap-1 mb-2 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 inline mr-1" /> Matched ({report.sections.skillsMatch.matched.length})
                      </Label>
                      <div className="flex flex-wrap gap-1">
                        {report.sections.skillsMatch.matched.map((s) => (
                          <Badge key={s} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-red-500 flex items-center gap-1 mb-2 font-medium">
                        <XCircle className="w-3.5 h-3.5 inline mr-1" /> Missing ({report.sections.skillsMatch.missing.length})
                      </Label>
                      <div className="flex flex-wrap gap-1">
                        {report.sections.skillsMatch.missing.map((s) => (
                          <Badge key={s} variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Feedback & Quick Wins */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Section Feedback</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-lg bg-accent/50">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Experience</p>
                      <p className="text-sm">{report.sections.experienceMatch.feedback}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/50">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Education</p>
                      <p className="text-sm">{report.sections.educationMatch.feedback}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" /> Quick Wins
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.quickWins.map((win, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-sm">{win}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default ATSScorePage;
