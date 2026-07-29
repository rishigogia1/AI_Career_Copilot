import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import { CircularScore } from "@/components/CircularScore";
import API from "@/api/api";
import { useAppState } from "@/hooks/useAppState";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const analyzeSteps = [
  "Reading job description...",
  "Extracting requirements...",
  "Matching skills...",
  "Generating insights..."
];

type AnalysisResult = {
  score: number;
  matched: string[];
  missing: string[];
  strengths: string[];
  weaknesses: string[];
  domainResume?: string;
  domainJD?: string;
  isDomainMismatch?: boolean;
  primaryReason?: string;
  aiRecommendation?: string;
  resumeSummary?: string;
  jdSummary?: string;
  domainAnalysis?: string;
  experienceAnalysis?: string;
  educationAnalysis?: string;
  projectAnalysis?: string;
  keywordAnalysis?: string;
  atsFeedback?: string;
  recommendations?: string[];
  gapAnalysis?: string[];
  nextSteps?: string[];
  hiringProbability?: string;
};

const JobAnalysisPage = () => {
  const { appState, updateAppState } = useAppState();
  const navigate = useNavigate();
  const [jobDesc, setJobDesc] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [showRestoreBanner, setShowRestoreBanner] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "feedback" | "skills">("summary");

  const handleAddToTracker = () => {
    const latest = appState.analyses.latestAnalysis;
    const company = latest?.saved?.company || "Not Specified";
    const role = latest?.saved?.role || "Software Engineer";

    const newApp = {
      id: Math.random().toString(36).substring(2, 9),
      company: company,
      role: role,
      status: "Applied" as const,
      atsScore: result?.score,
      jobDescription: jobDesc,
      resumeVersion: appState.resume.fileName || "Version 1",
      source: "Job Analysis" as const,
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
    const savedJD = appState.analyses.jobDesc || "";
    setJobDesc(savedJD);

    const latest = appState.analyses.latestAnalysis;
    if (latest && latest.match) {
      setResult({
        score: latest.match.matchScore,
        matched: latest.match.matchedSkills,
        missing: latest.match.missingSkills,
        strengths: latest.match.strengths || latest.ai?.suggestions?.slice(0, 3) || [],
        weaknesses: latest.match.weaknesses || latest.ai?.suggestions?.slice(3) || [],
        domainResume: latest.match.domainResume,
        domainJD: latest.match.domainJD,
        isDomainMismatch: latest.match.isDomainMismatch,
        primaryReason: latest.match.primaryReason,
        aiRecommendation: latest.match.aiRecommendation,
        resumeSummary: latest.match.resumeSummary,
        jdSummary: latest.match.jdSummary,
        domainAnalysis: latest.match.domainAnalysis,
        experienceAnalysis: latest.match.experienceAnalysis,
        educationAnalysis: latest.match.educationAnalysis,
        projectAnalysis: latest.match.projectAnalysis,
        keywordAnalysis: latest.match.keywordAnalysis,
        atsFeedback: latest.match.atsFeedback,
        recommendations: latest.match.recommendations,
        gapAnalysis: latest.match.gapAnalysis,
        nextSteps: latest.match.nextSteps,
        hiringProbability: latest.match.hiringProbability
      });
      setShowRestoreBanner(true);
    } else {
      setResult(null);
      setShowRestoreBanner(false);
    }
  }, [appState.analyses.latestAnalysis, appState.analyses.jobDesc]);

  const handleJobDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJobDesc(val);
    updateAppState((prev) => ({
      ...prev,
      analyses: {
        ...prev.analyses,
        jobDesc: val
      }
    }), false); // False for debounced write to localStorage
  };

  const [loadingDetailed, setLoadingDetailed] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const handleAnalyze = async () => {
    if (!jobDesc.trim()) return;

    const resumeSkills = appState.resume.skills || [];

    if (!resumeSkills.length) {
      alert("Please upload resume first");
      return;
    }

    setAnalyzing(true);
    setAnalyzeStep(0);
    setResult(null);

    const interval = setInterval(() => {
      setAnalyzeStep((prev) => Math.min(prev + 1, analyzeSteps.length - 1));
    }, 600);

    try {
      const resumeText = appState.resume.resumeText || "";

      if (!resumeText.trim()) {
        alert("Resume text not found. Please upload and parse a resume first.");
        clearInterval(interval);
        setAnalyzing(false);
        return;
      }

      const payload = {
        resumeText,
        resumeSkills,
        jobDescription: jobDesc
      };

      console.log("[JOB ANALYSIS REQUEST]", payload);
      const res = await API.post("/job/match", payload);
      console.log("[JOB ANALYSIS SUCCESS RESPONSE]", res.data);

      clearInterval(interval);
      setAnalyzing(false);

      const savedId = res.data.saved?._id || Date.now().toString();
      const analysisRecord = {
        id: savedId,
        timestamp: res.data.saved?.createdAt || new Date().toISOString(),
        role: res.data.saved?.role || "Software Engineer",
        company: res.data.saved?.company || "Not Specified",
        matchScore: res.data.match?.matchScore || 0,
        matchedSkills: res.data.match?.matchedSkills || [],
        missingSkills: res.data.match?.missingSkills || [],
        semanticScore: res.data.match?.semanticScore || 0,
        skillScore: res.data.match?.skillScore || 0,
        experienceScore: res.data.match?.experienceScore || 0,
        educationScore: res.data.match?.educationScore || 0
      };

      console.log({
          stage: "3. JobAnalysisPage (After API)",
          matchedSkills: res.data.match?.matchedSkills?.length,
          missingSkills: res.data.match?.missingSkills?.length,
          strengths: res.data.match?.strengths?.length,
          weaknesses: res.data.match?.weaknesses?.length,
          atsScore: res.data.match?.matchScore,
          keys: res.data.match ? Object.keys(res.data.match) : []
      });

      // Set initial results immediately (latency < 3 seconds)
      const initialResultState = {
        score: res.data.match.matchScore,
        matched: res.data.match.matchedSkills,
        missing: res.data.match.missingSkills,
        strengths: [],
        weaknesses: [],
        domainResume: res.data.match.domainResume,
        domainJD: res.data.match.domainJD,
        isDomainMismatch: res.data.match.isDomainMismatch,
        primaryReason: res.data.match.primaryReason,
        aiRecommendation: res.data.match.aiRecommendation
      };
      setResult(initialResultState);
      setShowRestoreBanner(false);

      const baseAppState = {
        analyses: {
          history: [analysisRecord, ...appState.analyses.history.filter(h => h.id !== savedId)],
          latestAnalysis: res.data,
          jobDesc: jobDesc
        }
      };
      updateAppState(baseAppState, true);

      console.log({
          stage: "4. updateAppState() (JobAnalysisPage)",
          matchedSkills: baseAppState.analyses.latestAnalysis?.match?.matchedSkills?.length,
          missingSkills: baseAppState.analyses.latestAnalysis?.match?.missingSkills?.length,
          strengths: baseAppState.analyses.latestAnalysis?.match?.strengths?.length,
          weaknesses: baseAppState.analyses.latestAnalysis?.match?.weaknesses?.length,
          atsScore: baseAppState.analyses.latestAnalysis?.match?.matchScore,
          keys: baseAppState.analyses.latestAnalysis?.match ? Object.keys(baseAppState.analyses.latestAnalysis.match) : []
      });

      // Start Progressive Background Generations Concurrently
      setLoadingDetailed(true);
      setLoadingSuggestions(true);

      const fetchDetailed = async () => {
        try {
          const detailRes = await API.post("/job/match/detailed", {
            resumeText,
            jobDescription: jobDesc,
            matchedSkills: res.data.match.matchedSkills,
            missingSkills: res.data.match.missingSkills,
            targetRole: analysisRecord.role,
            isDomainMismatch: res.data.match.isDomainMismatch,
            primaryReason: res.data.match.primaryReason
          });
          const detail = detailRes.data.detailedAnalysis;

          setResult(prev => {
            if (!prev) return null;
            return {
              ...prev,
              resumeSummary: detail.resumeSummary,
              jdSummary: detail.jdSummary,
              domainAnalysis: detail.domainAnalysis,
              experienceAnalysis: detail.experienceAnalysis,
              educationAnalysis: detail.educationAnalysis,
              projectAnalysis: detail.projectAnalysis,
              keywordAnalysis: detail.keywordAnalysis,
              atsFeedback: detail.atsFeedback,
              recommendations: detail.strengths.concat(detail.weaknesses),
              gapAnalysis: [detail.gapAnalysis],
              nextSteps: [detail.nextSteps],
              hiringProbability: detail.hiringProbability
            };
          });

          // Merge detailed analysis findings back into latest session analysis record
          updateAppState(prev => {
            const latest = prev.analyses.latestAnalysis || {};
            if (latest.match) {
              latest.match = { ...latest.match, ...detail };
            }
            return {
              ...prev,
              analyses: {
                ...prev.analyses,
                latestAnalysis: latest
              }
            };
          }, true);
        } catch (err) {
          console.error("Progressive detailed analysis background load failed:", err);
        } finally {
          setLoadingDetailed(false);
        }
      };

      const fetchSuggestions = async () => {
        try {
          const suggRes = await API.post("/job/match/suggestions", {
            analysisId: savedId,
            matchedSkills: res.data.match.matchedSkills,
            missingSkills: res.data.match.missingSkills,
            targetRole: analysisRecord.role,
            resumeSkills,
            resumeText
          });

          console.log({
              stage: "6. Frontend API Response",
              exists: !!suggRes.data.suggestions,
              isArray: Array.isArray(suggRes.data.suggestions),
              length: suggRes.data.suggestions?.length,
              keys: suggRes.data.suggestions?.[0] ? Object.keys(suggRes.data.suggestions[0]) : [],
              responseKeys: Object.keys(suggRes.data)
          });

          setResult(prev => {
            if (!prev) return null;
            return {
              ...prev,
              strengths: suggRes.data.suggestions?.slice(0, 3) || [],
              weaknesses: suggRes.data.suggestions?.slice(3) || []
            };
          });

          updateAppState(prev => {
            const latest = prev.analyses.latestAnalysis || {};
            latest.ai = {
              suggestions: suggRes.data.suggestions || [],
              questions: {
                technical: suggRes.data.questions?.technical || [],
                behavioral: suggRes.data.questions?.behavioral || []
              }
            };
            
            console.log({
                stage: "7. updateAppState()",
                exists: !!latest.ai.suggestions,
                length: latest.ai.suggestions?.length
            });

            return {
              ...prev,
              analyses: {
                ...prev.analyses,
                latestAnalysis: latest
              }
            };
          }, true);
        } catch (err) {
          console.error("Progressive suggestions background load failed:", err);
        } finally {
          setLoadingSuggestions(false);
        }
      };

      // Trigger concurrent fetches in parallel
      Promise.all([fetchDetailed(), fetchSuggestions()]);

    } catch (error: any) {
      clearInterval(interval);
      console.error("[JOB ANALYSIS ERROR FULL]", error);
      alert(error?.response?.data?.error || error?.message || "Analysis failed");
      setAnalyzing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {!appState.resume.uploaded && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 text-sm rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span>No resume uploaded in this session. Please upload a resume first.</span>
            </div>
            <Button onClick={() => navigate("/upload")} className="h-8 text-xs font-semibold px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer">
              Go to Upload
            </Button>
          </div>
        )}

        {appState.resume.uploaded && (
          <div className="flex items-center justify-between p-3.5 text-xs rounded-xl bg-[#0c0c0e] border border-neutral-800 text-neutral-400">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Resume Active: <strong className="text-white font-semibold">{appState.resume.fileName}</strong></span>
            </div>
            <button onClick={() => navigate("/upload")} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer">
              Change Resume
            </button>
          </div>
        )}

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

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Job Analysis</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Paste a job description to see how well you match
            </p>
          </div>
          {(jobDesc || result) && (
            <Button
              onClick={() => {
                setJobDesc("");
                setResult(null);
                setShowRestoreBanner(false);
                updateAppState((prev) => ({
                  ...prev,
                  analyses: {
                    ...prev.analyses,
                    latestAnalysis: null,
                    jobDesc: ""
                  }
                }), true); // Immediate save
              }}
              variant="outline"
              size="sm"
              className="text-xs text-muted-foreground hover:text-white self-start sm:self-center"
            >
              New Analysis
            </Button>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* INPUT */}
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={jobDesc}
                onChange={handleJobDescChange}
                placeholder="Paste job description..."
                className="min-h-[300px]"
                disabled={!appState.resume.uploaded}
              />

              <Button
                onClick={handleAnalyze}
                disabled={analyzing || !appState.resume.uploaded || !jobDesc.trim()}
                className="mt-4 w-full cursor-pointer font-semibold"
              >
                {analyzing ? <Loader2 className="animate-spin" /> : "Analyze Match"}
              </Button>
            </CardContent>
          </Card>

          {/* RESULT */}
          <div>
            {!result && !analyzing && (
              <Card>
                <CardContent className="p-10 text-center text-muted-foreground">
                  Paste job description and click analyze
                </CardContent>
              </Card>
            )}

            {analyzing && (
              <Card>
                <CardContent className="p-10 text-center">
                  <Loader2 className="animate-spin mx-auto mb-4" />
                  {analyzeSteps[analyzeStep]}
                </CardContent>
              </Card>
            )}

            {result && !analyzing && (
              <div className="space-y-4">

                {/* DOMAIN MISMATCH WARNING CALLOUT */}
                {result.isDomainMismatch && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 space-y-3 relative overflow-hidden backdrop-blur-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-450">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-rose-400">Domain Mismatch</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1.5 border-t border-rose-500/10 text-rose-300">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-rose-400/70 tracking-wider">Resume Domain</span>
                        <p className="font-semibold text-white mt-0.5">{result.domainResume}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-rose-400/70 tracking-wider">JD Domain</span>
                        <p className="font-semibold text-white mt-0.5">{result.domainJD}</p>
                      </div>
                    </div>
                    
                    <div className="text-xs space-y-1.5 pt-2 border-t border-rose-500/10 text-rose-300">
                      <p>
                        <strong className="text-rose-400 font-semibold">Primary Reason: </strong>
                        {result.primaryReason}
                      </p>
                      <p>
                        <strong className="text-rose-400 font-semibold">AI Recommendation: </strong>
                        {result.aiRecommendation}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* SCORE */}
                <Card>
                  <CardContent className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                    <div className="flex gap-6 items-center">
                      <CircularScore score={result.score} size={96} />
                      <div>
                        <h3 className="text-lg font-semibold">Match Score</h3>
                        <p className="text-sm text-muted-foreground">
                          {result.score >= 80
                            ? "Excellent match"
                            : result.score >= 50
                            ? "Good match"
                            : "Needs improvement"}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleAddToTracker}
                      variant="secondary"
                      size="sm"
                      className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 font-medium"
                    >
                      Add to Tracker
                    </Button>
                  </CardContent>
                </Card>

                {/* TABS SELECTOR */}
                <div className="flex bg-slate-900/60 p-1.5 rounded-xl border border-white/5 gap-2 backdrop-blur-md">
                  <button
                    onClick={() => setActiveTab("summary")}
                    className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                      activeTab === "summary"
                        ? "bg-primary text-white shadow-md animate-pulse"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    Summary & Fit
                  </button>
                  <button
                    onClick={() => setActiveTab("feedback")}
                    className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                      activeTab === "feedback"
                        ? "bg-primary text-white shadow-md animate-pulse"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    ATS Feedback
                  </button>
                  <button
                    onClick={() => setActiveTab("skills")}
                    className={`flex-1 py-2 px-3 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                      activeTab === "skills"
                        ? "bg-primary text-white shadow-md animate-pulse"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    Skills List
                  </button>
                </div>

                {/* TAB CONTENT: SUMMARY & FIT */}
                {activeTab === "summary" && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Resume Summary */}
                      <Card className="border-indigo-500/10 bg-indigo-500/5">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold text-indigo-400">Resume Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm leading-relaxed text-indigo-200">
                          {loadingDetailed ? (
                            <div className="space-y-2.5 animate-pulse">
                              <div className="h-3 bg-indigo-950 rounded w-11/12" />
                              <div className="h-3 bg-indigo-950 rounded w-full" />
                              <div className="h-3 bg-indigo-950 rounded w-4/5" />
                            </div>
                          ) : (
                            result.resumeSummary || "Detailed resume summary is unavailable."
                          )}
                        </CardContent>
                      </Card>

                      {/* JD Summary */}
                      <Card className="border-purple-500/10 bg-purple-500/5">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold text-purple-400">Job Description Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm leading-relaxed text-purple-200">
                          {loadingDetailed ? (
                            <div className="space-y-2.5 animate-pulse">
                              <div className="h-3 bg-purple-950 rounded w-11/12" />
                              <div className="h-3 bg-purple-950 rounded w-full" />
                              <div className="h-3 bg-purple-950 rounded w-4/5" />
                            </div>
                          ) : (
                            result.jdSummary || "Job description summary is unavailable."
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Section Evaluations */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex justify-between items-center text-sm">
                          <span>Section-wise Resume Evaluation</span>
                          {loadingDetailed ? (
                            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-neutral-900 text-neutral-500 border border-neutral-800 animate-pulse">
                              Fit Probability: Loading...
                            </span>
                          ) : result.hiringProbability ? (
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 ${
                              result.hiringProbability.toLowerCase().includes("high")
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : result.hiringProbability.toLowerCase().includes("medium")
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}>
                              Fit Probability: {result.hiringProbability}
                            </span>
                          ) : null}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm divide-y divide-white/5">
                        {/* Domain Analysis */}
                        <div className="pt-0">
                          <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Domain & Field Match
                          </h4>
                          {loadingDetailed ? (
                            <div className="h-3.5 bg-neutral-900 rounded w-2/3 animate-pulse mt-1.5" />
                          ) : (
                            <p className="text-muted-foreground text-xs">{result.domainAnalysis || "Domain evaluation completed."}</p>
                          )}
                        </div>
                        {/* Experience Analysis */}
                        <div className="pt-3">
                          <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Experience & Seniority
                          </h4>
                          {loadingDetailed ? (
                            <div className="h-3.5 bg-neutral-900 rounded w-1/2 animate-pulse mt-1.5" />
                          ) : (
                            <p className="text-muted-foreground text-xs">{result.experienceAnalysis || "Seniority level mapping completed."}</p>
                          )}
                        </div>
                        {/* Education Analysis */}
                        <div className="pt-3">
                          <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Education Qualifications
                          </h4>
                          {loadingDetailed ? (
                            <div className="h-3.5 bg-neutral-900 rounded w-3/4 animate-pulse mt-1.5" />
                          ) : (
                            <p className="text-muted-foreground text-xs">{result.educationAnalysis || "Educational credentials checked."}</p>
                          )}
                        </div>
                        {/* Project Analysis */}
                        <div className="pt-3">
                          <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Projects & Portfolio
                          </h4>
                          {loadingDetailed ? (
                            <div className="h-3.5 bg-neutral-900 rounded w-5/12 animate-pulse mt-1.5" />
                          ) : (
                            <p className="text-muted-foreground text-xs">{result.projectAnalysis || "Relevant projects assessed."}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* TAB CONTENT: ATS FEEDBACK */}
                {activeTab === "feedback" && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <Card className="border-emerald-500/10 bg-emerald-500/5">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Resume Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {loadingSuggestions ? (
                            <div className="space-y-2 animate-pulse">
                              <div className="h-2.5 bg-emerald-950/50 rounded w-4/5" />
                              <div className="h-2.5 bg-emerald-950/50 rounded w-11/12" />
                              <div className="h-2.5 bg-emerald-950/50 rounded w-3/4" />
                            </div>
                          ) : (
                            <ul className="list-disc list-inside text-xs leading-relaxed space-y-1.5 text-emerald-200">
                              {result.strengths && result.strengths.length > 0 ? (
                                result.strengths.map((str: string, index: number) => (
                                  <li key={index}>{str}</li>
                                ))
                              ) : (
                                <li>Loading strengths...</li>
                              )}
                            </ul>
                          )}
                        </CardContent>
                      </Card>

                      {/* Weaknesses */}
                      <Card className="border-rose-500/10 bg-rose-500/5">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold text-rose-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-400" /> Resume Weaknesses
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {loadingSuggestions ? (
                            <div className="space-y-2 animate-pulse">
                              <div className="h-2.5 bg-rose-950/50 rounded w-4/5" />
                              <div className="h-2.5 bg-rose-950/50 rounded w-11/12" />
                              <div className="h-2.5 bg-rose-950/50 rounded w-3/4" />
                            </div>
                          ) : (
                            <ul className="list-disc list-inside text-xs leading-relaxed space-y-1.5 text-rose-200">
                              {result.weaknesses && result.weaknesses.length > 0 ? (
                                result.weaknesses.map((weak: string, index: number) => (
                                  <li key={index}>{weak}</li>
                                ))
                              ) : (
                                <li>Loading weaknesses...</li>
                              )}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Overall ATS Explanation */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle>Final ATS Feedback & Next Steps</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm leading-relaxed">
                        <div>
                          <h4 className="font-semibold text-white mb-1.5">Detailed ATS Feedback</h4>
                          {loadingDetailed ? (
                            <div className="space-y-2 animate-pulse">
                              <div className="h-3 bg-neutral-900 rounded w-full" />
                              <div className="h-3 bg-neutral-900 rounded w-5/6" />
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-xs">{result.atsFeedback || "Detailed feedback is completed."}</p>
                          )}
                        </div>
                        {result.gapAnalysis && (
                          <div className="pt-2">
                            <h4 className="font-semibold text-white mb-1.5">Gap Analysis</h4>
                            {loadingDetailed ? (
                              <div className="h-3.5 bg-neutral-900 rounded w-2/3 animate-pulse" />
                            ) : (
                              <p className="text-muted-foreground text-xs">
                                {Array.isArray(result.gapAnalysis) ? result.gapAnalysis.join(" ") : result.gapAnalysis}
                              </p>
                            )}
                          </div>
                        )}
                        {result.nextSteps && (
                          <div className="pt-2">
                            <h4 className="font-semibold text-white mb-1.5">Actionable Checklist</h4>
                            {loadingDetailed ? (
                              <div className="space-y-2 animate-pulse bg-slate-950 p-4 rounded-xl border border-white/5">
                                <div className="h-3 bg-neutral-900 rounded w-11/12" />
                                <div className="h-3 bg-neutral-900 rounded w-4/5" />
                                <div className="h-3 bg-neutral-900 rounded w-3/4" />
                              </div>
                            ) : (
                              <div className="text-xs bg-slate-950 p-4 rounded-xl space-y-1.5 text-muted-foreground border border-white/5 whitespace-pre-line font-mono">
                                {Array.isArray(result.nextSteps) ? result.nextSteps.join("\n") : result.nextSteps}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* TAB CONTENT: SKILLS LIST */}
                {activeTab === "skills" && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle>Detailed Skill Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {result.keywordAnalysis && (
                          <div className="text-xs text-muted-foreground leading-relaxed p-3 bg-slate-900/30 rounded-xl border border-white/5">
                            <strong>Keyword Analysis: </strong> {result.keywordAnalysis}
                          </div>
                        )}

                        <div className="mb-4">
                          <p className="font-medium mb-2 flex items-center gap-2 text-sm text-white">
                            <CheckCircle2 className="text-green-500 w-4 h-4" /> Matched Skills
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {result.matched.map((s: string) => (
                              <Badge key={s} className="bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20">{s}</Badge>
                            ))}
                            {result.matched.length === 0 && <span className="text-xs text-muted-foreground">No matches found.</span>}
                          </div>
                        </div>

                        <div>
                          <p className="font-medium mb-2 flex items-center gap-2 text-sm text-white">
                            <AlertTriangle className="text-red-500 w-4 h-4" /> Missing Skills
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {result.missing.map((s: string) => (
                              <Badge key={s} variant="destructive" className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">{s}</Badge>
                            ))}
                            {result.missing.length === 0 && <span className="text-xs text-muted-foreground">No missing skills required.</span>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                <Button 
                  onClick={() => navigate("/tailor")}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer h-11"
                >
                  Continue to AI Resume Tailor →
                </Button>

              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobAnalysisPage;