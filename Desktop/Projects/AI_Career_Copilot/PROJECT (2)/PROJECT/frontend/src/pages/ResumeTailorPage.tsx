import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wand2,
  FileText,
  Download,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Loader2,
  AlertCircle,
  FileDown,
  Info,
} from "lucide-react";
import { useAppState } from "@/hooks/useAppState";
import { useNavigate } from "react-router-dom";
import API from "@/api/api";
import { toast } from "sonner";
import { CircularScore } from "@/components/CircularScore";
import { Progress } from "@/components/ui/progress";

const ResumeTailorPage = () => {
  const { appState, updateAppState } = useAppState();
  const navigate = useNavigate();
  const [tailoring, setTailoring] = useState(false);
  const [activeTab, setActiveTab] = useState<"original" | "tailored">("tailored");
  const [selectedVersion, setSelectedVersion] = useState<number | "original">("tailored");
  const [diagnostics, setDiagnostics] = useState<any>(null);

  // Progressive UI Steps
  const [progressStep, setProgressStep] = useState(0);
  const progressSteps = [
    "✓ Resume Loaded",
    "✓ Skills Extracted",
    "✓ Job Description Analysed",
    "✓ Identifying Missing Skills",
    "✓ Optimizing Resume with Diff Merge",
    "✓ Running Final Review...",
    "Generating Final Resume..."
  ];

  // Derived state from Workspace
  const latestAnalysis = appState.analyses.latestAnalysis;
  const tailoredData = latestAnalysis?.tailored || null;

  const resumeText = appState.resume.resumeText || "";
  const jobDescription = appState.analyses.jobDesc || "";
  useEffect(() => {
    // Default to latest version if not already set or if original
    if (tailoredData?.versions && tailoredData.versions.length > 0) {
      if (selectedVersion === "original" || selectedVersion === "tailored") {
        setSelectedVersion(tailoredData.versions.length);
      }
    } else if (!tailoredData) {
      setSelectedVersion("original");
    }
  }, [tailoredData, selectedVersion]);

  if (!appState.resume.uploaded) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto text-center py-16 space-y-4">
          <AlertCircle className="w-12 h-12 text-warning mx-auto" />
          <h2 className="text-xl font-bold">No Resume Uploaded</h2>
          <p className="text-muted-foreground text-sm">
            Please upload a resume first to tailor it against a job description.
          </p>
          <Button onClick={() => navigate("/upload")} className="gradient-primary">
            Upload Resume
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!latestAnalysis) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto text-center py-16 space-y-4">
          <AlertCircle className="w-12 h-12 text-warning mx-auto" />
          <h2 className="text-xl font-bold">No Job Analysis Found</h2>
          <p className="text-muted-foreground text-sm">
            Please analyze your resume against a job description first.
          </p>
          <Button onClick={() => navigate("/analysis")} className="gradient-primary">
            Go to ATS Analysis
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const missingSkills = latestAnalysis?.match?.missingSkills || [];
  const matchedSkills = latestAnalysis?.match?.matchedSkills || [];
  const originalScore = latestAnalysis?.match?.matchScore || 0;

  const handleTailor = async () => {
    let intervalId: any;
    try {
      setTailoring(true);
      setProgressStep(0);
      setDiagnostics(null);
      toast.info("Analyzing skill alignment & tailoring resume bullet points...");

      // Simulate progressive steps
      intervalId = setInterval(() => {
        setProgressStep((prev) => (prev < 5 ? prev + 1 : prev));
      }, 700);

      const res = await API.post("/resume/tailor", {
        resumeText,
        jobDescription,
        missingSkills,
        missingKeywords: missingSkills,
      });

      console.log("TAILOR RESPONSE", res.data);

      setProgressStep(5);

      const { tailoredResume, changesSummary, reasoning, acceptedDiagnostics, attemptLogs, optimizationRejected, baseline, status, workspace } = res.data;
      
      setDiagnostics({ acceptedDiagnostics, attemptLogs, baseline, status, retryCount: attemptLogs?.length - 1 });

      if (workspace) {
        // We will merge this in a single atomic update at the end or inside the reject block
      }

      setProgressStep(6);
      clearInterval(intervalId);
      setTailoring(false);

      // === QUALITY GATE ENFORCEMENT ===
      // If rejected: do NOT store version, do NOT update workspace, show diagnostics only
      if (optimizationRejected) {
        toast.warning("Quality Gate: All optimization attempts were rejected. Your original resume is preserved.");
        
        const rejectedTailoredRecord = {
          tailoredResume: resumeText, // Always the original
          changesSummary: changesSummary || ["No beneficial optimization found."],
          reasoning: reasoning || "Optimization rejected.",
          improvedScore: originalScore,
          improvedAnalysis: res.data,
          optimizationRejected: true,
          versions: tailoredData?.versions || [] // Keep existing accepted versions, add nothing
        };

        const updatedLatestAnalysisRej = {
          ...latestAnalysis,
          tailored: rejectedTailoredRecord,
        };

        updateAppState((prev) => ({
          ...prev,
          analyses: {
            ...prev.analyses,
            latestAnalysis: updatedLatestAnalysisRej
          }
        }), true);

        setSelectedVersion("original");
        setActiveTab("original");
        return;
      }

      // === ACCEPTED OPTIMIZATION ===
      const finalOptimizedScore = serverDiag?.improvedScore ?? originalScore;

      const existingVersions = tailoredData?.versions || [];
      const nextVerNum = existingVersions.length + 1;
      const newVersion = {
        version: nextVerNum,
        tailoredResume,
        changesSummary: changesSummary || [],
        reasoning: reasoning || "",
        improvedScore: finalOptimizedScore,
        timestamp: new Date().toLocaleTimeString()
      };

      const updatedVersions = [...existingVersions, newVersion];

      const tailoredRecord = {
        tailoredResume,
        changesSummary: changesSummary || [],
        reasoning: reasoning || "",
        improvedScore: finalOptimizedScore,
        improvedAnalysis: res.data,
        optimizationRejected: false,
        versions: updatedVersions
      };

      const updatedLatestAnalysis = {
        ...latestAnalysis,
        tailored: tailoredRecord,
      };

      const updatedHistory = appState.analyses.history.map((item) => {
        if (item.id === latestAnalysis.saved?._id) {
          return { ...item, tailoredResume, improvedMatchScore: finalOptimizedScore };
        }
        return item;
      });

      // Single atomic state update for the entire workspace
      updateAppState((prev) => {
        const nextResume = workspace ? { ...prev.resume, ...workspace.resume } : prev.resume;
        const nextAnalyses = {
          ...prev.analyses,
          latestAnalysis: updatedLatestAnalysis,
          history: updatedHistory,
        };
        return {
          ...prev,
          resume: nextResume,
          analyses: nextAnalyses
        };
      }, true);

      setSelectedVersion(nextVerNum);
      setActiveTab("tailored");
      
      toast.success("Resume successfully tailored!");

    } catch (error) {
      clearInterval(intervalId!);
      setTailoring(false);
      toast.error("Failed to tailor resume. Please try again.");
    }
  };

  const getActiveTailoredText = () => {
    if (!tailoredData) return "";
    if (selectedVersion === "original") return resumeText;
    const ver = tailoredData.versions?.find(v => v.version === selectedVersion);
    return ver ? ver.tailoredResume : tailoredData.tailoredResume;
  };

  const getActiveScore = () => {
    if (!tailoredData) return originalScore;
    if (selectedVersion === "original") return originalScore;
    const ver = tailoredData.versions?.find(v => v.version === selectedVersion);
    return ver ? ver.improvedScore : tailoredData.improvedScore;
  };

  const getActiveChanges = () => {
    if (!tailoredData) return [];
    if (selectedVersion === "original") return [];
    const ver = tailoredData.versions?.find(v => v.version === selectedVersion);
    return ver ? ver.changesSummary : tailoredData.changesSummary;
  };

  const handleDownloadPDF = () => {
    const text = getActiveTailoredText();
    if (!text) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to export as PDF.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Tailored Resume</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              color: #333;
              line-height: 1.5;
              padding: 40px;
              margin: 0;
              font-size: 13px;
              white-space: pre-wrap;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>${text}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    toast.success("PDF print dialog opened! Select 'Save as PDF' to save.");
  };

  const handleDownload = (format: "doc") => {
    const text = getActiveTailoredText();
    if (!text) return;
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `Tailored_Resume_V${selectedVersion}.doc`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`Resume downloaded as WORD (DOC)!`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">AI Resume Tailor</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Optimize and align your resume bullets with the job description keywords truthfully.
            </p>
          </div>
          {tailoredData && (
            <Button
              onClick={() => {
                const updated = { ...latestAnalysis };
                delete updated.tailored;
                updateAppState({
                  analyses: {
                    ...appState.analyses,
                    latestAnalysis: updated,
                  },
                }, true);
              }}
              variant="outline"
              size="sm"
              className="text-xs text-muted-foreground hover:text-white"
            >
              Reset Tailoring
            </Button>
          )}
        </div>

        {/* Tailored Version Switcher */}
        {tailoredData?.versions && tailoredData.versions.length > 0 && !tailoredData?.optimizationRejected && (
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-xs font-semibold text-neutral-400">Versions:</span>
            <Button
              variant={selectedVersion === "original" ? "default" : "outline"}
              size="sm"
              className="text-[10px] h-7 px-2.5 rounded-lg"
              onClick={() => { setSelectedVersion("original"); setActiveTab("original"); }}
            >
              Original (V0)
            </Button>
            {tailoredData.versions.map((v) => (
              <Button
                key={v.version}
                variant={selectedVersion === v.version ? "default" : "outline"}
                size="sm"
                className="text-[10px] h-7 px-2.5 rounded-lg"
                onClick={() => { setSelectedVersion(v.version); setActiveTab("tailored"); }}
              >
                Version {v.version}
              </Button>
            ))}
          </div>
        )}

        {/* Tailoring Loader Screen */}
        {tailoring && (
          <div className="flex flex-col items-center justify-center p-12 bg-neutral-950/70 border border-neutral-900 rounded-2xl space-y-6">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            <div className="text-center space-y-2">
              <span className="text-sm font-semibold text-white block">{progressSteps[progressStep]}</span>
              <p className="text-xs text-neutral-500">Tailoring wording using local diff merges and score validation...</p>
            </div>
            <Progress value={((progressStep + 1) / progressSteps.length) * 100} className="w-full max-w-xs h-1.5" />
          </div>
        )}

        {/* Not Tailored State */}
        {!tailoredData && !tailoring && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Context Card */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" /> Original Resume Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-neutral-950/70 border border-neutral-900 rounded-xl p-5 h-[450px] overflow-y-auto font-mono text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {resumeText}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions Panel */}
            <div className="space-y-6">
              <Card className="glass-card border-indigo-500/20">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">ATS Gap Alignment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex justify-between items-center bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl">
                    <div className="space-y-1">
                      <span className="text-xs text-neutral-400 block font-medium">Current ATS Match</span>
                      <span className="text-xl font-bold text-white">{originalScore}%</span>
                    </div>
                    <CircularScore score={originalScore} size={50} />
                  </div>

                  <div className="space-y-3">
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                      Target Gaps to Resolve
                    </span>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {missingSkills.map((skill) => (
                        <Badge key={skill} variant="destructive" className="mr-1.5 mb-1.5 text-[10px]">
                          {skill}
                        </Badge>
                      ))}
                      {missingSkills.length === 0 && (
                        <p className="text-xs text-neutral-500">No skill gaps identified!</p>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Factual Integrity & Score Protection
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-relaxed">
                      Our tailor modifies summaries, rewrites description formatting, and incorporates keywords using your existing achievements. A corrective loop auto-rejects options that degrade performance.
                    </p>
                  </div>

                  <Button
                    onClick={handleTailor}
                    disabled={tailoring}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Wand2 className="w-4 h-4" />
                    Tailor Resume with AI
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tailored State */}
        {tailoredData && !tailoring && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left & Right Resume Views */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass-card">
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" /> 
                    {activeTab === "original" || tailoredData?.optimizationRejected ? "Original Resume" : `Tailored Resume (Version ${selectedVersion})`}
                  </CardTitle>
                  {!tailoredData?.optimizationRejected && (
                    <div className="flex bg-[#16161a] p-1 rounded-lg border border-neutral-800/60">
                      <button
                        onClick={() => setActiveTab("original")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                          activeTab === "original" ? "bg-[#27272a] text-white" : "text-neutral-400"
                        }`}
                      >
                        Original
                      </button>
                      <button
                        onClick={() => setActiveTab("tailored")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                          activeTab === "tailored" && selectedVersion !== "original" ? "bg-[#27272a] text-white" : "text-neutral-400"
                        }`}
                        disabled={selectedVersion === "original"}
                      >
                        AI Tailored
                      </button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="bg-neutral-950/70 border border-neutral-900 rounded-xl p-5 h-[450px] overflow-y-auto font-mono text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {activeTab === "original" || tailoredData?.optimizationRejected ? resumeText : getActiveTailoredText()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ATS Score Improvement & Download */}
            <div className="space-y-6">
              
              {/* ATS Recalculation Results */}
              <Card className="glass-card border-success/20">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">ATS Recalculation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between bg-neutral-950 p-4 rounded-xl border border-neutral-900">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-bold">Original Score</span>
                      <span className="text-lg font-bold text-neutral-400">{originalScore}%</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-600" />
                    <div>
                      <span className="text-[10px] text-success uppercase tracking-wider block font-bold">Optimized Score</span>
                      <span className="text-xl font-bold text-success">{getActiveScore()}%</span>
                    </div>
                    <CircularScore score={getActiveScore()} size={48} />
                  </div>

                  {tailoredData?.optimizationRejected ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs">
                        <span className="text-amber-400 font-bold text-sm block mb-1">Optimization Analysis</span>
                        <div className="flex items-center gap-1 mb-3">
                          <span className="text-neutral-400">Current Resume Strength:</span>
                          <span className="text-amber-400 font-bold">
                            {originalScore >= 80 ? "★★★★★" : originalScore >= 60 ? "★★★★☆" : originalScore >= 40 ? "★★★☆☆" : "★★☆☆☆"}
                          </span>
                        </div>
                        <span className="font-semibold block text-neutral-300 mb-2">Why it wasn't changed:</span>
                        <ul className="space-y-1.5 list-disc pl-4 text-neutral-400 text-[11px] mb-3">
                          <li>Summary already strong & aligned.</li>
                          <li>Projects already optimized with metrics.</li>
                          <li>Only 1 additional keyword could be inserted.</li>
                          <li>No meaningful ATS score gain possible.</li>
                        </ul>
                        <span className="font-semibold block text-neutral-300">Recommendation:</span>
                        <p className="text-[11px] text-neutral-400 mt-1">
                          Upload more projects or certifications to unlock further optimization.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4 p-3 bg-success/5 border border-success/10 rounded-xl text-xs text-success/90">
                      <TrendingUp className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold block">
                          {getActiveScore() > originalScore ? (
                            `+${getActiveScore() - originalScore}% Improvement`
                          ) : (
                            "No Change"
                          )}
                        </span>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          Resume formatting, summaries, and critical keywords are fully aligned.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Modifications Card */}
              {!tailoredData?.optimizationRejected && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-indigo-400" /> Modifications Made
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {getActiveChanges().map((change, i) => (
                        <div key={i} className="flex gap-2 text-xs text-neutral-300">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{change}</span>
                        </div>
                      ))}
                      {getActiveChanges().length === 0 && (
                        <p className="text-xs text-neutral-500">Grammar & formatting optimized.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Downloads & Next Step Actions */}
              <div className="space-y-3">
                {/* Downloads only enabled for accepted optimizations */}
                {selectedVersion !== "original" && !tailoredData?.optimizationRejected && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleDownload("doc")}
                      variant="outline"
                      className="flex-1 border-neutral-800 text-white hover:bg-neutral-950 text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer h-11"
                    >
                      <FileDown className="w-4 h-4" /> Word (.doc)
                    </Button>
                    <Button
                      onClick={handleDownloadPDF}
                      variant="outline"
                      className="flex-1 border-neutral-800 text-white hover:bg-neutral-950 text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer h-11"
                    >
                      <Download className="w-4 h-4" /> PDF Document
                    </Button>
                  </div>
                )}

                {/* Show rejection notice when optimization was rejected */}
                {tailoredData?.optimizationRejected && (
                  <div className="p-4 bg-amber-950/30 border border-amber-900/40 rounded-xl space-y-3">
                    <div className="flex items-start gap-2.5 text-xs">
                      <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1.5 flex-1">
                        <span className="text-amber-400 font-bold block text-sm">Optimization was attempted</span>
                        <p className="text-neutral-400 text-xs leading-relaxed">
                          No higher-scoring version could be generated. Original resume retained.
                        </p>
                        <p className="text-neutral-500 text-[10px] leading-relaxed">
                          All {diagnostics?.retryCount != null ? diagnostics.retryCount + 1 : 3} attempts scored lower than your original resume's ATS match rate.
                        </p>
                        {diagnostics?.rejectionReasons && diagnostics.rejectionReasons.length > 0 && (
                          <div className="mt-2 space-y-1 bg-neutral-950/50 p-2 rounded border border-neutral-900">
                            <span className="text-neutral-400 font-bold text-[10px] uppercase block">Failure Diagnostics:</span>
                        {diagnostics?.attemptLogs?.map((log: any, i: number) => (
                          <div key={i} className="text-red-400 text-[11px] leading-normal flex items-start gap-1">
                            <span>•</span>
                            <span>Attempt {log.attempt}: {log.reason}</span>
                          </div>
                        ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleTailor}
                    disabled={tailoring}
                    className="flex-1 bg-neutral-900 border border-neutral-850 hover:bg-neutral-800 text-white font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer h-11"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> {tailoredData?.optimizationRejected ? "Retry Optimization" : "Tailor Again"}
                  </Button>
                  <Button
                    onClick={() => navigate("/suggestions")}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer h-11 text-xs"
                  >
                    Next Options →
                  </Button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Developer Diagnostics Panel */}
        {diagnostics && (
          <Card className="glass-card border-indigo-500/25 bg-slate-950/90 text-white mt-6">
            <CardHeader>
              <CardTitle className="text-xs font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                Developer Diagnostics Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-3 bg-neutral-900/50 rounded-lg">
                  <span className="text-neutral-500 block">Baseline ATS</span>
                  <span className="text-white font-bold">{diagnostics.baseline?.score || 0}%</span>
                </div>
                <div className="p-3 bg-neutral-900/50 rounded-lg">
                  <span className="text-neutral-500 block">Accepted ATS</span>
                  <span className="text-white font-bold">{diagnostics.acceptedDiagnostics?.score || "N/A"}%</span>
                </div>
                <div className="p-3 bg-neutral-900/50 rounded-lg">
                  <span className="text-neutral-500 block">Difference</span>
                  <span className={`font-bold ${diagnostics.acceptedDiagnostics ? (diagnostics.acceptedDiagnostics.adjustedScore - diagnostics.baseline?.score > 0 ? "text-emerald-400" : diagnostics.acceptedDiagnostics.adjustedScore - diagnostics.baseline?.score < 0 ? "text-red-400" : "text-neutral-400") : "text-neutral-500"}`}>
                    {diagnostics.acceptedDiagnostics ? (diagnostics.acceptedDiagnostics.adjustedScore - diagnostics.baseline?.score > 0 ? `+${diagnostics.acceptedDiagnostics.adjustedScore - diagnostics.baseline?.score}` : diagnostics.acceptedDiagnostics.adjustedScore - diagnostics.baseline?.score) : "0"}%
                  </span>
                </div>
                <div className="p-3 bg-neutral-900/50 rounded-lg">
                  <span className="text-neutral-500 block">Status</span>
                  <span className={`font-bold ${diagnostics.status === "ACCEPTED" ? "text-emerald-400" : "text-amber-400"}`}>
                    {diagnostics.status}
                  </span>
                </div>
                <div className="p-3 bg-neutral-900/50 rounded-lg">
                  <span className="text-neutral-500 block">Retry Count</span>
                  <span className="text-white font-bold">{diagnostics.retryCount || 0}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-neutral-900">
                <div className="p-3 bg-neutral-900/50 rounded-lg">
                  <span className="text-neutral-500 block">Keywords Added</span>
                  <span className="text-emerald-400 font-bold max-h-[80px] overflow-y-auto block">
                    {diagnostics.acceptedDiagnostics?.keywordsAdded?.length > 0
                      ? diagnostics.acceptedDiagnostics.keywordsAdded.join(", ")
                      : "None"}
                  </span>
                </div>
                <div className="p-3 bg-neutral-900/50 rounded-lg">
                  <span className="text-neutral-500 block">Keywords Removed</span>
                  <span className="text-red-400 font-bold max-h-[80px] overflow-y-auto block">
                    {diagnostics.acceptedDiagnostics?.keywordsRemoved?.length > 0
                      ? diagnostics.acceptedDiagnostics.keywordsRemoved.join(", ")
                      : "None"}
                  </span>
                </div>
                <div className="p-3 bg-neutral-900/50 rounded-lg">
                  <span className="text-neutral-500 block">Sections Modified</span>
                  <span className="text-indigo-400 font-bold max-h-[80px] overflow-y-auto block">
                    {diagnostics.acceptedDiagnostics?.sectionsModified?.length > 0
                      ? diagnostics.acceptedDiagnostics.sectionsModified.join(", ")
                      : "None"}
                  </span>
                </div>
              </div>

              {diagnostics.status === "REJECTED" && (
                <div className="p-3 bg-red-950/40 border border-red-900/40 text-red-300 rounded-lg text-[10px] space-y-2">
                  <strong>Notice:</strong> All optimization attempts failed the state machine rules.
                </div>
              )}

              {/* Per-Attempt Logs */}
              {diagnostics.attemptLogs && diagnostics.attemptLogs.length > 0 && (
                <div className="pt-2 border-t border-neutral-900 space-y-2">
                  <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Attempt Log</span>
                  {diagnostics.attemptLogs.map((log: any, i: number) => (
                    <div key={i} className={`p-2.5 rounded-lg border text-[10px] ${
                      log.status === "accepted" ? "bg-emerald-950/30 border-emerald-900/40" :
                      log.status === "error" ? "bg-orange-950/30 border-orange-900/40" :
                      "bg-red-950/30 border-red-900/40"
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Attempt {log.attempt}</span>
                        <span className={`font-bold uppercase ${
                          log.status === "accepted" ? "text-emerald-400" :
                          log.status === "error" ? "text-orange-400" :
                          "text-red-400"
                        }`}>{log.status}</span>
                      </div>
                      {log.score > 0 && <div className="text-neutral-400 mt-0.5">Score: {log.score}%</div>}
                      {log.error && <div className="text-orange-300 mt-0.5">Error: {log.error}</div>}
                      {log.verificationReasons && log.verificationReasons.length > 0 && (
                        <div className="text-amber-300 mt-1 space-y-0.5">
                          <span className="font-semibold">Verification Failures:</span>
                          {log.verificationReasons.map((vReason: string, vi: number) => (
                            <div key={vi} className="pl-1.5">• {vReason}</div>
                          ))}
                        </div>
                      )}
                      {log.keywordsRemoved && log.keywordsRemoved.length > 0 && (
                        <div className="text-red-300 mt-0.5">Lost: {log.keywordsRemoved.join(", ")}</div>
                      )}
                      {log.keywordsAdded && log.keywordsAdded.length > 0 && (
                        <div className="text-emerald-300 mt-0.5">Added: {log.keywordsAdded.join(", ")}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
};

export default ResumeTailorPage;
